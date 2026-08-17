import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

// Daily + monthly scrape-pipeline spend, charted from GET /admin/scrape-cost/
// history (backed by the ScrapeCostDaily snapshots). Dependency-free SVG so it
// adds nothing to the bundle. Single series per chart (total spend), so no
// legend is needed — the title names it — and there is no categorical-colour
// pair to validate. Light-mode only, to match the admin dashboard surface.

type Currency = 'USD' | 'INR';

interface DailyPoint {
  day: string;
  scraped: number;
  totalUsd: number;
  totalInr: number;
  otherUsd: number;
  perJobUsd: number;
  fullyMeasured: boolean;
}
interface MonthlyPoint {
  month: string;
  scraped: number;
  totalUsd: number;
  totalInr: number;
  otherUsd: number;
}
interface HistoryResponse {
  success: boolean;
  fxRate: number;
  daily: DailyPoint[];
  monthly: MonthlyPoint[];
}

// One bar's worth of data, currency-agnostic.
interface Bar {
  label: string;   // x-axis label
  value: number;   // charted amount (already in the selected currency)
  tip: string[];   // tooltip lines
}

const BAR_COLOR = '#2563eb';       // blue-600 — single series, strong contrast on white
const BAR_COLOR_HOVER = '#1d4ed8'; // blue-700
const GRID = '#e5e7eb';            // gray-200, recessive
const AXIS_INK = '#6b7280';        // gray-500

const fmtUsd = (v: number) =>
  v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`;
const fmtInr = (v: number) =>
  `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtMoney = (v: number, c: Currency) => (c === 'USD' ? fmtUsd(v) : fmtInr(v));

