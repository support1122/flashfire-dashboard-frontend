import React from "react";

interface TherapeuticAreasProps {
    data: string;
    onChange: (value: string) => void;
}

export const TherapeuticAreas: React.FC<TherapeuticAreasProps> = ({ data, onChange }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Therapeutic Areas
            </h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Therapeutic Areas
                </label>
                <textarea
                    value={data}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Oncology • Neuroscience (Neurology &amp; Psychiatry) • Cardiovascular &amp; Metabolic Disease • ..."
                />
                <p className="text-xs text-gray-500 mt-1">
                    Shown exactly as typed. This section is never changed by AI
                    optimization.
                </p>
            </div>
        </div>
    );
};
