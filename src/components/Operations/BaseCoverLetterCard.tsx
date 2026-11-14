import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, FileText, Loader2, RefreshCw } from 'lucide-react';
import { toastUtils } from '../../utils/toast.ts';

// Operator editor for a client's base cover letter.
//
// The backend stores the text in R2 and, for Executive clients, queues every
// job card that already has an optimized resume so the auto-optimization
// worker can tailor this letter to each job. The SpeedyApply extension then
// drops the tailored one-page PDF into the application form.
//
// Both routes sit behind RequireOpsKey (header x-ops-key) and an operator
// ownership check, so every request carries the ops key the tab was unlocked
// with plus the operator's email.

export interface BaseCoverLetterCardProps {
  apiBaseUrl: string;
  clientEmail: string;
  clientName?: string;
  operatorEmail: string;
  operatorName: string;
  opsKey: string;
}

interface CoverLetterStats {
  optimized: number;
  pending: number;
  failed: number;
}

interface BaseCoverLetterState {
  text: string;
  updatedAt: string | null;
  updatedBy: string | null;
  words: number;
  plan: string;
  executive: boolean;
  stats: CoverLetterStats;
}

interface ApiErrorBody {
  ok?: boolean;
  success?: boolean;
  error?: string;
  message?: string;
}

interface GetResponse extends ApiErrorBody {
  text?: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  words?: number;
  plan?: string;
  executive?: boolean;
  stats?: Partial<CoverLetterStats>;
}

interface PutResponse extends ApiErrorBody {
  updatedAt?: string;
  words?: number;
  queued?: number;
}

// Mirrors the backend limits so the operator hears about them before a round trip.
const MIN_CHARS = 300;
const MAX_CHARS = 8000;
const TARGET_MIN_WORDS = 280;
const TARGET_MAX_WORDS = 380;

class BaseLetterRequestError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'BaseLetterRequestError';
    this.status = status;
    this.code = code;
  }
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function normalizeGet(body: GetResponse): BaseCoverLetterState {
  return {
    text: typeof body.text === 'string' ? body.text : '',
    updatedAt: body.updatedAt || null,
    updatedBy: body.updatedBy || null,
    words: toCount(body.words),
    plan: typeof body.plan === 'string' ? body.plan : '',
    executive: body.executive === true,
    stats: {
      optimized: toCount(body.stats?.optimized),
      pending: toCount(body.stats?.pending),
      failed: toCount(body.stats?.failed),
    },
  };
}

