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

const PROJECT_LINK_MARKER_REGEX = /<a>[\s\S]*?(?:<\/a>|<a\/>|$)/i;

const parseProjectLinkMarker = (text: string) => {
    const markerMatch = (text || "").match(/<a>([\s\S]*?)(?:<\/a>|<a\/>|$)/i);
    if (!markerMatch) return null;
    const fullMarker = markerMatch[0];
    const content = markerMatch[1] || "";
    const pipeIndex = content.indexOf("|");
    if (pipeIndex === -1) {
        return {
            fullMarker,
            label: content.trim(),
            url: content.trim(),
        };
    }
    return {
        fullMarker,
        label: content.slice(0, pipeIndex).trim(),
        url: content.slice(pipeIndex + 1).trim(),
    };
};

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

    const [linkEditor, setLinkEditor] = React.useState<{
        respIndex: number;
        start: number;
        end: number;
        selectedText: string;
        url: string;
        mode: "insert" | "edit";
    } | null>(null);

    const handleResponsibilitySelection = (
        respIndex: number,
        e: React.SyntheticEvent<HTMLTextAreaElement>
    ) => {
        const target = e.currentTarget;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        if (start === end) {
            if (linkEditor?.respIndex === respIndex) {
                setLinkEditor(null);
            }
            return;
        }
        const selectedText = target.value.slice(start, end).trim();
        if (!selectedText) return;
        setLinkEditor({
            respIndex,
            start,
            end,
            selectedText,
            url: "",
            mode: "insert",
        });
    };

    const insertResponsibilityLink = () => {
        if (!linkEditor) return;
        const current = project.responsibilities[linkEditor.respIndex] || "";
        if (linkEditor.mode === "insert" && PROJECT_LINK_MARKER_REGEX.test(current)) {
            window.alert("Only one hyperlink is allowed in each bullet point.");
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
        onUpdateResponsibilities(project.id, linkEditor.respIndex, updated);
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
                    <React.Fragment key={respIndex}>
                        <div className="flex items-start gap-2 mb-2">
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
                                onSelect={(e) =>
                                    handleResponsibilitySelection(respIndex, e)
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
                        {parseProjectLinkMarker(responsibility) && (
                            <div className="ml-6 mb-2 text-xs">
                                <span className="text-gray-600 mr-2">
                                    Linked text:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const parsed = parseProjectLinkMarker(
                                            responsibility
                                        );
                                        if (!parsed) return;
                                        setLinkEditor({
                                            respIndex,
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
                                    {parseProjectLinkMarker(responsibility)
                                        ?.label || "Edit Link"}
                                </button>
                            </div>
                        )}
                        {linkEditor?.respIndex === respIndex && (
                            <div className="ml-6 mb-3 p-2 border border-blue-200 bg-blue-50 rounded-md">
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
                                        onClick={insertResponsibilityLink}
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
                    </React.Fragment>
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
