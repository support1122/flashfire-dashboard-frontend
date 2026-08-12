import React from "react";
import { Plus, Trash2, Calendar } from "lucide-react";

// A single certification. `date` is OPTIONAL — an operator enables it per-item
// via the "Add date" toggle. Empty date renders as no date in the preview/PDF.
export interface CertificationItem {
    id: string;
    title: string;
    issuer: string;
    date: string;
}

interface CertificationsProps {
    data: CertificationItem[];
    onChange: (data: CertificationItem[]) => void;
}

const newId = () =>
    `cert_${Math.random().toString(36).slice(2, 9)}${(globalThis.performance?.now?.() ?? 0).toString(36).replace(".", "")}`;

const Certifications: React.FC<CertificationsProps> = ({ data, onChange }) => {
    const items = Array.isArray(data) ? data : [];

    // Which certs currently show the date input. Seeded from items that already
    // have a date, so an enabled-but-empty date can exist without a sentinel
    // value leaking into the rendered resume.
    const [dateOpen, setDateOpen] = React.useState<Set<string>>(
        () => new Set(items.filter((c) => (c.date || "").trim() !== "").map((c) => c.id))
    );

    const update = (id: string, patch: Partial<CertificationItem>) =>
        onChange(items.map((c) => (c.id === id ? { ...c, ...patch } : c)));

    const add = () =>
        onChange([...items, { id: newId(), title: "", issuer: "", date: "" }]);

    const remove = (id: string) => {
        setDateOpen((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        onChange(items.filter((c) => c.id !== id));
    };

    // Toggle the optional date field. Turning it off clears the stored value so
    // the preview/PDF omit the date entirely.
    const toggleDate = (item: CertificationItem) => {
        setDateOpen((prev) => {
            const next = new Set(prev);
            if (next.has(item.id)) {
                next.delete(item.id);
                update(item.id, { date: "" }); // clear so nothing renders
            } else {
                next.add(item.id);
            }
            return next;
        });
    };

    return (
        <div className="space-y-3">
            {items.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                    No certifications yet. Add one to show a Certifications section.
                </p>
            )}

            {items.map((item, idx) => {
                const dateEnabled = dateOpen.has(item.id) || (item.date || "").trim() !== "";
                return (
                    <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-white p-3 space-y-2 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                Certification {idx + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => remove(item.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove certification"
                                aria-label="Remove certification"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <input
                            type="text"
                            value={item.title}
                            onChange={(e) => update(item.id, { title: e.target.value })}
                            placeholder="Certification title (e.g. AED & CPR Certified)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        <input
                            type="text"
                            value={item.issuer}
                            onChange={(e) => update(item.id, { issuer: e.target.value })}
                            placeholder="Issuer (e.g. Emergency Care & Safety Institute (ECSI))"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        {/* Optional date — off by default; toggle to add. */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => toggleDate(item)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                    dateEnabled
                                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                }`}
                                title="Certifications don't always have a date. Toggle to add one."
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                {dateEnabled ? "Date added" : "Add date"}
                            </button>

                            {dateEnabled && (
                                <input
                                    type="text"
                                    value={item.date || ""}
                                    onChange={(e) => update(item.id, { date: e.target.value })}
                                    placeholder="e.g. Nov 2025"
                                    autoFocus
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
            >
                <Plus className="h-4 w-4" />
                Add certification
            </button>
        </div>
    );
};

export default Certifications;
