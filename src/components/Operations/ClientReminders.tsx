import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BellRing,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Info,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  X,
  Zap
} from "lucide-react";
import { toastUtils } from "../../utils/toast.ts";

/*
 * Operations > Client Reminders.
 *
 * Every row on the left is rendered from the catalogue the API ships
 * (Utils/reminderItems.js on the backend). Nothing about the seven items is
 * hardcoded here on purpose: when the catalogue grows a row appears without a
 * frontend deploy, and when an item's scheduleFields change the controls follow.
 *
 * The backend gates all of these routes behind the x-ops-key header, so the
 * secret key the operator typed into the unlock modal is threaded down as a
 * prop and attached to every request.
 */

type Cadence = "daily" | "weekly" | "monthly" | "event";

interface CatalogueDefaults {
  enabled?: boolean;
  channels?: { mattermost?: boolean; email?: boolean };
  sendAtIST?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  inactivityDays?: number;
}

interface CatalogueItem {
  key: string;
  label: string;
  description: string;
  cadence: Cadence;
  activityGated: boolean;
  scheduleFields: string[];
  defaults?: CatalogueDefaults;
}

interface ItemConfig {
  key: string;
  enabled: boolean;
  channels: { mattermost: boolean; email: boolean };
  sendAtIST: string;
  dayOfWeek: number;
  dayOfMonth: number;
  inactivityDays: number;
  lastPeriodKey: string;
  lastSentAt: string | null;
  lastStatus: string;
  lastError: string;
}

interface HistoryRow {
  at?: string;
  itemKey?: string;
  periodKey?: string;
  status?: string;
  email?: { attempted?: boolean; ok?: boolean; to?: string; error?: string };
  mattermost?: { attempted?: boolean; ok?: boolean; error?: string };
  stats?: { added?: number; applied?: number };
  trigger?: string;
}

interface ReminderConfig {
  clientEmail: string;
  clientName?: string;
  paymentEmailOverride?: string;
  mattermostWebhookUrl?: string;
  items?: ItemConfig[];
  history?: HistoryRow[];
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ActivityCounts {
  added: number;
  applied: number;
}

interface RemindersBundle {
  config: ReminderConfig;
  catalogue: CatalogueItem[];
  resolvedPaymentEmail: string;
  paymentEmailSource: "tracking" | "override" | "none";
  trackingMatched: boolean;
  smtpConfigured: boolean;
  workerEnabled: boolean;
  preview: { today: ActivityCounts; week: ActivityCounts };
}

interface ApiEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
}

interface GetResponse extends ApiEnvelope {
  data?: RemindersBundle;
}

interface SaveResponse extends ApiEnvelope {
  data?: { config: ReminderConfig };
}

interface PaymentEmailResponse extends ApiEnvelope {
  paymentEmail?: string;
  source?: "tracking" | "override" | "none";
}

interface TestWebhookResponse extends ApiEnvelope {
  ok?: boolean;
}

interface SendNowResponse extends ApiEnvelope {
  status?: "sent" | "partial" | "skipped" | "failed";
  reason?: string;
  email?: { attempted?: boolean; ok?: boolean; to?: string; error?: string };
  mattermost?: { attempted?: boolean; ok?: boolean; error?: string };
  stats?: { added?: number; applied?: number };
  periodKey?: string;
  subject?: string;
}

interface PreviewResponse extends ApiEnvelope {
  subject?: string;
  html?: string;
  text?: string;
  mattermostText?: string;
  isEmpty?: boolean;
  window?: { from?: string; to?: string; label?: string };
}

interface PreviewState {
  itemKey: string;
  label: string;
  subject: string;
  html: string;
  text: string;
  mattermostText: string;
  isEmpty: boolean;
  windowLabel: string;
}

interface ClientRemindersProps {
  apiBaseUrl: string;
  clientEmail: string;
  clientName?: string;
  opsKey: string;
  updatedBy: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_OF_MONTH_CHOICES = Array.from({ length: 28 }, (_, i) => i + 1);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CADENCE_LABEL: Record<Cadence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  event: "On event"
};

