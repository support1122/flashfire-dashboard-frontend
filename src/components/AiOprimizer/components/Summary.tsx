import React from "react";

interface SummaryProps {
    data: string;
    onChange: (value: string) => void;
}

export const Summary: React.FC<SummaryProps> = ({ data, onChange }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Summary
            </h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Summary
                </label>
                <textarea
                    value={data}
                    onChange={(e) => onChange(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Write a compelling summary of your experience, skills, and achievements..."
                />
                <p className="text-xs text-gray-500 mt-1">
                    Tip: Keep it concise and highlight your key accomplishments
                    and expertise.
                </p>
            </div>
        </div>
    );
};
