import React from "react";
import { Trash2 } from "lucide-react";
import { CustomSectionItem } from "../types/ResumeTypes";

interface CustomSectionEditorProps {
    section: CustomSectionItem;
    onChange: (section: CustomSectionItem) => void;
    onRemove: () => void;
}

export const CustomSectionEditor: React.FC<CustomSectionEditorProps> = ({
    section,
    onChange,
    onRemove,
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section name
                </label>
                <input
                    type="text"
                    value={section.title}
                    onChange={(e) => onChange({ ...section, title: e.target.value })}
                    maxLength={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Certifications, Languages, Awards..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                </label>
                <textarea
                    value={section.content}
                    onChange={(e) => onChange({ ...section, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Plain text shown exactly as typed. Each line becomes its own line in the resume."
                />
                <p className="text-xs text-gray-500 mt-1">
                    Shown exactly as typed. This section is never changed by AI
                    optimization.
                </p>
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
                <Trash2 size={14} />
                Remove this section
            </button>
        </div>
    );
};
