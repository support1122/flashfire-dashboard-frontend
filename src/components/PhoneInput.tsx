import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRY_DIAL_CODES, countryByName, formatPhone, parsePhone } from "../utils/countryDialCodes";

type Props = {
  value: string; // stored as "+<code>-<number>", e.g. "+44-7578465628"
  onChange: (value: string) => void;
  hasError?: boolean;
  defaultCountry?: string;
  placeholder?: string;
};

// Country-code dropdown (with a small search box) + phone number input.
export default function PhoneInput({ value, onChange, hasError, defaultCountry = "United States", placeholder = "Phone number" }: Props) {
  const parsed = useMemo(() => parsePhone(value, defaultCountry), [value, defaultCountry]);
  const [country, setCountry] = useState(parsed.country);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the chosen country in sync when the stored value changes from outside (e.g. profile prefill).
  useEffect(() => {
    if (String(value ?? "").trim().startsWith("+")) setCountry(parsed.country);
  }, [parsed.country, value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const dial = countryByName(country)?.[1] ?? "1";
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  const options = COUNTRY_DIAL_CODES.filter(([n, d]) => !q || n.toLowerCase().includes(q) || d.startsWith(q));

  return (
    <div className="flex gap-2" ref={boxRef}>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={[
            "h-full rounded-lg border px-3 py-3 text-base text-gray-900 bg-white whitespace-nowrap",
            hasError ? "border-red-500" : "border-gray-300 hover:border-gray-400",
          ].join(" ")}
          aria-label="Country code"
        >
          +{dial} <span className="text-gray-400 text-xs">▾</span>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="w-full border-b border-gray-200 px-2 py-1 text-sm focus:outline-none"
            />
            <ul className="max-h-56 overflow-y-auto text-sm">
              {options.map(([n, d]) => (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountry(n);
                      setOpen(false);
                      setQuery("");
                      onChange(formatPhone(n, parsed.number));
                    }}
                    className={["flex w-full justify-between px-3 py-1.5 text-left hover:bg-orange-50", n === country ? "bg-orange-50" : ""].join(" ")}
                  >
                    <span>{n}</span>
                    <span className="text-gray-500">+{d}</span>
                  </button>
                </li>
              ))}
              {options.length === 0 && <li className="px-3 py-2 text-gray-500">No match</li>}
            </ul>
          </div>
        )}
      </div>
      <input
        type="tel"
        inputMode="tel"
        placeholder={placeholder}
        value={parsed.number}
        data-error={hasError}
        onChange={(e) => onChange(formatPhone(country, e.target.value))}
        className={[
          "w-full rounded-lg border px-4 py-3 text-base text-gray-900 placeholder:text-gray-500",
          "focus:outline-none focus:ring-2 transition-all duration-200",
          hasError
            ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-300 bg-white focus:border-orange-500 focus:ring-orange-500/20 hover:border-gray-400",
        ].join(" ")}
      />
    </div>
  );
}
