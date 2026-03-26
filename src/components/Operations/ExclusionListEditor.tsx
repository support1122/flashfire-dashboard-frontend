import { useMemo, useState } from "react";
import { X } from "lucide-react";

type Props = {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  items: string[];
  onChange: (next: string[]) => void;
  footerHint: string;
};

function normalizeKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function ExclusionListEditor({
  label,
  placeholder,
  searchPlaceholder,
  items,
  onChange,
  footerHint
}: Props) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const normalizedSet = useMemo(() => {
    return new Set(items.map((e) => normalizeKey(e)).filter(Boolean));
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((e) => e.toLowerCase().includes(term));
  }, [items, search]);

  const addFromString = (value: string) => {
    const parts = value
      .split(/[\r\n|]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const seen = new Set(normalizedSet);
    const next = [...items];
    for (const raw of parts) {
      const key = normalizeKey(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      next.push(raw);
    }
    if (next.length > items.length) onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (input.trim()) {
        addFromString(input);
        setInput("");
      }
    }
  };

  const handleBlur = () => {
    if (input.trim()) {
      addFromString(input);
      setInput("");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted || !pasted.trim()) return;
    const trimmed = pasted.trim();
    if (/[\r\n|]/.test(trimmed)) {
      e.preventDefault();
      addFromString(trimmed);
      setInput("");
    }
  };

  const remove = (target: string) => {
    onChange(items.filter((e) => e !== target));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-violet-900/80 mb-1">{label}</label>
          <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/60 px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-400">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-violet-400/80 text-violet-950"
            />
          </div>
        </div>
        <div className="w-full md:w-64 shrink-0">
          <label className="block text-xs font-medium text-violet-900/80 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-violet-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-violet-300"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white p-3 min-h-[160px] max-h-[280px] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-violet-400 col-span-full text-center py-6">No entries yet</p>
          ) : (
            filtered.map((entry) => (
              <span
                key={`${normalizeKey(entry)}-${entry}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-100/90 text-violet-900 pl-3 pr-1 py-1 text-xs font-medium border border-violet-200/80"
              >
                <span className="truncate flex-1 min-w-0" title={entry}>
                  {entry}
                </span>
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  className="shrink-0 rounded-full p-0.5 text-violet-600 hover:bg-violet-200/80"
                  aria-label="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500">{footerHint}</p>
    </div>
  );
}