// Compact axis ticks: ₹1.2k / $3.0 etc.
const fmtAxis = (v: number, c: Currency) => {
  const sym = c === 'USD' ? '$' : '₹';
  if (v >= 1000) return `${sym}${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  if (v >= 10) return `${sym}${v.toFixed(0)}`;
  return `${sym}${v.toFixed(v >= 1 ? 1 : 2)}`;
};

// "2026-08-14" → "14 Aug"
const dayLabel = (d: string) => {
  const [, m, day] = d.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10)] || ''}`;
};
// "2026-08" → "Aug 26"
const monthLabel = (mm: string) => {
  const [y, m] = mm.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10)] || ''} ${y.slice(2)}`;
};

function BarChart({
  bars,
  currency,
  labelEvery = 1,
}: {
  bars: Bar[];
  currency: Currency;
  labelEvery?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  // viewBox space; the SVG scales to the container width.
  const W = 760;
  const H = 280;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const max = Math.max(1, ...bars.map((b) => b.value));
  // Round the axis max up to a "nice" number for readable gridlines.
  const niceMax = (() => {
    const pow = Math.pow(10, Math.floor(Math.log10(max)));
    const n = max / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
  })();

  const n = bars.length;
  const slot = n > 0 ? plotW / n : plotW;
  const barW = Math.max(2, Math.min(46, slot - 4)); // 2px gap either side
  const ticks = 4;

  if (!n) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
        No spend data yet — snapshots appear once the scraper runs.
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Spend bar chart">
        {/* Horizontal gridlines + y-axis ticks */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const val = (niceMax / ticks) * i;
          const y = padT + plotH - (val / niceMax) * plotH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={11} fill={AXIS_INK}>
                {fmtAxis(val, currency)}
              </text>
            </g>
          );
        })}

        {/* Bars — 4px rounded top, anchored to the baseline */}
        {bars.map((b, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const h = (b.value / niceMax) * plotH;
          const y = padT + plotH - h;
          const isHover = hover === i;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0, h)}
                rx={4}
                ry={4}
                fill={isHover ? BAR_COLOR_HOVER : BAR_COLOR}
              />
              {/* Full-height hit target so thin bars are easy to hover */}
              <rect
                x={padL + i * slot}
                y={padT}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h2) => (h2 === i ? null : h2))}
              />
              {(i % labelEvery === 0 || i === n - 1) && (
                <text
                  x={padL + i * slot + slot / 2}
                  y={H - padB + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill={AXIS_INK}
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hover !== null && bars[hover] && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg"
          style={{
            left: `${(((padL + hover * slot + slot / 2) / W) * 100).toFixed(2)}%`,
            top: 4,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="font-semibold">{fmtMoney(bars[hover].value, currency)}</div>
          {bars[hover].tip.map((t, k) => (
            <div key={k} className="text-gray-300">{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpendCharts({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('INR');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/scrape-cost/history?days=30&months=12`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HistoryResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load spend data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  const dailyBars: Bar[] = useMemo(
    () =>
      (data?.daily || []).map((d) => ({
        label: dayLabel(d.day),
        value: currency === 'USD' ? d.totalUsd : d.totalInr,
        tip: [
          d.day,
          `${d.scraped.toLocaleString()} jobs`,
          `other AI: ${fmtUsd(d.otherUsd)}`,
          d.fullyMeasured ? 'measured' : 'estimated',
        ],
      })),
    [data, currency]
  );

  const monthlyBars: Bar[] = useMemo(
    () =>
      (data?.monthly || []).map((m) => ({
        label: monthLabel(m.month),
        value: currency === 'USD' ? m.totalUsd : m.totalInr,
        tip: [m.month, `${m.scraped.toLocaleString()} jobs`, `other AI: ${fmtUsd(m.otherUsd)}`],
      })),
    [data, currency]
  );

  // Headline tiles: latest day, current month, jobs today.
  const latest = data?.daily?.[data.daily.length - 1];
  const currentMonth = data?.monthly?.[data.monthly.length - 1];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-900">AI Scrape Spend</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {(['INR', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  currency === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c === 'INR' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          Could not load spend data: {error}
        </div>
      )}

      {/* Headline tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Latest day{latest ? ` · ${latest.day}` : ''}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {latest ? fmtMoney(currency === 'USD' ? latest.totalUsd : latest.totalInr, currency) : '—'}
          </div>
          <div className="mt-1 text-sm text-gray-500">{latest ? `${latest.scraped.toLocaleString()} jobs scraped` : 'no data'}</div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-400">This month{currentMonth ? ` · ${currentMonth.month}` : ''}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {currentMonth ? fmtMoney(currency === 'USD' ? currentMonth.totalUsd : currentMonth.totalInr, currency) : '—'}
          </div>
          <div className="mt-1 text-sm text-gray-500">{currentMonth ? `${currentMonth.scraped.toLocaleString()} jobs scraped` : 'no data'}</div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-400">FX rate (fixed)</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">₹{data?.fxRate ?? 94} / $</div>
          <div className="mt-1 text-sm text-gray-500">scrape pipeline only</div>
        </div>
      </div>

      {/* Daily chart */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Daily spend</h4>
          <p className="text-sm text-gray-500">Scrape-pipeline cost per day (last 30 days){currency === 'INR' ? ' · ₹' : ' · $'}</p>
        </div>
        {loading && !data ? (
          <div className="flex items-center justify-center h-56 text-gray-400 text-sm">Loading…</div>
        ) : (
          <BarChart bars={dailyBars} currency={currency} labelEvery={5} />
        )}
      </div>

      {/* Monthly chart */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Monthly spend</h4>
          <p className="text-sm text-gray-500">Scrape-pipeline cost per month (last 12 months){currency === 'INR' ? ' · ₹' : ' · $'}</p>
        </div>
        {loading && !data ? (
          <div className="flex items-center justify-center h-56 text-gray-400 text-sm">Loading…</div>
        ) : (
          <BarChart bars={monthlyBars} currency={currency} labelEvery={1} />
        )}
      </div>

      <p className="text-xs text-gray-400">
        Covers this backend's OpenAI/Vertex scrape-pipeline calls (stage 1 + stage 2) only. Other AI (summaries, recruiter
        templates, extraction) is shown per-bar in tooltips but excluded from the totals. Snapshots refresh every ~10 minutes.
      </p>
    </div>
  );
}
