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

export const Leadership: React.FC<LeadershipProps> = ({ data, onChange }) => {
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Strategic Growth Advisor"
                            />
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Cathartic"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
