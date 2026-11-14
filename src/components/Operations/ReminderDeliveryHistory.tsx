import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Clock, Loader2, Mail, RefreshCw } from "lucide-react";

/*
 * Operations > Reminders > Delivery history.
 *
 * Pages through POST /operations/reminders/deliveries, the backend's
 * ReminderDelivery log: one row per attempt (daily summary, inactivity alert),
 * from the 21:30 cron, the threshold auto-send and "Send now", for the client
 * the operator has open. Above it, the next scheduled send of each enabled
 * item, computed by the backend with the worker's own due rule.
 */

/** "partial" only appears on rows logged before email became the only channel. */
type Status = "sent" | "partial" | "failed" | "skipped";
type StatusFilter = "all" | "sent" | "failed" | "skipped";

interface DeliveryRow {
  id: string;
  clientEmail: string;
  clientName?: string;
  itemKey: string;
  periodKey?: string;
  trigger?: string;
  status: Status;
  reason?: string;
  subject?: string;
  email?: { attempted?: boolean; ok?: boolean; to?: string; error?: string };
  stats?: { added?: number; applied?: number };
  at: string;
}

interface DeliveriesResponse {
  success: boolean;
  message?: string;
  rows: DeliveryRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  counts: Partial<Record<Status, number>>;
  scheduled: ScheduledSend[];
}

interface ScheduledSend {
  itemKey: string;
  at: string;
  dueNow: boolean;
  /** Skipped on a day with nothing added (the daily summary). */
  activityGated: boolean;
  autoOnThreshold: boolean;
}

interface Props {
  apiBaseUrl: string;
  opsKey: string;
  clientEmail: string;
  /** itemKey -> label, from the catalogue the reminders API ships. */
  itemLabels: Map<string, string>;
  /** Bump to reload, e.g. after a "Send now". */
  refreshToken?: number;
}

const PAGE_SIZE = 25;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Failed" },
  { key: "skipped", label: "Skipped" }
];

const PILL: Record<Status, string> = {
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  skipped: "bg-slate-100 text-slate-600 border-slate-200",
  failed: "bg-red-50 text-red-700 border-red-200"
};

const TRIGGER_LABEL: Record<string, string> = {
  cron: "Scheduled",
  "auto-threshold": "Auto (threshold)",
  manual: "Send now"
};

const REASON_LABEL: Record<string, string> = {
  ok: "",
  nothing_added: "No roles added that day, so nothing is sent",
  no_activity: "No activity in the period",
  client_is_active: "Client is active",
  no_channel: "No channel enabled",
  no_destination: "No email address on file"
};

function humanReason(reason: string | undefined): string {
  const r = String(reason || "");
  if (r in REASON_LABEL) return REASON_LABEL[r];
  return r.replace(/_/g, " ");
}

/** "Today", "Tomorrow" or "14 Nov", judged in IST. */
function istDayLabel(value: string): string {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "";
  const now = new Date();
  if (day(target) === day(now)) return "Today";
  if (day(target) === day(new Date(now.getTime() + 864e5))) return "Tomorrow";
  return target.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short" });
}

function istStamp(value: string): { date: string; time: string } {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "unknown", time: "" };
  return {
    date: d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) + " IST"
  };
}

