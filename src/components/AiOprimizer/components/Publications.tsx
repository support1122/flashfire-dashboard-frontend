import React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Interface for a single publication item
interface PublicationItem {
    id: string;
    details: string;
}

// Interface for the props of the Publications component
interface PublicationsProps {
    data: PublicationItem[];
    onChange: (data: PublicationItem[]) => void;
}

const PUBLICATION_LINK_MARKER_REGEX = /<a>[\s\S]*?(?:<\/a>|<a\/>|$)/i;

const parsePublicationLinkMarker = (text: string) => {
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

// A sortable component for an individual publication item
const SortablePublicationItem = ({
    publication,
    index,
    onRemove,
    onUpdate,
}: {
    publication: PublicationItem;
    index: number;
    onRemove: (id: string) => void;
    onUpdate: (id: string, value: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: publication.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [linkEditor, setLinkEditor] = React.useState<{
        start: number;
        end: number;
        selectedText: string;
        url: string;
        mode: "insert" | "edit";
    } | null>(null);

    const handleDetailsSelection = (
        e: React.SyntheticEvent<HTMLTextAreaElement>
    ) => {
        const target = e.currentTarget;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        if (start === end) return;
        const selectedText = target.value.slice(start, end).trim();
        if (!selectedText) return;
        setLinkEditor({
            start,
            end,
            selectedText,
            url: "",
            mode: "insert",
        });
    };

    const insertDetailsLink = () => {
        if (!linkEditor) return;
        const current = publication.details || "";
        if (linkEditor.mode === "insert" && PUBLICATION_LINK_MARKER_REGEX.test(current)) {
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
        onUpdate(publication.id, updated);
        setLinkEditor(null);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${
                isDragging ? "shadow-lg opacity-50" : ""
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <GripVertical size={20} />
                    </div>
                    <h4 className="text-md font-medium text-gray-800">
                        Publication #{index + 1}
                    </h4>
                </div>
                <button
                    onClick={() => onRemove(publication.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Publication Details
                    </label>
                    <textarea
                        value={publication.details}
                        onChange={(e) =>
                            onUpdate(publication.id, e.target.value)
                        }
                        onSelect={handleDetailsSelection}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        placeholder="e.g., Thriving from Work Questionnaire: Validation of a measure of worker wellbeing among older U.S. workers. Co-Author (Under peer review, Manuscript ID: ijerph-3753172)."
                    />
                    {parsePublicationLinkMarker(publication.details) && (
                        <div className="mt-1 mb-2 text-xs">
                            <span className="text-gray-600 mr-2">Linked text:</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const parsed = parsePublicationLinkMarker(
                                        publication.details
                                    );
                                    if (!parsed) return;
                                    setLinkEditor({
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
                                {parsePublicationLinkMarker(publication.details)
                                    ?.label || "Edit Link"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const parsed = parsePublicationLinkMarker(
                                        publication.details
                                    );
                                    if (!parsed) return;
                                    onUpdate(
                                        publication.id,
                                        (publication.details || "").replace(
                                            parsed.fullMarker,
                                            parsed.label
                                        )
                                    );
                                    setLinkEditor(null);
                                }}
                                className="ml-2 text-red-600 hover:text-red-800"
                                title="Remove hyperlink"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                    {linkEditor && (
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
                                    onClick={insertDetailsLink}
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
        </div>
    );
};

// The main Publications component
export const Publications: React.FC<PublicationsProps> = ({
    data = [],
    onChange,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addPublication = () => {
        const newPublication: PublicationItem = {
            id: Date.now().toString(),
            details: "",
        };
        onChange([...data, newPublication]);
    };

    const removePublication = (id: string) => {
        onChange(data.filter((item) => item.id !== id));
    };

    const updatePublication = (id: string, value: string) => {
        onChange(
            data.map((item) =>
                item.id === id ? { ...item, details: value } : item
            )
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = data.findIndex((item) => item.id === active.id);
            const newIndex = data.findIndex((item) => item.id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                onChange(arrayMove(data, oldIndex, newIndex));
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex-1">
                    Publications
                </h3>
                <button
                    onClick={addPublication}
                    className="ml-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus size={16} />
                    Add Publication
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={data.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {data.map((publication, index) => (
                            <SortablePublicationItem
                                key={publication.id}
                                publication={publication}
                                index={index}
                                onRemove={removePublication}
                                onUpdate={updatePublication}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
