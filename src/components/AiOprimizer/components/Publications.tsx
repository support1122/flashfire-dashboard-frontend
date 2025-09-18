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
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        placeholder="e.g., Thriving from Work Questionnaire: Validation of a measure of worker wellbeing among older U.S. workers. Co-Author (Under peer review, Manuscript ID: ijerph-3753172)."
                    />
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