function ChannelCell({
  icon,
  attempted,
  ok,
  detail,
  error
}: {
  icon: React.ReactNode;
  attempted?: boolean;
  ok?: boolean;
  detail?: string;
  error?: string;
}) {
  if (!attempted) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400" title={error || "Not sent on this channel"}>
        {icon}
        {error ? humanReason(error) : "not sent"}
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 flex-col">
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${ok ? "text-emerald-700" : "text-red-700"}`}>
        {icon}
        {ok ? "Delivered" : "Failed"}
      </span>
      {detail && <span className="truncate text-[11px] text-gray-500" title={detail}>{detail}</span>}
      {!ok && error && <span className="truncate text-[11px] text-red-600" title={error}>{error}</span>}
    </span>
  );
}

export default function ReminderDeliveryHistory({ apiBaseUrl, opsKey, clientEmail, itemLabels, refreshToken = 0 }: Props) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  const [data, setData] = useState<DeliveriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Any filter change starts again from page 1.
  useEffect(() => {
    setPage(1);
  }, [status, from, to, clientEmail]);

  const body = useMemo(
    () => ({
      clientEmail,
      status,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize: PAGE_SIZE
    }),
    [clientEmail, status, from, to, page]
  );

  useEffect(() => {
    if (!clientEmail) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${apiBaseUrl}/operations/reminders/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ops-key": opsKey },
      body: JSON.stringify(body),
      signal: controller.signal
    })
      .then(async (res) => {
        const parsed = (await res.json().catch(() => null)) as DeliveriesResponse | null;
        if (!res.ok || !parsed?.success) {
          throw new Error(parsed?.message || (res.status === 401 ? "Ops key rejected" : `HTTP ${res.status}`));
        }
        setData(parsed);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load the history");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiBaseUrl, opsKey, body, clientEmail, refreshToken, reloadTick]);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  const counts = data?.counts;
  const countFor = (key: StatusFilter): number | null => {
    if (!counts) return null;
    const n = (k: Status) => counts[k] ?? 0;
    if (key === "all") return n("sent") + n("partial") + n("failed") + n("skipped");
    return n(key);
  };

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(total, page * PAGE_SIZE);
  const rows = data?.rows ?? [];
  const scheduled = data?.scheduled ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-indigo-50 px-5 py-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Clock className="h-4 w-4 text-indigo-600" />
            Delivery history
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Every reminder attempt: when it ran, where it went and whether it arrived. Times are IST.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            aria-label="Reload history"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {data && (
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <CalendarClock className="h-3.5 w-3.5 text-indigo-600" />
            Scheduled
          </p>
          {scheduled.length === 0 ? (
            <p className="text-xs text-gray-500">
              Nothing scheduled. Every report for this client is switched off or has no channel.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {scheduled.map((s) => {
                const when = istStamp(s.at);
                return (
                  <li
                    key={s.itemKey}
                    className="flex min-w-0 items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{itemLabels.get(s.itemKey) || s.itemKey}</p>
                      <p className="text-[11px] text-gray-600">
                        {s.dueNow ? (
                          <>Due now, goes out within 5 minutes</>
                        ) : (
                          <>
                            {istDayLabel(s.at)}, {when.time}
                          </>
                        )}
                        {s.activityGated ? " · only if roles were added that day" : ""}
                        {s.autoOnThreshold ? " · or earlier once the threshold is reached" : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 xl:flex-row xl:items-end xl:justify-between">
        <div role="group" aria-label="Filter by result" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const n = countFor(f.key);
            const active = status === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatus(f.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {f.label}
                {n !== null && (
                  <span className={`tabular-nums ${active ? "text-indigo-100" : "text-gray-400"}`}>{n.toLocaleString()}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col text-[11px] font-medium text-gray-500">
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 h-8 rounded-lg border border-gray-200 px-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <label className="flex flex-col text-[11px] font-medium text-gray-500">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 h-8 rounded-lg border border-gray-200 px-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="h-8 rounded-lg px-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div role="alert" className="px-5 py-10 text-center">
          <p className="text-xs font-semibold text-red-700">Could not load the history: {error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Try again
          </button>
        </div>
      ) : !data && loading ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 text-gray-300" />
          <p className="text-xs text-gray-500">No reminder attempts match these filters.</p>
        </div>
      ) : (
        <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          <table className="min-w-full text-left">
            <thead className="bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="whitespace-nowrap px-5 py-2.5">When</th>
                <th scope="col" className="px-3 py-2.5">Report</th>
                <th scope="col" className="px-3 py-2.5">Result</th>
                <th scope="col" className="px-3 py-2.5">Email</th>
                <th scope="col" className="whitespace-nowrap px-5 py-2.5 text-right">Added / applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const when = istStamp(row.at);
                // A legacy "partial" row is judged by its email half alone.
                const shown: Status = row.status === "partial" ? (row.email?.ok ? "sent" : "failed") : row.status;
                const reason = shown === "sent" ? "" : humanReason(row.reason);
                return (
                  <tr key={row.id} className="align-top hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-5 py-3">
                      <p className="text-xs font-semibold text-gray-900">{when.date}</p>
                      <p className="text-[11px] text-gray-500">{when.time}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="whitespace-nowrap text-xs font-semibold text-gray-900">
                        {itemLabels.get(row.itemKey) || row.itemKey}
                      </p>
                      <p className="text-[11px] text-gray-500">{TRIGGER_LABEL[row.trigger || "cron"] || row.trigger}</p>
                    </td>
                    <td className="max-w-[240px] px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${PILL[shown] || PILL.skipped}`}>
                        {shown}
                      </span>
                      {reason && <p className="mt-1 text-[11px] text-gray-500" title={row.reason}>{reason}</p>}
                    </td>
                    <td className="max-w-[240px] px-3 py-3">
                      <ChannelCell
                        icon={<Mail className="h-3 w-3" />}
                        attempted={row.email?.attempted}
                        ok={row.email?.ok}
                        detail={row.email?.to}
                        error={row.email?.error}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs tabular-nums text-gray-700">
                      {row.stats?.added ?? 0} / {row.stats?.applied ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500" aria-live="polite">
          {total === 0 ? "No rows" : `Showing ${firstRow.toLocaleString()}-${lastRow.toLocaleString()} of ${total.toLocaleString()}`}
          {loading && data && <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-indigo-500" aria-label="Loading" />}
        </p>
        <nav aria-label="History pages" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="text-xs tabular-nums text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      </div>
    </section>
  );
}
