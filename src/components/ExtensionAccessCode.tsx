import React, { useCallback, useContext, useEffect, useState } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { UserContext } from "../state_management/UserContext";
import { isOpsRole, useOperationsStore } from "../state_management/Operations";

// The SpeedyApply access code for this client, shown to operators only (the
// backend also refuses it to a client's own login). The extension's sign-in asks
// for it on top of the dashboard email and password. The backend issues it on first
// view and replaces it every 30 days by itself; "New code" replaces it now and
// signs every extension using the old one out.

interface AccessCode {
  code: string;
  expiresAt: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const cardClass = "flex items-center gap-3 border border-gray-200 bg-white px-3 py-2";
const iconButton =
  "p-1 text-gray-500 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50";

const formatExpiry = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const ExtensionAccessCode: React.FC = () => {
  const token = useContext(UserContext)?.token ?? null;
  const isOperator = isOpsRole(useOperationsStore((s) => s.role));
  const [data, setData] = useState<AccessCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(
    async (rotate = false) => {
      if (!token || !API_BASE || !isOperator) return;
      setFailed(false);
      try {
        const res = await fetch(`${API_BASE}/speedyapply/access-code${rotate ? "/rotate" : ""}`, {
          method: rotate ? "POST" : "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        setData({ code: body.code, expiresAt: body.expiresAt });
      } catch (error) {
        console.error("SpeedyApply access code failed to load:", error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [token, isOperator]
  );

  useEffect(() => {
    load();
  }, [load]);

  // A tab left open past the expiry would keep showing a dead code. The server
  // issues the next one on request, so ask again when the tab comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && data && new Date(data.expiresAt) <= new Date()) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [data, load]);

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const rotate = async () => {
    const ok = window.confirm(
      "Make a new SpeedyApply code? Everyone signed in to the extension for this client is signed out and needs the new code."
    );
    if (!ok) return;
    setBusy(true);
    await load(true);
    setBusy(false);
  };

  if (!token || !API_BASE || !isOperator) return null;

  if (loading) {
    return (
      <div className={cardClass}>
        <div className="w-9 h-9 bg-gray-200 animate-pulse flex-shrink-0"></div>
        <div className="flex flex-col gap-1">
          <div className="h-3 bg-gray-200 animate-pulse w-24"></div>
          <div className="h-2 bg-gray-200 animate-pulse w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="w-9 h-9 bg-orange-50 text-orange-600 flex-shrink-0 flex items-center justify-center">
        <KeyRound className="w-4 h-4" aria-hidden="true" />
      </div>
      {failed || !data ? (
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900">Code unavailable</span>
          <button type="button" onClick={() => load()} className="text-xs text-orange-600 hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm font-semibold tracking-wider text-gray-900" aria-label="SpeedyApply access code">
              {data.code}
            </span>
            <button type="button" onClick={copy} className={iconButton} aria-label={copied ? "Copied" : "Copy code"} title={copied ? "Copied" : "Copy code"}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button type="button" onClick={rotate} disabled={busy} className={iconButton} aria-label="Make a new code" title="Make a new code">
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
            </button>
          </div>
          <span className="text-xs text-gray-500">SpeedyApply code · expires {formatExpiry(data.expiresAt)}</span>
        </div>
      )}
    </div>
  );
};

export default ExtensionAccessCode;
