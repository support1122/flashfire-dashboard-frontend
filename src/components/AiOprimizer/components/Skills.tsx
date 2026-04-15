import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface SkillCategory {
    id: string;
    category: string;
    skills: string;
}

interface SkillsProps {
    data: SkillCategory[];
    onChange: (data: SkillCategory[]) => void;
}

const SKILLS_LINK_MARKER_REGEX = /<a>[\s\S]*?(?:<\/a>|<a\/>|$)/i;

const parseSkillsLinkMarker = (text: string) => {
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

export const Skills: React.FC<SkillsProps> = ({ data, onChange }) => {
    const [linkEditor, setLinkEditor] = React.useState<{
        id: string;
        start: number;
        end: number;
        selectedText: string;
        url: string;
        mode: "insert" | "edit";
    } | null>(null);

    const addCategory = () => {
        const newCategory: SkillCategory = {
            id: Date.now().toString(),
            category: "",
            skills: "",
        };
        onChange([...data, newCategory]);
    };

    const removeCategory = (id: string) => {
        onChange(data.filter((item) => item.id !== id));
    };

    const updateCategory = (id: string, field: string, value: string) => {
        onChange(
            data.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSkillsSelection = (
        id: string,
        e: React.SyntheticEvent<HTMLTextAreaElement>
    ) => {
        const target = e.currentTarget;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        if (start === end) return;
        const selectedText = target.value.slice(start, end).trim();
        if (!selectedText) return;
        setLinkEditor({
            id,
            start,
            end,
            selectedText,
            url: "",
            mode: "insert",
        });
    };

    const insertSkillsLink = () => {
        if (!linkEditor) return;
        const currentCategory = data.find((item) => item.id === linkEditor.id);
        if (!currentCategory) return;
        const current = currentCategory.skills || "";
        if (
            linkEditor.mode === "insert" &&
            SKILLS_LINK_MARKER_REGEX.test(current)
        ) {
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
        updateCategory(linkEditor.id, "skills", updated);
        setLinkEditor(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex-1">
                    Skills
                </h3>
                <button
                    onClick={addCategory}
                    className="ml-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus size={16} />
                    Add Category
                </button>
            </div>

            {data.map((category, index) => (
                <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                    <div className="flex items-start justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-800">
                            Category #{index + 1}
                        </h4>
                        {data.length > 1 && (
                            <button
                                onClick={() => removeCategory(category.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={category.category}
                                onChange={(e) =>
                                    updateCategory(
                                        category.id,
                                        "category",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Product Management & Strategy"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Skills (comma-separated)
                            </label>
                            <textarea
                                value={category.skills}
                                onChange={(e) =>
                                    updateCategory(
                                        category.id,
                                        "skills",
                                        e.target.value
                                    )
                                }
                                onSelect={(e) =>
                                    handleSkillsSelection(category.id, e)
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="e.g., Product Development, Go-To-Market Strategy, Product Marketing..."
                            />
                            {parseSkillsLinkMarker(category.skills) && (
                                <div className="mt-2 text-xs">
                                    <span className="text-gray-600 mr-2">
                                        Linked text:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const parsed =
                                                parseSkillsLinkMarker(
                                                    category.skills
                                                );
                                            if (!parsed) return;
                                            setLinkEditor({
                                                id: category.id,
                                                start: 0,
                                                end: 0,
                                                selectedText:
                                                    parsed.label || "",
                                                url: parsed.url || "",
                                                mode: "edit",
                                            });
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                        style={{ textDecoration: "none" }}
                                    >
                                        {parseSkillsLinkMarker(category.skills)
                                            ?.label || "Edit Link"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const parsed =
                                                parseSkillsLinkMarker(
                                                    category.skills
                                                );
                                            if (!parsed) return;
                                            updateCategory(
                                                category.id,
                                                "skills",
                                                category.skills.replace(
                                                    parsed.fullMarker,
                                                    parsed.label
                                                )
                                            );
                                            if (linkEditor?.id === category.id) {
                                                setLinkEditor(null);
                                            }
                                        }}
                                        className="ml-2 text-red-600 hover:text-red-800"
                                        title="Remove hyperlink"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                            {linkEditor?.id === category.id && (
                                <div className="mt-2 p-2 border border-blue-200 bg-blue-50 rounded-md">
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
                                            className="flex-1 min-w-[180px] px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={linkEditor.url}
                                            onChange={(e) =>
                                                setLinkEditor((prev) =>
                                                    prev
                                                        ? {
                                                              ...prev,
                                                              url: e.target
                                                                  .value,
                                                          }
                                                        : prev
                                                )
                                            }
                                            placeholder="Enter URL (https://...)"
                                            className="flex-1 min-w-[220px] px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={insertSkillsLink}
                                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 whitespace-nowrap"
                                        >
                                            Insert Link
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLinkEditor(null)}
                                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 whitespace-nowrap"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
