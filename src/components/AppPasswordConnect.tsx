import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { X, KeyRound, AlertTriangle } from "lucide-react";
import { guardedPasswordInputProps } from "../utils/passwordManagerGuard";

/**
 * Operator-only: connect or replace the client's Gmail app password.
 *
 * One app password lets Flashfire read the client's mail (IMAP) and send
 * recruiter mail as them (SMTP). While it exists it takes precedence over the
 * Google OAuth connection. The server checks it against Gmail before saving,
 * stores it encrypted, and never sends it back: this component only ever
 * learns WHETHER one is connected.
 *
 * The server only answers a client session an operator opened from
 * Operations, so this is rendered for operators only.
 */

export interface AppPasswordStatus {
    connected: boolean;
    gmailEmail?: string;
    connectedAt?: string | null;
    lastVerifiedAt?: string | null;
    needsReplacing?: boolean;
}

interface Props {
    apiBaseUrl: string;
    token: string | null | undefined;
    /** The client's dashboard email, used to prefill the Gmail address. */
    clientEmail: string;
    onStatusChange?: (status: AppPasswordStatus | null) => void;
}

export default function AppPasswordConnect({ apiBaseUrl, token, clientEmail, onStatusChange }: Props) {
    const [status, setStatus] = useState<AppPasswordStatus | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [open, setOpen] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${apiBaseUrl}/gmail/app-password`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setLoadError(true);
                return;
            }
            const data: AppPasswordStatus = await res.json();
            setLoadError(false);
            setStatus(data);
        } catch {
            setLoadError(true);
        }
    }, [apiBaseUrl, token]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        onStatusChange?.(status);
    }, [status, onStatusChange]);

    if (loadError && !status) {
        return (
            <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
                Could not load app password status. Retry
            </button>
        );
    }
    if (!status) return null;

    return (
        <>
            {status.connected && status.needsReplacing ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium text-left text-red-700 border border-red-300 hover:bg-red-50 transition-colors"
                    title="Gmail refused the saved app password. Click to replace it."
                >
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                        App password stopped working
                        <span className="ml-1 underline decoration-red-400 decoration-dotted">(replace)</span>
                    </span>
                </button>
            ) : status.connected ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium text-left text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition-colors"
                    title="Mail is read and sent through this app password. Click to replace it."
                >
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>
                        App password connected
                        {status.gmailEmail ? <span className="text-emerald-600"> · {status.gmailEmail}</span> : null}
                        <span className="ml-1 underline decoration-emerald-400 decoration-dotted">(replace)</span>
                    </span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-sm font-semibold text-white px-4 py-2 transition-colors"
                >
                    <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Connect Gmail app password</span>
                </button>
            )}

            {open && (
                <AppPasswordModal
                    apiBaseUrl={apiBaseUrl}
                    token={token}
                    replacing={status.connected}
                    defaultGmail={status.gmailEmail || clientEmail}
                    onClose={() => setOpen(false)}
                    onSaved={(next) => {
                        setStatus(next);
                        setOpen(false);
                    }}
                />
            )}
        </>
    );
}

interface ModalProps {
    apiBaseUrl: string;
    token: string | null | undefined;
    replacing: boolean;
    defaultGmail: string;
    onClose: () => void;
    onSaved: (status: AppPasswordStatus) => void;
}

function AppPasswordModal({ apiBaseUrl, token, replacing, defaultGmail, onClose, onSaved }: ModalProps) {
    const [gmailEmail, setGmailEmail] = useState(defaultGmail);
    const [appPassword, setAppPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const titleId = useId();
    const passwordRef = useRef<HTMLInputElement>(null);

    // Focus the password once, when the popup opens.
    useEffect(() => {
        passwordRef.current?.focus();
    }, []);

    // After a refusal, put the cursor back where the fix goes.
    useEffect(() => {
        if (error && !saving) passwordRef.current?.focus();
    }, [error, saving]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, saving]);

    const letters = appPassword.replace(/\s+/g, "");
    const canSubmit = !saving && /\S+@\S+\.\S+/.test(gmailEmail.trim()) && letters.length === 16;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`${apiBaseUrl}/gmail/app-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ gmailEmail: gmailEmail.trim(), appPassword }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.message || "Could not save the app password. Try again.");
                return;
            }
            setAppPassword("");
            onSaved(data as AppPasswordStatus);
        } catch {
            setError("Network error. Check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white px-6 pb-6 pt-6 text-left shadow-2xl sm:p-8"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-100 to-red-100 mb-5">
                        <KeyRound className="h-7 w-7 text-orange-600" aria-hidden="true" />
                    </div>

                    <div className="text-center mb-5">
                        <h3 id={titleId} className="text-2xl font-bold text-gray-900 mb-2">
                            {replacing ? "Replace app password" : "Connect Gmail app password"}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Flashfire reads the client's mail and sends recruiter emails with it.
                            {replacing ? " The new one replaces the saved one." : ""}
                        </p>
                    </div>

                    <ol className="mb-5 list-decimal space-y-1 rounded-lg bg-orange-50 py-3 pl-8 pr-4 text-sm text-gray-700">
                        <li>Sign in to the client's Google account and turn on 2-Step Verification.</li>
                        <li>
                            Open{" "}
                            <a
                                href="https://myaccount.google.com/apppasswords"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-orange-700 underline"
                            >
                                myaccount.google.com/apppasswords
                            </a>{" "}
                            and create one named "Flashfire".
                        </li>
                        <li>Paste the 16 letters below.</li>
                    </ol>

                    <form onSubmit={submit} className="space-y-4" autoComplete="off">
                        <div>
                            <label htmlFor="ff-app-pw-gmail" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Gmail address
                            </label>
                            <input
                                id="ff-app-pw-gmail"
                                type="email"
                                autoComplete="off"
                                value={gmailEmail}
                                onChange={(e) => setGmailEmail(e.target.value)}
                                disabled={saving}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900 disabled:bg-gray-50"
                                placeholder="client@gmail.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="ff-app-pw-secret" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                App password
                            </label>
                            <input
                                id="ff-app-pw-secret"
                                ref={passwordRef}
                                {...guardedPasswordInputProps(true, false)}
                                value={appPassword}
                                onChange={(e) => setAppPassword(e.target.value)}
                                disabled={saving}
                                spellCheck={false}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900 tracking-wider disabled:bg-gray-50"
                                placeholder="abcd efgh ijkl mnop"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">
                                {letters.length}/16 letters. It is checked with Gmail, saved encrypted, and never shown again.
                            </p>
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Checking..." : replacing ? "Check and replace" : "Check and save"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
