import React from "react";

const ResumeChangesComparison = ({ changesMade }) => {
    if (
        !changesMade ||
        !changesMade.startingContent ||
        !changesMade.finalChanges
    ) {
        return (
            <div className="text-gray-500 italic">
                No changes available, please optimize your resume.
            </div>
        );
    }

    const { startingContent, finalChanges } = changesMade;

    // Get all unique keys from both objects
    const allKeys = new Set([
        ...Object.keys(startingContent),
        ...Object.keys(finalChanges),
    ]);

    const renderValue = (value, isOriginal = false) => {
        if (Array.isArray(value)) {
            return (
                <div className="space-y-3">
                    {value.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="border-l-2 border-gray-300 pl-3"
                        >
                            {item.responsibilities ? (
                                <ul className="space-y-1 text-sm">
                                    {item.responsibilities.map(
                                        (resp, respIndex) => (
                                            <li
                                                key={respIndex}
                                                className="flex items-start"
                                            >
                                                <span className="text-gray-400 mr-2">
                                                    •
                                                </span>
                                                <span>{resp}</span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            ) : item.skills ? (
                                <div>
                                    <div className="font-medium text-sm mb-1">
                                        {item.category}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {item.skills}
                                    </div>
                                </div>
                            ) : item.additionalInfo !== undefined ? (
                                <div className="text-sm">
                                    {item.additionalInfo ||
                                        "No additional information"}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-600">
                                    {JSON.stringify(item, null, 2)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof value === "string") {
            return <div className="text-sm whitespace-pre-wrap">{value}</div>;
        }

        return (
            <div className="text-sm text-gray-600">
                {JSON.stringify(value, null, 2)}
            </div>
        );
    };

    const formatKeyName = (key) => {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">
                        Resume Changes Comparison
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                        Compare your original resume with the optimized version
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-4 px-6 font-medium text-gray-900 bg-gray-50 w-32">
                                    Section
                                </th>
                                <th className="text-left py-4 px-6 font-medium text-gray-900 bg-red-50">
                                    Original Content
                                </th>
                                <th className="text-left py-4 px-6 font-medium text-gray-900 bg-green-50">
                                    Optimized Content
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from(allKeys).map((key) => {
                                const originalValue = startingContent[key];
                                const optimizedValue = finalChanges[key];

                                // Skip if both values are undefined or null
                                if (
                                    originalValue === undefined &&
                                    optimizedValue === undefined
                                ) {
                                    return null;
                                }

                                return (
                                    <tr
                                        key={key}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                    >
                                        <td className="py-6 px-6 font-medium text-gray-700 bg-gray-50 align-top">
                                            <div className="sticky top-0">
                                                {formatKeyName(key)}
                                            </div>
                                        </td>
                                        <td className="py-6 px-6 bg-red-50 align-top max-w-md">
                                            {originalValue !== undefined ? (
                                                <div className="bg-white rounded-md p-4 border border-red-200">
                                                    {renderValue(
                                                        originalValue,
                                                        true
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 italic bg-white rounded-md p-4 border border-red-200">
                                                    No original content
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-6 px-6 bg-green-50 align-top max-w-md">
                                            {optimizedValue !== undefined ? (
                                                <div className="bg-white rounded-md p-4 border border-green-200">
                                                    {renderValue(
                                                        optimizedValue,
                                                        false
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 italic bg-white rounded-md p-4 border border-green-200">
                                                    No optimized content
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary of changes */}
            {changesMade.changedSections && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">
                        Sections Modified
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {changesMade.changedSections.map((section) => (
                            <span
                                key={section}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                                {formatKeyName(section)}
                            </span>
                        ))}
                    </div>
                    {changesMade.timestamp && (
                        <p className="text-sm text-blue-700 mt-3">
                            Last updated:{" "}
                            {new Date(changesMade.timestamp).toLocaleString()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// Example usage with your case structure
const ResumeChangesCase = ({ jobDetails, hasResumeForJob }) => {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Changes Made
                </h4>
                {hasResumeForJob ? (
                    <ResumeChangesComparison
                        changesMade={jobDetails.changesMade}
                    />
                ) : (
                    <div className="text-gray-500 italic">
                        No changes available, please optimize your resume.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeChangesComparison;
