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

interface EducationItem {
    id: string;
    institution: string;
    location: string;
    degree: string;
    field: string;
    duration: string;
    additionalInfo: string;
}

interface EducationProps {
    data: EducationItem[];
    onChange: (data: EducationItem[]) => void;
}

// Sortable item component
const SortableEducationItem = ({
    education,
    index,
    onRemove,
    onUpdate,
}: {
    education: EducationItem;
    index: number;
    onRemove: (id: string) => void;
    onUpdate: (id: string, field: string, value: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: education.id });

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
                        Education #{index + 1}
                    </h4>
                </div>
                <button
                    onClick={() => onRemove(education.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution
                    </label>
                    <input
                        type="text"
                        value={education.institution}
                        onChange={(e) =>
                            onUpdate(
                                education.id,
                                "institution",
                                e.target.value
                            )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., University of Southern California"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        value={education.location}
                        onChange={(e) =>
                            onUpdate(education.id, "location", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Los Angeles, CA, United States"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree
                    </label>
                    <input
                        type="text"
                        value={education.degree}
                        onChange={(e) =>
                            onUpdate(education.id, "degree", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Master of Science"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field of Study
                    </label>
                    <input
                        type="text"
                        value={education.field}
                        onChange={(e) =>
                            onUpdate(education.id, "field", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Engineering Management"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                    </label>
                    <input
                        type="text"
                        value={education.duration}
                        onChange={(e) =>
                            onUpdate(education.id, "duration", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 2020 - 2022"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Info (Awards, Specialization, etc.)
                    </label>
                    <textarea
                        value={education.additionalInfo}
                        onChange={(e) =>
                            onUpdate(
                                education.id,
                                "additionalInfo",
                                e.target.value
                            )
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="e.g., Dean's Master's Scholarship, Specialisation: UX/UI"
                    />
                </div>
            </div>
        </div>
    );
};

export const Education: React.FC<EducationProps> = ({ data, onChange }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addEducation = () => {
        const newEducation: EducationItem = {
            id: Date.now().toString(),
            institution: "",
            location: "",
            degree: "",
            field: "",
            duration: "",
            additionalInfo: "",
        };
        onChange([...data, newEducation]);
    };

    const removeEducation = (id: string) => {
        onChange(data.filter((item) => item.id !== id));
    };

    const updateEducation = (id: string, field: string, value: string) => {
        onChange(
            data.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = data.findIndex((item) => item.id === active.id);
            const newIndex = data.findIndex((item) => item.id === over?.id);

            onChange(arrayMove(data, oldIndex, newIndex));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex-1">
                    Education
                </h3>
                <button
                    onClick={addEducation}
                    className="ml-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus size={16} />
                    Add Education
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
                        {data.map((education, index) => (
                            <SortableEducationItem
                                key={education.id}
                                education={education}
                                index={index}
                                onRemove={removeEducation}
                                onUpdate={updateEducation}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
