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

export const Skills: React.FC<SkillsProps> = ({ data, onChange }) => {
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
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="e.g., Product Development, Go-To-Market Strategy, Product Marketing..."
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