/** Turns any failure into one sentence an operator can act on. */
function describeError(err: unknown, action: 'load' | 'save'): string {
  if (err instanceof BaseLetterRequestError) {
    const { status, code } = err;
    if (status === 401) {
      return 'The operations key was rejected. Unlock the Operations tab again.';
    }
    if (status === 403) {
      return code === 'not_your_client'
        ? 'This client is not in your managed clients. Ask an admin to assign them to you.'
        : 'You do not have access to this client\'s cover letter.';
    }
    if (status === 404) {
      return 'No dashboard account was found for this client.';
    }
    if (code === 'base_letter_too_short') {
      return `The letter is too short. Paste at least ${MIN_CHARS} characters, or clear the box to remove the base letter.`;
    }
    if (code === 'base_letter_too_long') {
      return `The letter is too long. Keep it under ${MAX_CHARS.toLocaleString()} characters.`;
    }
    if (code === 'client_required') {
      return 'No client is selected. Switch to a client first.';
    }
    if (status >= 400 && status < 500) {
      return err.message || 'The server rejected the request.';
    }
    if (status >= 500) {
      return action === 'save'
        ? 'The server could not save the letter. Try again in a minute.'
        : 'The server could not load the letter. Try again in a minute.';
    }
  }
  if (err instanceof TypeError) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return action === 'save' ? 'Could not save the base cover letter.' : 'Could not load the base cover letter.';
}

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPlan(plan: string): string {
  const clean = plan.trim();
  if (!clean) return 'Unknown';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

const CHIP_TONES = {
  emerald: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  sky: { chip: 'border-sky-200 bg-sky-50 text-sky-800', dot: 'bg-sky-500' },
  red: { chip: 'border-red-200 bg-red-50 text-red-800', dot: 'bg-red-500' },
} as const;

/** A count chip that goes grey at zero so only real numbers draw the eye. */
function StatChip({ count, label, tone }: { count: number; label: string; tone: keyof typeof CHIP_TONES }) {
  const colors = count > 0 ? CHIP_TONES[tone] : { chip: 'border-gray-200 bg-gray-50 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colors.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} aria-hidden="true" />
      {count} {label}
    </span>
  );
}

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2';

const BaseCoverLetterCard = ({
  apiBaseUrl,
  clientEmail,
  clientName,
  operatorEmail,
  operatorName,
  opsKey,
}: BaseCoverLetterCardProps) => {
  const textareaId = useId();
  const helpId = useId();
  const countId = useId();
  const dialogTitleId = useId();

  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadError, setLoadError] = useState('');
  const [data, setData] = useState<BaseCoverLetterState | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  // The client the latest request is for; any answer for another client is dropped.
  const activeClientRef = useRef(clientEmail);
  // The last text the server confirmed, read by load() to tell an edited draft from an untouched one.
  const savedTextRef = useRef('');

  const canCall = Boolean(clientEmail && operatorEmail && opsKey);

  const request = useCallback(
    async <T extends ApiErrorBody>(
      method: 'GET' | 'PUT',
      body: Record<string, unknown> | null,
      signal?: AbortSignal,
    ): Promise<T> => {
      const query =
        method === 'GET'
          ? `?${new URLSearchParams({ clientEmail, operatorEmail }).toString()}`
          : '';
      const res = await fetch(`${apiBaseUrl}/operations/base-cover-letter${query}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-ops-key': opsKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      let parsed: T | null = null;
      try {
        parsed = (await res.json()) as T;
      } catch {
        parsed = null;
      }

      if (!res.ok || !parsed || parsed.ok === false) {
        const envelope: ApiErrorBody = parsed || {};
        throw new BaseLetterRequestError(
          res.ok ? 500 : res.status,
          envelope.error || '',
          envelope.message || envelope.error || `HTTP ${res.status}`,
        );
      }
      return parsed;
    },
    [apiBaseUrl, clientEmail, operatorEmail, opsKey],
  );

  /**
   * Loads the letter and stats. `keepDraft` refreshes the stats after a save
   * without throwing away anything typed since.
   */
  const load = useCallback(
    async ({ keepDraft }: { keepDraft: boolean }) => {
      loadAbortRef.current?.abort();
      const controller = new AbortController();
      loadAbortRef.current = controller;
      const forClient = clientEmail;

      if (keepDraft) {
        setRefreshing(true);
      } else {
        setLoadState('loading');
        setLoadError('');
      }

      try {
        const body = await request<GetResponse>('GET', null, controller.signal);
        if (controller.signal.aborted || activeClientRef.current !== forClient) return;
        const next = normalizeGet(body);
        const previousSaved = savedTextRef.current;
        savedTextRef.current = next.text;
        setData(next);
        // Replace the draft when it still matches what was saved, so the
        // operator sees the text the backend actually kept (it strips a
        // pasted greeting or sign-off).
        setDraft((current) => (!keepDraft || current === previousSaved ? next.text : current));
        setLoadState('ready');
      } catch (err) {
        if (controller.signal.aborted || activeClientRef.current !== forClient) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = describeError(err, 'load');
        if (keepDraft) {
          toastUtils.error(`Saved, but the stats did not refresh. ${message}`);
        } else {
          setLoadError(message);
          setLoadState('error');
        }
      } finally {
        if (loadAbortRef.current === controller) {
          loadAbortRef.current = null;
          setRefreshing(false);
        }
      }
    },
    [clientEmail, request],
  );

  useEffect(() => {
    activeClientRef.current = clientEmail;
    savedTextRef.current = '';
    setData(null);
    setDraft('');
    setSaving(false);
    setSaveError('');
    setConfirmOpen(false);
    if (!canCall) {
      loadAbortRef.current?.abort();
      setLoadState('idle');
      return;
    }
    void load({ keepDraft: false });
    return () => {
      loadAbortRef.current?.abort();
    };
  }, [canCall, clientEmail, load]);

  // Drive the native dialog from state so Escape and the buttons agree.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!confirmOpen && dialog.open) {
      dialog.close();
    }
  }, [confirmOpen]);

  const savedText = data?.text ?? '';
  const dirty = draft !== savedText;
  const trimmed = draft.trim();
  const words = countWords(draft);
  const chars = trimmed.length;
  const tooShort = chars > 0 && chars < MIN_CHARS;
  const tooLong = chars > MAX_CHARS;
  const removing = chars === 0 && savedText.trim().length > 0;
  const outsideTarget = words > 0 && (words < TARGET_MIN_WORDS || words > TARGET_MAX_WORDS);
  const canSave = loadState === 'ready' && dirty && !saving && !tooShort && !tooLong && (chars > 0 || removing);

  const performSave = useCallback(async () => {
    const forClient = clientEmail;
    const text = draft.trim() ? draft : '';
    setSaving(true);
    setSaveError('');
    let saved = false;
    try {
      const body = await request<PutResponse>('PUT', {
        clientEmail,
        operatorEmail,
        operatorName,
        text,
      });
      if (activeClientRef.current !== forClient) return;
      const queued = toCount(body.queued);
      if (text) {
        toastUtils.success(
          `Saved. ${queued} job ${queued === 1 ? 'card' : 'cards'} queued for cover letter optimization.`,
        );
      } else {
        toastUtils.success('Base cover letter removed. Letters already written for job cards are kept.');
      }
      savedTextRef.current = text;
      setDraft(text);
      setData((prev) =>
        prev
          ? {
              ...prev,
              text,
              updatedAt: body.updatedAt || new Date().toISOString(),
              updatedBy: operatorName || operatorEmail,
              words: toCount(body.words) || countWords(text),
            }
          : prev,
      );
      saved = true;
    } catch (err) {
      if (activeClientRef.current !== forClient) return;
      const message = describeError(err, 'save');
      setSaveError(message);
      toastUtils.error(message);
    } finally {
      setSaving(false);
    }
    if (saved) await load({ keepDraft: true });
  }, [clientEmail, draft, load, operatorEmail, operatorName, request]);

  const handleSave = () => {
    if (!canSave) return;
    if (removing) {
      setConfirmOpen(true);
      return;
    }
    void performSave();
  };

  const handleDiscard = () => {
    setDraft(savedText);
    setSaveError('');
  };

  const lastUpdated = formatWhen(data?.updatedAt ?? null);
  const displayName = clientName?.trim() || clientEmail;

  return (
    <section
      aria-labelledby={`${textareaId}-title`}
      className="mt-8 bg-white rounded-2xl shadow-sm border border-orange-200/80 overflow-hidden"
    >
      <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50/90 to-amber-50/70 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-orange-600 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 id={`${textareaId}-title`} className="text-lg font-semibold text-gray-900">
              Base cover letter
            </h3>
            <p className="text-xs text-orange-800/80">
              Tailored to each saved job for {displayName} and filled in by SpeedyApply
            </p>
          </div>
        </div>
        {data && (
          <div className="flex flex-wrap items-center gap-2" aria-label="Cover letter status">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
              Plan: {formatPlan(data.plan)}
            </span>
            <StatChip count={data.stats.optimized} label="optimized" tone="emerald" />
            <StatChip count={data.stats.pending} label="pending" tone="sky" />
            <StatChip count={data.stats.failed} label="failed" tone="red" />
            {refreshing && (
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" aria-label="Refreshing stats" />
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-5">
        {!canCall && (
          <p className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" aria-hidden="true" />
            {!clientEmail
              ? 'Switch to a client to edit their base cover letter.'
              : !operatorEmail
                ? 'Only operator accounts can edit the base cover letter. Sign in with your operator login.'
                : 'Unlock the Operations tab to edit the base cover letter.'}
          </p>
        )}

        {canCall && loadState === 'loading' && (
          <div className="flex items-center gap-3 py-12 justify-center text-sm text-gray-600" role="status">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" aria-hidden="true" />
            Loading the base cover letter...
          </div>
        )}

        {canCall && loadState === 'error' && (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="flex items-start gap-2 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void load({ keepDraft: false })}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 ${focusRing}`}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {canCall && loadState === 'ready' && data && (
          <>
            {!data.executive && (
              <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                Cover letters are only optimized for Executive plan clients. You can still save the base letter.
              </p>
            )}

            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <label htmlFor={textareaId} className="text-sm font-semibold text-gray-900">
                Letter body
              </label>
              <p className="text-xs text-gray-500">
                {data.updatedAt ? (
                  <>
                    Last updated
                    {data.updatedBy ? (
                      <>
                        {' '}by <span className="font-medium text-gray-700">{data.updatedBy}</span>
                      </>
                    ) : null}
                    {lastUpdated ? `, ${lastUpdated}` : ''}
                  </>
                ) : (
                  'No base letter saved yet'
                )}
              </p>
            </div>

            <p id={helpId} className="mb-3 text-xs leading-relaxed text-gray-600">
              Paste only the body of the letter, with a blank line between paragraphs. Leave out the greeting,
              the sign-off and contact details: they are added automatically in the one-page format.
            </p>

            <textarea
              id={textareaId}
              rows={16}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (saveError) setSaveError('');
              }}
              disabled={saving}
              aria-describedby={`${helpId} ${countId}`}
              aria-invalid={tooShort || tooLong || undefined}
              placeholder={'I am writing to apply for...\n\nIn my current role at...'}
              className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
            />

            <div id={countId} className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
              <p className="text-gray-600" aria-live="polite">
                <span className={`font-semibold ${outsideTarget ? 'text-amber-700' : 'text-gray-900'}`}>
                  {words} {words === 1 ? 'word' : 'words'}
                </span>
                <span className="text-gray-400"> · </span>
                Most letters are {TARGET_MIN_WORDS} to {TARGET_MAX_WORDS} words
              </p>
              <p className={tooLong ? 'font-medium text-red-700' : 'text-gray-500'}>
                {chars.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
              </p>
            </div>

            {tooShort && (
              <p className="mt-2 text-xs font-medium text-red-700">
                At least {MIN_CHARS} characters are needed to save ({chars} so far). Clear the box to remove the
                base letter instead.
              </p>
            )}
            {tooLong && (
              <p className="mt-2 text-xs font-medium text-red-700">
                That is over the {MAX_CHARS.toLocaleString()} character limit. Trim it before saving.
              </p>
            )}
            {saveError && (
              <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                {saveError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {dirty && !saving && (
                <span className="mr-auto text-xs font-medium text-amber-700">Unsaved changes</span>
              )}
              <button
                type="button"
                onClick={handleDiscard}
                disabled={!dirty || saving}
                className={`rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  removing ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                } ${focusRing}`}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {saving ? 'Saving...' : removing ? 'Remove base letter' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        onCancel={(e) => {
          e.preventDefault();
          setConfirmOpen(false);
        }}
        className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 p-0 shadow-xl backdrop:bg-gray-900/40"
      >
        <div className="p-6">
          <h4 id={dialogTitleId} className="text-lg font-semibold text-gray-900">
            Remove the base cover letter?
          </h4>
          <p className="mt-2 text-sm text-gray-600">
            Saving an empty box removes {displayName}&apos;s base letter. New job cards will not get a cover letter.
            Letters already written for job cards are kept.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              autoFocus
              className={`rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${focusRing}`}
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                void performSave();
              }}
              className={`rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 ${focusRing}`}
            >
              Remove base letter
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
};

export default BaseCoverLetterCard;
