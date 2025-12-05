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

interface ProjectItem {
    id: string;
    position: string;
    company: string;
    duration: string;
    location: string;
    roleType: string;
    responsibilities: string[];
    linkName: string;
    linkUrl: string;
}

interface ProjectsProps {
    data: ProjectItem[];
    onChange: (data: ProjectItem[]) => void;
}

// Sortable item component
const SortableProjectItem = ({
    project,
    projIndex,
    onRemove,
    onUpdate,
    onUpdateResponsibilities,
    onAddResponsibility,
    onRemoveResponsibility,
}: {
    project: ProjectItem;
    projIndex: number;
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
    } = useSortable({ id: project.id });

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
                        Project #{projIndex + 1}
                    </h4>
                </div>
                <button
                    onClick={() => onRemove(project.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Title
                    </label>
                    <input
                        type="text"
                        value={project.position}
                        onChange={(e) =>
                            onUpdate(project.id, "position", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., E-commerce Platform Development"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Type
                    </label>
                    <select
                        value={project.roleType}
                        onChange={(e) =>
                            onUpdate(project.id, "roleType", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="None">None</option>
                        <option value="Personal">Personal Project</option>
                        <option value="Academic">Academic Project</option>
                        <option value="Professional">
                            Professional Project
                        </option>
                        <option value="Open Source">Open Source</option>
                        <option value="Client Work">Client Work</option>
                        <option value="Freelance">Freelance Project</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization/Company
                    </label>
                    <input
                        type="text"
                        value={project.company}
                        onChange={(e) =>
                            onUpdate(project.id, "company", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Personal Project, University, Company Name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        value={project.location}
                        onChange={(e) =>
                            onUpdate(project.id, "location", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Remote, University Campus"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                    </label>
                    <input
                        type="text"
                        value={project.duration}
                        onChange={(e) =>
                            onUpdate(project.id, "duration", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., January 2024 – March 2024"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link Name (Optional)
                    </label>
                    <input
                        type="text"
                        value={project.linkName}
                        onChange={(e) =>
                            onUpdate(project.id, "linkName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Live Demo, GitHub, Website"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link URL (Optional)
                    </label>
                    <input
                        type="url"
                        value={project.linkUrl}
                        onChange={(e) =>
                            onUpdate(project.id, "linkUrl", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://github.com/username/project"
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Key Achievements & Technologies
                    </label>
                    <button
                        onClick={() => onAddResponsibility(project.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        + Add Bullet Point
                    </button>
                </div>

                {project.responsibilities.map((responsibility, respIndex) => (
                    <div
                        key={respIndex}
                        className="flex items-start gap-2 mb-2"
                    >
                        <span className="text-gray-400 mt-2">•</span>
                        <textarea
                            value={responsibility}
                            onChange={(e) =>
                                onUpdateResponsibilities(
                                    project.id,
                                    respIndex,
                                    e.target.value
                                )
                            }
                            rows={2}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Describe your key achievement, technology used, or project outcome..."
                        />
                        {project.responsibilities.length > 1 && (
                            <button
                                onClick={() =>
                                    onRemoveResponsibility(
                                        project.id,
                                        respIndex
                                    )
                                }
                                className="text-red-600 hover:text-red-800 mt-2"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Projects: React.FC<ProjectsProps> = ({ data, onChange }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addProject = () => {
        const newProject: ProjectItem = {
            id: Date.now().toString(),
            position: "",
            company: "",
            duration: "",
            location: "Remote, USA",
            roleType: "None",
            responsibilities: [""],
            linkName: "",
            linkUrl: "",
        };
        onChange([...data, newProject]);
    };

    const removeProject = (id: string) => {
        onChange(data.filter((item) => item.id !== id));
    };

    const updateProject = (id: string, field: string, value: string) => {
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
                    Projects
                </h3>
                <button
                    onClick={addProject}
                    className="ml-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus size={16} />
                    Add Project
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
                        {data.map((project, projIndex) => (
                            <SortableProjectItem
                                key={project.id}
                                project={project}
                                projIndex={projIndex}
                                onRemove={removeProject}
                                onUpdate={updateProject}
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
