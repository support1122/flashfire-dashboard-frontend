import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface LeadershipItem {
    id: string;
    title: string;
    organization: string;
}

interface LeadershipProps {
    data: LeadershipItem[];
    onChange: (data: LeadershipItem[]) => void;
}

const LEADERSHIP_LINK_MARKER_REGEX = /<a>[\s\S]*?(?:<\/a>|<a\/>|$)/i;

const parseLeadershipLinkMarker = (text: string) => {
    const markerMatch = (text || "").match(/<a>([\s\S]*?)(?:<\/a>|<a\/>|$)/i);
    if (!markerMatch) return null;
    const content = markerMatch[1] || "";
    const pipeIndex = content.indexOf("|");
    return {
        fullMarker: markerMatch[0],
        label:
            pipeIndex === -1
                ? content.trim()
                : content.slice(0, pipeIndex).trim(),
        url:
            pipeIndex === -1
                ? content.trim()
                : content.slice(pipeIndex + 1).trim(),
    };
};

export const Leadership: React.FC<LeadershipProps> = ({ data, onChange }) => {
    const [linkEditor, setLinkEditor] = React.useState<{
        id: string;
        field: "title" | "organization";
        start: number;
        end: number;
        selectedText: string;
        url: string;
        mode: "insert" | "edit";
    } | null>(null);

    const addLeadership = () => {
        const newLeadership: LeadershipItem = {
            id: Date.now().toString(),
            title: "",
            organization: "",
        };
        onChange([...data, newLeadership]);
    };

    const removeLeadership = (id: string) => {
        onChange(data.filter((item) => item.id !== id));
    };

    const updateLeadership = (id: string, field: string, value: string) => {
        onChange(
            data.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSelection = (
        id: string,
        field: "title" | "organization",
        e: React.SyntheticEvent<HTMLInputElement>
    ) => {
        const target = e.currentTarget;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        if (start === end) return;
        const selectedText = target.value.slice(start, end).trim();
        if (!selectedText) return;
        setLinkEditor({
            id,
            field,
            start,
            end,
            selectedText,
            url: "",
            mode: "insert",
        });
    };

    const insertLeadershipLink = () => {
        if (!linkEditor) return;
        const targetItem = data.find((item) => item.id === linkEditor.id);
        if (!targetItem) return;
        const current = (targetItem[linkEditor.field] || "").toString();
        if (linkEditor.mode === "insert" && LEADERSHIP_LINK_MARKER_REGEX.test(current)) {
            window.alert("Only one hyperlink is allowed in this field.");
            return;
        }
        const selectedText = (linkEditor.selectedText || "").trim();
        if (!selectedText) {
            window.alert("Please enter link text.");
            return;
        }
        const rawUrl = (linkEditor.url || "").trim();
        if (!rawUrl) {
            window.alert("Please enter a hyperlink URL.");
            return;
        }
        const hasProtocol = /^(https?:\/\/|mailto:|tel:|#)/i.test(rawUrl);
        const normalizedUrl = hasProtocol ? rawUrl : `https://${rawUrl}`;
        const marker = `<a>${selectedText}|${normalizedUrl}<a/>`;
        const updated =
            linkEditor.mode === "edit"
                ? current.replace(
                      /<a>[\s\S]*?(?:<\/a>|<a\/>|$)/i,
                      marker
                  )
                : current.slice(0, linkEditor.start) +
                  marker +
                  current.slice(linkEditor.end);
        updateLeadership(linkEditor.id, linkEditor.field, updated);
        setLinkEditor(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex-1">
                    Leadership & Achievements
                </h3>
                <button
                    onClick={addLeadership}
                    className="ml-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus size={16} />
                    Add Role
                </button>
            </div>

            {data.map((leadership, index) => (
                <div
                    key={leadership.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                    <div className="flex items-start justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-800">
                            Role #{index + 1}
                        </h4>
                        {data.length > 1 && (
                            <button
                                onClick={() => removeLeadership(leadership.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title/Position
                            </label>
                            <input
                                type="text"
                                value={leadership.title}
                                onChange={(e) =>
                                    updateLeadership(
                                        leadership.id,
                                        "title",
                                        e.target.value
                                    )
                                }
                                onSelect={(e) =>
                                    handleSelection(leadership.id, "title", e)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Strategic Growth Advisor"
                            />
                            {parseLeadershipLinkMarker(leadership.title) && (
                                <div className="mt-1 text-xs">
                                    <span className="text-gray-600 mr-2">
                                        Linked text:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const parsed =
                                                parseLeadershipLinkMarker(
                                                    leadership.title
                                                );
                                            if (!parsed) return;
                                            setLinkEditor({
                                                id: leadership.id,
                                                field: "title",
                                                start: 0,
                                                end: 0,
                                                selectedText: parsed.label,
                                                url: parsed.url,
                                                mode: "edit",
                                            });
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                        style={{ textDecoration: "none" }}
                                    >
                                        {parseLeadershipLinkMarker(
                                            leadership.title
                                        )?.label || "Edit Link"}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Organization
                            </label>
                            <input
                                type="text"
                                value={leadership.organization}
                                onChange={(e) =>
                                    updateLeadership(
                                        leadership.id,
                                        "organization",
                                        e.target.value
                                    )
                                }
                                onSelect={(e) =>
                                    handleSelection(
                                        leadership.id,
                                        "organization",
                                        e
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Cathartic"
                            />
                            {parseLeadershipLinkMarker(
                                leadership.organization
                            ) && (
                                <div className="mt-1 text-xs">
                                    <span className="text-gray-600 mr-2">
                                        Linked text:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const parsed =
                                                parseLeadershipLinkMarker(
                                                    leadership.organization
                                                );
                                            if (!parsed) return;
                                            setLinkEditor({
                                                id: leadership.id,
                                                field: "organization",
                                                start: 0,
                                                end: 0,
                                                selectedText: parsed.label,
                                                url: parsed.url,
                                                mode: "edit",
                                            });
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                        style={{ textDecoration: "none" }}
                                    >
                                        {parseLeadershipLinkMarker(
                                            leadership.organization
                                        )?.label || "Edit Link"}
                                    </button>
                                </div>
                            )}
                        </div>
                        {linkEditor?.id === leadership.id && (
                            <div className="p-2 border border-blue-200 bg-blue-50 rounded-md">
                                <div className="text-xs text-blue-700 mb-2">
                                    Edit hyperlink
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={linkEditor.selectedText}
                                        onChange={(e) =>
                                            setLinkEditor((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          selectedText:
                                                              e.target.value,
                                                      }
                                                    : prev
                                            )
                                        }
                                        placeholder="Link text"
                                        className="flex-1 min-w-[180px] px-2 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <input
                                        type="text"
                                        value={linkEditor.url}
                                        onChange={(e) =>
                                            setLinkEditor((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          url: e.target.value,
                                                      }
                                                    : prev
                                            )
                                        }
                                        placeholder="Enter URL (https://...)"
                                        className="flex-1 min-w-[220px] px-2 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={insertLeadershipLink}
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                                    >
                                        Insert Link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLinkEditor(null)}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 whitespace-nowrap"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
