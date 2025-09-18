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

interface WorkExperienceItem {
    id: string;
    position: string;
    company: string;
    duration: string;
    location: string;
    roleType: string;
    responsibilities: string[];
}

interface WorkExperienceProps {
    data: WorkExperienceItem[];
    onChange: (data: WorkExperienceItem[]) => void;
}

// Sortable item component
const SortableExperienceItem = ({
    experience,
    expIndex,
    onRemove,
    onUpdate,
    onUpdateResponsibilities,
    onAddResponsibility,
    onRemoveResponsibility,
}: {
    experience: WorkExperienceItem;
    expIndex: number;
    onRemove: (id: string) => void;
    onUpdate: (id: string, field: string, value: string) => void;
    onUpdateResponsibilities: (
        id: string,
        index: number,
        value: string
    ) => void;
    onAddResponsibility: (id: string) => void;
    onRemoveResponsibility: (id: string, index: number) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: experience.id });

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
                        Experience #{expIndex + 1}
                    </h4>
                </div>
                <button
                    onClick={() => onRemove(experience.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                    </label>
                    <input
                        type="text"
                        value={experience.company}
                        onChange={(e) =>
                            onUpdate(experience.id, "company", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., FLASHFIRE"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        value={experience.location}
                        onChange={(e) =>
                            onUpdate(experience.id, "location", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Remote, USA"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position Title
                    </label>
                    <input
                        type="text"
                        value={experience.position}
                        onChange={(e) =>
                            onUpdate(experience.id, "position", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Product Manager"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role Type
                    </label>
                    <select
                        value={experience.roleType}
                        onChange={(e) =>
                            onUpdate(experience.id, "roleType", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="None">None (Hidden from preview)</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Volunteer">Volunteer</option>
                        <option value="Freelance">Freelance</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                    </label>
                    <input
                        type="text"
                        value={experience.duration}
                        onChange={(e) =>
                            onUpdate(experience.id, "duration", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., July 2024 – Present"
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Key Responsibilities
                    </label>
                    <button
                        onClick={() => onAddResponsibility(experience.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        + Add Bullet Point
                    </button>
                </div>

                {experience.responsibilities.map(
                    (responsibility, respIndex) => (
                        <div
                            key={respIndex}
                            className="flex items-start gap-2 mb-2"
                        >
                            <span className="text-gray-400 mt-2">•</span>
                            <textarea
                                value={responsibility}
                                onChange={(e) =>
                                    onUpdateResponsibilities(
                                        experience.id,
                                        respIndex,
                                        e.target.value
                                    )
                                }
                                rows={2}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Describe your key achievement or responsibility..."
                            />
                            {experience.responsibilities.length > 1 && (
                                <button
                                    onClick={() =>
                                        onRemoveResponsibility(
                                            experience.id,
                                            respIndex
                                        )
                                    }
                                    className="text-red-600 hover:text-red-800 mt-2"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export const WorkExperience: React.FC<WorkExperienceProps> = ({
    data,
    onChange,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addExperience = () => {
        const newExperience: WorkExperienceItem = {
            id: Date.now().toString(),
            position: "",
            company: "",
            duration: "",
            location: "Remote, USA",
            roleType: "Full-time",
            responsibilities: [""],
        };
        onChange([...data, newExperience]);
    };

    const removeExperience = (id: string) => {
        onChange(data.filter((item) => item.id !== id));
    };

    const updateExperience = (id: string, field: string, value: string) => {
        onChange(
            data.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const updateResponsibilities = (
        id: string,
        index: number,
        value: string
    ) => {
        onChange(
            data.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          responsibilities: item.responsibilities.map(
                              (resp, i) => (i === index ? value : resp)
                          ),
                      }
                    : item
            )
        );
    };

    const addResponsibility = (id: string) => {
        onChange(
            data.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          responsibilities: [...item.responsibilities, ""],
                      }
                    : item
            )
        );
    };

    const removeResponsibility = (id: string, index: number) => {
        onChange(
            data.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          responsibilities: item.responsibilities.filter(
                              (_, i) => i !== index
                          ),
                      }
                    : item
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
                    Work Experience
                </h3>
                <button
                    onClick={addExperience}
                    className="ml-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus size={16} />
                    Add Experience
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
                        {data.map((experience, expIndex) => (
                            <SortableExperienceItem
                                key={experience.id}
                                experience={experience}
                                expIndex={expIndex}
                                onRemove={removeExperience}
                                onUpdate={updateExperience}
                                onUpdateResponsibilities={
                                    updateResponsibilities
                                }
                                onAddResponsibility={addResponsibility}
                                onRemoveResponsibility={removeResponsibility}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