function isEmailish(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

function pickBool(primary: boolean | undefined, fallback: boolean | undefined): boolean {
  if (typeof primary === "boolean") return primary;
  if (typeof fallback === "boolean") return fallback;
  return false;
}

function pickInt(primary: unknown, fallback: unknown, last: number): number {
  if (typeof primary === "number" && Number.isFinite(primary)) return Math.trunc(primary);
  if (typeof fallback === "number" && Number.isFinite(fallback)) return Math.trunc(fallback);
  return last;
}

/**
 * The server already merges defaults, but the UI must never crash on a config
 * saved before a catalogue item existed. Rebuilding the list from the catalogue
 * guarantees catalogue order and a complete row for every key.
 */
function normalizeItems(catalogue: CatalogueItem[], raw: ItemConfig[] | undefined): ItemConfig[] {
  const byKey = new Map<string, ItemConfig>();
  (raw || []).forEach((item) => {
    if (item && typeof item.key === "string") byKey.set(item.key, item);
  });

  return catalogue.map((meta) => {
    const saved = byKey.get(meta.key);
    const defaults = meta.defaults || {};
    return {
      key: meta.key,
      enabled: pickBool(saved?.enabled, defaults.enabled),
      channels: {
        mattermost: pickBool(saved?.channels?.mattermost, defaults.channels?.mattermost),
        email: pickBool(saved?.channels?.email, defaults.channels?.email)
      },
      sendAtIST: saved?.sendAtIST || defaults.sendAtIST || "09:00",
      dayOfWeek: pickInt(saved?.dayOfWeek, defaults.dayOfWeek, 1),
      dayOfMonth: pickInt(saved?.dayOfMonth, defaults.dayOfMonth, 1),
      inactivityDays: pickInt(saved?.inactivityDays, defaults.inactivityDays, 3),
      lastPeriodKey: saved?.lastPeriodKey || "",
      lastSentAt: saved?.lastSentAt || null,
      lastStatus: saved?.lastStatus || "",
      lastError: saved?.lastError || ""
    };
  });
}

/** Only the operator-editable fields take part in the dirty check. */
function fingerprint(items: ItemConfig[], webhook: string): string {
  return JSON.stringify({
    webhook: webhook.trim(),
    items: items.map((i) => [
      i.key,
      i.enabled,
      i.channels.mattermost,
      i.channels.email,
      i.sendAtIST,
      i.dayOfWeek,
      i.dayOfMonth,
      i.inactivityDays
    ])
  });
}

/** "21:30, 21 Aug IST" - schedules are IST everywhere, so render stamps in IST too. */
function formatIstStamp(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit"
  });
  const date = d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short"
  });
  return `${time}, ${date} IST`;
}

function humanReason(reason: string): string {
  const map: Record<string, string> = {
    no_activity: "no activity in the period",
    client_is_active: "client is active",
    no_channel: "no channel enabled",
    no_destination: "no destination address",
    not_enabled: "item is switched off",
    no_threshold: "no milestone crossed"
  };
  return map[reason] || reason.replace(/_/g, " ");
}

type PillTone = "sent" | "partial" | "skipped" | "failed" | "idle";

function toneForStatus(status: string): PillTone {
  if (status === "sent") return "sent";
  if (status === "partial") return "partial";
  if (status === "skipped") return "skipped";
  if (status === "failed") return "failed";
  return "idle";
}

const PILL_CLASSES: Record<PillTone, string> = {
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  skipped: "bg-slate-100 text-slate-600 border-slate-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  idle: "bg-gray-50 text-gray-500 border-gray-200"
};

function StatusPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PILL_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
  label
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-gradient-to-r from-violet-600 to-indigo-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ChannelCheckbox({
  checked,
  disabled,
  onChange,
  label,
  hint
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label
      title={hint}
      className={`flex items-center gap-2 lg:justify-center ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed"
      />
      <span className="text-xs font-medium text-gray-600 lg:hidden">{label}</span>
    </label>
  );
}

function RowSkeleton() {
  return (
    <div className="animate-pulse px-5 py-5">
      <div className="flex items-start gap-3">
        <div className="h-6 w-11 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-52 rounded bg-gray-200" />
          <div className="h-3 w-full max-w-md rounded bg-gray-100" />
          <div className="h-8 w-64 rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  preview,
  onClose
}: {
  preview: PreviewState;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"email" | "mattermost">("email");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-4 text-white">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">{preview.label} preview</h3>
              <p className="mt-0.5 truncate text-xs text-white/80">
                {preview.windowLabel || "Current reporting window"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-gray-200 px-6 pt-4">
            <button
              type="button"
              onClick={() => setTab("email")}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "email"
                  ? "border-b-2 border-violet-600 text-violet-700"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setTab("mattermost")}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "mattermost"
                  ? "border-b-2 border-violet-600 text-violet-700"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Mattermost
            </button>
          </div>

          <div className="max-h-[65vh] overflow-y-auto bg-gray-50 p-6">
            {preview.isEmpty && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Ban className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Empty period, nothing would be sent
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    No jobs were added and no applications were submitted in this window. The
                    scheduler stays silent rather than delivering a blank report.
                  </p>
                </div>
              </div>
            )}

            {tab === "email" ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Subject
                </p>
                <p className="mb-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                  {preview.subject || "(no subject)"}
                </p>
                {preview.html ? (
                  <iframe
                    title="Reminder email preview"
                    srcDoc={preview.html}
                    sandbox=""
                    className="h-[420px] w-full rounded-xl border border-gray-200 bg-white"
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                    This item does not render an email body for the current window.
                  </p>
                )}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs leading-relaxed text-gray-800">
                {preview.mattermostText || "(no Mattermost message for this window)"}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientReminders({
  apiBaseUrl,
  clientEmail,
  clientName,
  opsKey,
  updatedBy
}: ClientRemindersProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [bundle, setBundle] = useState<RemindersBundle | null>(null);

  const [items, setItems] = useState<ItemConfig[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [baseline, setBaseline] = useState("");
  const [showWebhook, setShowWebhook] = useState(false);

  const [paymentEmail, setPaymentEmail] = useState("");
  const [paymentSource, setPaymentSource] = useState<"tracking" | "override" | "none">("none");
  const [savingPaymentEmail, setSavingPaymentEmail] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const [sendingKey, setSendingKey] = useState("");
  const [previewingKey, setPreviewingKey] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [noActivityKeys, setNoActivityKeys] = useState<string[]>([]);

  const applyBundle = useCallback((next: RemindersBundle) => {
    const catalogue = Array.isArray(next.catalogue) ? next.catalogue : [];
    const normalized = normalizeItems(catalogue, next.config?.items);
    const webhook = next.config?.mattermostWebhookUrl || "";
    setBundle(next);
    setItems(normalized);
    setWebhookUrl(webhook);
    setBaseline(fingerprint(normalized, webhook));
    setPaymentEmail(next.resolvedPaymentEmail || "");
    setPaymentSource(next.paymentEmailSource || "none");
  }, []);

  const call = useCallback(
    async <T,>(method: "POST" | "PUT", path: string, body: Record<string, unknown>): Promise<T> => {
      const res = await fetch(`${apiBaseUrl}/operations/reminders${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-ops-key": opsKey
        },
        body: JSON.stringify(body)
      });

      let parsed: unknown = null;
      try {
        parsed = await res.json();
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        const envelope = (parsed || {}) as ApiEnvelope;
        const detail =
          envelope.message || envelope.error || (res.status === 401 ? "unauthorized" : `HTTP ${res.status}`);
        throw new Error(detail);
      }
      return (parsed || {}) as T;
    },
    [apiBaseUrl, opsKey]
  );

  const load = useCallback(async () => {
    if (!clientEmail) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await call<GetResponse>("POST", "/get", { clientEmail });
      if (!data.success || !data.data) {
        throw new Error(data.message || data.error || "Could not load reminder settings");
      }
      applyBundle(data.data);
      setNoActivityKeys([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load reminder settings";
      setLoadError(message);
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [applyBundle, call, clientEmail]);

  useEffect(() => {
    load();
  }, [load]);

  const catalogue = useMemo(() => bundle?.catalogue || [], [bundle]);
  const savedWebhook = (bundle?.config?.mattermostWebhookUrl || "").trim();
  const hasWebhook = savedWebhook.length > 0;
  const hasPaymentEmail = Boolean((bundle?.resolvedPaymentEmail || "").trim());
  const dirty = baseline !== "" && baseline !== fingerprint(items, webhookUrl);
  const paymentEmailDirty = paymentEmail.trim() !== (bundle?.resolvedPaymentEmail || "").trim();
  const canSavePaymentEmail = paymentEmailDirty && isEmailish(paymentEmail) && !savingPaymentEmail;
  const history = useMemo(() => (bundle?.config?.history || []).slice(0, 8), [bundle]);

  const catalogueByKey = useMemo(() => {
    const map = new Map<string, CatalogueItem>();
    catalogue.forEach((meta) => map.set(meta.key, meta));
    return map;
  }, [catalogue]);

  const patchItem = useCallback((key: string, patch: Partial<ItemConfig>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }, []);

  const patchChannel = useCallback((key: string, channel: "mattermost" | "email", value: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, channels: { ...item.channels, [channel]: value } } : item
      )
    );
  }, []);

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const data = await call<SaveResponse>("PUT", "", {
        clientEmail,
        mattermostWebhookUrl: webhookUrl.trim(),
        items: items.map((item) => ({
          key: item.key,
          enabled: item.enabled,
          channels: { mattermost: item.channels.mattermost, email: item.channels.email },
          sendAtIST: item.sendAtIST,
          dayOfWeek: item.dayOfWeek,
          dayOfMonth: item.dayOfMonth,
          inactivityDays: item.inactivityDays
        })),
        updatedBy
      });
      const savedConfig = data.data?.config;
      if (!data.success || !savedConfig) {
        throw new Error(data.message || data.error || "Save failed");
      }
      // Reload from what the server actually persisted so clamped values
      // (dayOfMonth, inactivityDays, a rejected sendAtIST) show up immediately.
      setBundle((prev) => (prev ? { ...prev, config: savedConfig } : prev));
      const normalized = normalizeItems(catalogue, savedConfig.items);
      const webhook = savedConfig.mattermostWebhookUrl || "";
      setItems(normalized);
      setWebhookUrl(webhook);
      setBaseline(fingerprint(normalized, webhook));
      toastUtils.success("Reminder settings saved");
    } catch (err) {
      toastUtils.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentEmail = async () => {
    if (!canSavePaymentEmail) return;
    setSavingPaymentEmail(true);
    try {
      const data = await call<PaymentEmailResponse>("POST", "/payment-email", {
        clientEmail,
        paymentEmail: paymentEmail.trim(),
        updatedBy
      });
      if (!data.success) {
        throw new Error(data.message || data.error || "Could not save the payment email");
      }
      const savedEmail = data.paymentEmail || paymentEmail.trim();
      const source = data.source || "override";
      setPaymentEmail(savedEmail);
      setPaymentSource(source);
      setBundle((prev) =>
        prev ? { ...prev, resolvedPaymentEmail: savedEmail, paymentEmailSource: source } : prev
      );
      toastUtils.success("Payment email saved");
    } catch (err) {
      toastUtils.error(err instanceof Error ? err.message : "Could not save the payment email");
    } finally {
      setSavingPaymentEmail(false);
    }
  };

  const handleTestWebhook = async () => {
    const candidate = webhookUrl.trim();
    if (!candidate) {
      setWebhookTestResult({ ok: false, message: "Enter a webhook URL first" });
      return;
    }
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const data = await call<TestWebhookResponse>("POST", "/test-mattermost", {
        clientEmail,
        webhookUrl: candidate
      });
      if (data.success && data.ok) {
        setWebhookTestResult({ ok: true, message: "Test message delivered" });
      } else {
        setWebhookTestResult({
          ok: false,
          message: data.error || data.message || "Mattermost rejected the test message"
        });
      }
    } catch (err) {
      setWebhookTestResult({
        ok: false,
        message: err instanceof Error ? err.message : "Test failed"
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const runSendNow = async (itemKey: string, force: boolean) => {
    if (sendingKey) return;
    setSendingKey(itemKey);
    const label = catalogueByKey.get(itemKey)?.label || itemKey;
    try {
      const data = await call<SendNowResponse>("POST", "/send-now", {
        clientEmail,
        itemKey,
        force,
        updatedBy
      });
      if (!data.success) {
        throw new Error(data.message || data.error || "Send failed");
      }

      if (data.status === "skipped" && data.reason === "no_activity") {
        // Not an error. The product rule is that an empty period stays silent,
        // so the operator gets an explicit "Send anyway" escape hatch instead.
        setNoActivityKeys((prev) => (prev.includes(itemKey) ? prev : [...prev, itemKey]));
        toastUtils.custom(`${label}: nothing to report for this period`, "info");
      } else if (data.status === "skipped") {
        setNoActivityKeys((prev) => prev.filter((k) => k !== itemKey));
        toastUtils.custom(`${label} skipped: ${humanReason(data.reason || "skipped")}`, "info");
      } else if (data.status === "sent") {
        setNoActivityKeys((prev) => prev.filter((k) => k !== itemKey));
        toastUtils.success(`${label} sent`);
      } else if (data.status === "partial") {
        setNoActivityKeys((prev) => prev.filter((k) => k !== itemKey));
        const failure = data.email?.error || data.mattermost?.error || "one channel failed";
        toastUtils.custom(`${label} partially sent: ${failure}`, "info");
      } else {
        const failure = data.reason || data.email?.error || data.mattermost?.error || "unknown error";
        toastUtils.error(`${label} failed: ${humanReason(failure)}`);
      }

      // Pull the fresh lastStatus / history the delivery just wrote.
      try {
        const refreshed = await call<GetResponse>("POST", "/get", { clientEmail });
        if (refreshed.success && refreshed.data) {
          const keepDirty = dirty;
          const currentItems = items;
          const currentWebhook = webhookUrl;
          applyBundle(refreshed.data);
          if (keepDirty) {
            // Never throw away unsaved edits just because a send refreshed state.
            setItems(currentItems);
            setWebhookUrl(currentWebhook);
          }
        }
      } catch {
        /* the send already reported its own outcome, a stale panel is fine */
      }
    } catch (err) {
      toastUtils.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSendingKey("");
    }
  };

  const handlePreview = async (itemKey: string) => {
    if (previewingKey) return;
    setPreviewingKey(itemKey);
    const label = catalogueByKey.get(itemKey)?.label || itemKey;
    try {
      const data = await call<PreviewResponse>("POST", "/preview", { clientEmail, itemKey });
      if (!data.success) {
        throw new Error(data.message || data.error || "Preview failed");
      }
      setPreview({
        itemKey,
        label,
        subject: data.subject || "",
        html: data.html || "",
        text: data.text || "",
        mattermostText: data.mattermostText || "",
        isEmpty: data.isEmpty === true,
        windowLabel: data.window?.label || ""
      });
    } catch (err) {
      toastUtils.error(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewingKey("");
    }
  };

  if (!clientEmail) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-violet-100 to-indigo-100">
          <BellRing className="h-8 w-8 text-violet-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Pick a client first</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Reminder schedules are configured per client. Select one from the operations header and
          this panel will load their settings.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      {/* LEFT: the catalogue */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-4 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <BellRing className="h-5 w-5" />
                <span>What to notify</span>
              </h3>
              <p className="mt-0.5 truncate text-xs text-white/80">
                {clientName ? `${clientName} - ` : ""}
                {clientEmail}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  Unsaved changes
                </span>
              )}
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  !dirty || saving
                    ? "cursor-not-allowed bg-white/20 text-white/60"
                    : "bg-white text-violet-700 shadow-sm hover:bg-violet-50"
                }`}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        </div>

        {bundle?.preview && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gray-100 bg-violet-50/50 px-5 py-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-violet-700">
              <Activity className="h-3.5 w-3.5" />
              Activity snapshot
            </span>
            <span>
              Today: <strong className="text-gray-900">{bundle.preview.today?.added ?? 0}</strong> added,{" "}
              <strong className="text-gray-900">{bundle.preview.today?.applied ?? 0}</strong> applied
            </span>
            <span>
              Last 7 days: <strong className="text-gray-900">{bundle.preview.week?.added ?? 0}</strong>{" "}
              added, <strong className="text-gray-900">{bundle.preview.week?.applied ?? 0}</strong>{" "}
              applied
            </span>
          </div>
        )}

        {loading ? (
          <div className="divide-y divide-gray-100">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : loadError ? (
          <div className="p-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <p className="text-sm font-semibold text-gray-900">Could not load reminder settings</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-600">{loadError}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : catalogue.length === 0 ? (
          <div className="p-12 text-center">
            <BellRing className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-semibold text-gray-900">No reminder types available</p>
            <p className="mt-1 text-xs text-gray-500">
              The server returned an empty catalogue. Nothing can be scheduled yet.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_104px_104px] gap-3 border-b border-gray-100 bg-gray-50/80 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:grid">
              <span>Report</span>
              <span className="text-center">Mattermost</span>
              <span className="text-center">Payment email</span>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const meta = catalogueByKey.get(item.key);
                if (!meta) return null;
                const busy = sendingKey === item.key;
                const rowDisabled = busy;
                const showNoActivityEscape = noActivityKeys.includes(item.key);
                const tone = toneForStatus(item.lastStatus);
                const stamp = formatIstStamp(item.lastSentAt);

                return (
                  <div
                    key={item.key}
                    className={`grid grid-cols-1 gap-x-3 gap-y-3 px-5 py-5 transition-colors lg:grid-cols-[minmax(0,1fr)_104px_104px] ${
                      item.enabled ? "bg-white hover:bg-violet-50/30" : "bg-gray-50/40 hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <Toggle
                          checked={item.enabled}
                          disabled={rowDisabled}
                          onChange={(next) => patchItem(item.key, { enabled: next })}
                          label={`Enable ${meta.label}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                item.enabled ? "text-gray-900" : "text-gray-500"
                              }`}
                            >
                              {meta.label}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              {CADENCE_LABEL[meta.cadence] || meta.cadence}
                            </span>
                            {meta.activityGated && (
                              <span
                                title="Nothing is sent when the period had no jobs added and no applications submitted"
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                              >
                                <Zap className="h-3 w-3" />
                                Skips empty
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            {meta.description}
                          </p>

                          {meta.scheduleFields.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-end gap-3">
                              {meta.scheduleFields.includes("dayOfWeek") && (
                                <div>
                                  <label
                                    htmlFor={`${item.key}-dow`}
                                    className="mb-1 block text-[11px] font-medium text-gray-500"
                                  >
                                    Day
                                  </label>
                                  <select
                                    id={`${item.key}-dow`}
                                    value={item.dayOfWeek}
                                    disabled={rowDisabled}
                                    onChange={(e) =>
                                      patchItem(item.key, { dayOfWeek: Number(e.target.value) })
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none transition-shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                                  >
                                    {DAY_NAMES.map((day, index) => (
                                      <option key={day} value={index}>
                                        {day}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {meta.scheduleFields.includes("dayOfMonth") && (
                                <div>
                                  <label
                                    htmlFor={`${item.key}-dom`}
                                    className="mb-1 block text-[11px] font-medium text-gray-500"
                                  >
                                    Day of month
                                  </label>
                                  <select
                                    id={`${item.key}-dom`}
                                    value={item.dayOfMonth}
                                    disabled={rowDisabled}
                                    onChange={(e) =>
                                      patchItem(item.key, { dayOfMonth: Number(e.target.value) })
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none transition-shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                                  >
                                    {DAY_OF_MONTH_CHOICES.map((day) => (
                                      <option key={day} value={day}>
                                        {day}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {meta.scheduleFields.includes("inactivityDays") && (
                                <div>
                                  <label
                                    htmlFor={`${item.key}-idle`}
                                    className="mb-1 block text-[11px] font-medium text-gray-500"
                                  >
                                    Idle days
                                  </label>
                                  <input
                                    id={`${item.key}-idle`}
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={item.inactivityDays}
                                    disabled={rowDisabled}
                                    onChange={(e) =>
                                      patchItem(item.key, {
                                        inactivityDays: Math.min(
                                          30,
                                          Math.max(1, Number(e.target.value) || 1)
                                        )
                                      })
                                    }
                                    className="w-20 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none transition-shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                                  />
                                </div>
                              )}

                              {meta.scheduleFields.includes("sendAtIST") && (
                                <div>
                                  <label
                                    htmlFor={`${item.key}-time`}
                                    className="mb-1 block text-[11px] font-medium text-gray-500"
                                  >
                                    Time (IST)
                                  </label>
                                  <input
                                    id={`${item.key}-time`}
                                    type="time"
                                    value={item.sendAtIST}
                                    disabled={rowDisabled}
                                    onChange={(e) =>
                                      patchItem(item.key, { sendAtIST: e.target.value })
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none transition-shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => runSendNow(item.key, false)}
                              disabled={rowDisabled || Boolean(sendingKey)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              {busy ? "Sending..." : "Send now"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePreview(item.key)}
                              disabled={rowDisabled || Boolean(previewingKey)}
                              title="Preview what would be delivered"
                              aria-label={`Preview ${meta.label}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {previewingKey === item.key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {showNoActivityEscape && (
                              <button
                                type="button"
                                onClick={() => runSendNow(item.key, true)}
                                disabled={rowDisabled || Boolean(sendingKey)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                Send anyway
                              </button>
                            )}
                          </div>

                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                            {item.lastStatus ? (
                              <>
                                <StatusPill tone={tone}>
                                  {tone === "sent" && <CheckCircle2 className="h-3 w-3" />}
                                  {tone === "failed" && <AlertCircle className="h-3 w-3" />}
                                  {tone === "skipped" && <Ban className="h-3 w-3" />}
                                  {tone === "partial" && <Info className="h-3 w-3" />}
                                  {item.lastStatus === "sent" && stamp
                                    ? `Sent ${stamp}`
                                    : item.lastStatus === "skipped"
                                      ? `Skipped - ${humanReason(item.lastError || "no activity")}`
                                      : item.lastStatus === "failed"
                                        ? `Failed - ${humanReason(item.lastError || "unknown error")}`
                                        : item.lastStatus === "partial"
                                          ? `Partial - ${item.lastError || "one channel failed"}`
                                          : item.lastStatus}
                                </StatusPill>
                                {item.lastStatus !== "sent" && stamp && <span>at {stamp}</span>}
                              </>
                            ) : (
                              <StatusPill tone="idle">
                                <Clock className="h-3 w-3" />
                                Never run
                              </StatusPill>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:flex lg:items-start lg:justify-center lg:pt-1">
                      <ChannelCheckbox
                        checked={item.channels.mattermost}
                        disabled={rowDisabled || !hasWebhook}
                        onChange={(next) => patchChannel(item.key, "mattermost", next)}
                        label="Mattermost"
                        hint={
                          hasWebhook
                            ? "Deliver this report to the client's Mattermost channel"
                            : "Save a Mattermost webhook URL first"
                        }
                      />
                    </div>

                    <div className="lg:flex lg:items-start lg:justify-center lg:pt-1">
                      <ChannelCheckbox
                        checked={item.channels.email}
                        disabled={rowDisabled || !hasPaymentEmail}
                        onChange={(next) => patchChannel(item.key, "email", next)}
                        label="Payment email"
                        hint={
                          hasPaymentEmail
                            ? "Deliver this report to the client's payment email"
                            : "No payment email resolved for this client yet"
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-xs text-gray-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>
                  Reports with the "skips empty" badge stay silent when the period had no jobs added
                  and no applications submitted.
                </span>
              </p>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving}
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  !dirty || saving
                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:opacity-90"
                }`}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : dirty ? "Save settings" : "All changes saved"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* RIGHT: delivery channels */}
      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-violet-50 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Send className="h-4 w-4 text-violet-600" />
              Delivery channels
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">Where every enabled report is delivered.</p>
          </div>

          <div className="space-y-5 p-5">
            {/* Payment email */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="reminders-payment-email"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  Payment email
                </label>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    paymentSource === "tracking"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : paymentSource === "override"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {paymentSource === "tracking"
                    ? "Client record"
                    : paymentSource === "override"
                      ? "Local override"
                      : "Not set"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id="reminders-payment-email"
                  type="email"
                  value={paymentEmail}
                  onChange={(e) => setPaymentEmail(e.target.value)}
                  placeholder="billing@client.com"
                  disabled={loading || savingPaymentEmail}
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={handleSavePaymentEmail}
                  disabled={!canSavePaymentEmail}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    canSavePaymentEmail
                      ? "bg-violet-600 text-white shadow-sm hover:bg-violet-700"
                      : "cursor-not-allowed bg-gray-200 text-gray-500"
                  }`}
                >
                  {savingPaymentEmail ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </div>
              {paymentEmail.trim() !== "" && !isEmailish(paymentEmail) && (
                <p className="mt-1.5 text-[11px] text-red-600">That does not look like an email address.</p>
              )}
              {bundle && !bundle.trackingMatched && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  No client record matched this email, so the address is stored as a local override.
                </p>
              )}
            </div>

            {/* Mattermost webhook */}
            <div>
              <label
                htmlFor="reminders-webhook"
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600"
              >
                <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                Mattermost webhook
              </label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    id="reminders-webhook"
                    type={showWebhook ? "text" : "password"}
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value);
                      setWebhookTestResult(null);
                    }}
                    placeholder="https://your-server/hooks/xxxxxxxx"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhook((v) => !v)}
                    aria-label={showWebhook ? "Hide webhook URL" : "Show webhook URL"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookUrl.trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testingWebhook ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  Test
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">
                Incoming webhook from the client's Mattermost server, in the form
                https://your-server/hooks/....
              </p>
              {webhookTestResult && (
                <p
                  className={`mt-1.5 flex items-start gap-1.5 text-[11px] ${
                    webhookTestResult.ok ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {webhookTestResult.ok ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{webhookTestResult.message}</span>
                </p>
              )}
              {webhookUrl.trim() !== savedWebhook && (
                <p className="mt-1.5 text-[11px] text-amber-700">
                  Not saved yet. Use "Save settings" to activate this webhook.
                </p>
              )}
            </div>

            {/* Status strip */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`h-4 w-4 shrink-0 ${
                    bundle?.smtpConfigured ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">SMTP</p>
                  <p
                    className={`text-xs font-semibold ${
                      bundle?.smtpConfigured ? "text-emerald-700" : "text-gray-500"
                    }`}
                  >
                    {bundle?.smtpConfigured ? "Configured" : "Not configured"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock
                  className={`h-4 w-4 shrink-0 ${
                    bundle?.workerEnabled ? "text-emerald-600" : "text-amber-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Scheduler
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      bundle?.workerEnabled ? "text-emerald-700" : "text-amber-600"
                    }`}
                  >
                    {bundle?.workerEnabled ? "Running" : "Disabled"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-indigo-50 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-indigo-600" />
              Recent activity
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">The last few delivery attempts.</p>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ) : history.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-gray-300" />
              <p className="text-xs text-gray-500">
                Nothing delivered yet. Runs will show up here once a report goes out.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((row, index) => {
                const meta = row.itemKey ? catalogueByKey.get(row.itemKey) : undefined;
                const tone = toneForStatus(row.status || "");
                return (
                  <li key={`${row.at || "row"}-${row.itemKey || index}-${index}`} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900">
                          {meta?.label || row.itemKey || "Reminder"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {formatIstStamp(row.at) || "unknown time"}
                          {row.trigger ? ` - ${row.trigger}` : ""}
                        </p>
                      </div>
                      <StatusPill tone={tone}>{row.status || "unknown"}</StatusPill>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {row.stats?.added ?? 0} added, {row.stats?.applied ?? 0} applied
                      {row.email?.attempted ? (row.email.ok ? " - email ok" : " - email failed") : ""}
                      {row.mattermost?.attempted
                        ? row.mattermost.ok
                          ? " - mattermost ok"
                          : " - mattermost failed"
                        : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </aside>

      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
