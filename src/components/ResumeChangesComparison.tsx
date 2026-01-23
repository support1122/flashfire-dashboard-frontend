
import React, { useState } from 'react';

const ResumeChangesComparison = ({ changesMade }: any) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    if (
        !changesMade ||
        !changesMade.startingContent ||
        !changesMade.finalChanges
    ) {
        return (
            // <div className="text-gray-500 italic">
            //     No changes available, please optimize your resume.
            // </div>
            null
        );
    }

    const { startingContent, finalChanges } = changesMade;

    // Toggle section expansion
    const toggleSection = (sectionKey: string) => {
        const newExpandedSections = new Set(expandedSections);
        if (newExpandedSections.has(sectionKey)) {
            newExpandedSections.delete(sectionKey);
        } else {
            newExpandedSections.add(sectionKey);
        }
        setExpandedSections(newExpandedSections);
    };

    // Get all unique keys from both objects
    const allKeys = new Set([
        ...Object.keys(startingContent),
        ...Object.keys(finalChanges),
    ]);

    // Helper function to render text
    // const renderText = (text: string) => {
    //     return <div className="text-sm whitespace-pre-wrap">{text}</div>;
    // };

    // Helper function to render array items
    const renderArrayItem = (item: any, index: number) => {
        // Handle responsibilities
        if (item.responsibilities && Array.isArray(item.responsibilities)) {
            return (
                <ul className="space-y-1 text-sm">
                    {item.responsibilities.map((resp: any, respIndex: number) => {
                        return (
                            <li key={respIndex} className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                <span>{resp}</span>
                            </li>
                        );
                    })}
                </ul>
            );
        }

        // Handle skills
        if (item.skills) {
            const capitalizeWords = (text: string) => {
                if (!text) return "";
                return text.split(/\s+/).map(word => {
                    if (!word) return word;
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }).join(" ");
            };
            const capitalizeSkills = (skillsString: string) => {
                if (!skillsString) return "";
                return skillsString.split(",").map((skill: string) => {
                    const trimmed = skill.trim();
                    if (!trimmed) return trimmed;
                    return capitalizeWords(trimmed);
                }).join(", ");
            };
            return (
                <div>
                    <div className="font-medium text-sm mb-1">
                        {item.category ? capitalizeWords(item.category) : "Skills"}
                    </div>
                    <div className="text-sm text-gray-600">
                        {capitalizeSkills(item.skills)}
                    </div>
                </div>
            );
        }

        // Handle additional info
        if (item.additionalInfo !== undefined) {
            return (
                <div className="text-sm">
                    {item.additionalInfo || "No additional information"}
                </div>
            );
        }

        // Handle job title and company
        if (item.jobTitle || item.company || item.position) {
            return (
                <div className="space-y-2">
                    <div className="font-medium text-sm">
                        {item.jobTitle || item.position || "Position"}
                    </div>
                    {item.company && (
                        <div className="text-sm text-gray-600">
                            {item.company}
                        </div>
                    )}
                    {item.responsibilities && Array.isArray(item.responsibilities) && (
                        <div className="mt-2">
                            {renderArrayItem(item, index)}
                        </div>
                    )}
                </div>
            );
        }

        // Fallback for other item types
        return (
            <div className="text-sm text-gray-600">
                {JSON.stringify(item, null, 2)}
            </div>
        );
    };

    const renderValue = (value: any) => {
        if (Array.isArray(value)) {
            return (
                <div className="space-y-3">
                    {value.map((item, index) => {
                        return (
                            <div
                                key={item.id || index}
                                className="border-l-2 border-gray-300 pl-3"
                            >
                                {renderArrayItem(item, index)}
                            </div>
                        );
                    })}
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

    const formatKeyName = (key: string) => {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str: string) => str.toUpperCase())
            .trim();
    };

    // Get section icon based on section name
    const getSectionIcon = (sectionName: string) => {
        const lowerSection = sectionName.toLowerCase();
        if (lowerSection.includes('summary') || lowerSection.includes('profile')) {
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
            );
        } else if (lowerSection.includes('experience') || lowerSection.includes('work')) {
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm3-2a1 1 0 011-1h2a1 1 0 011 1v1H9V4zm-4 4h10v6H4V8z" clipRule="evenodd" />
                </svg>
            );
        } else if (lowerSection.includes('skill')) {
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
            );
        } else if (lowerSection.includes('education')) {
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.429 3.058 11.092 11.092 0 01-2.943.757z" />
                </svg>
            );
        }
        // Default icon
        return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
        );
    };

    return (
        <div className="space-y-6">
            {/* Main Header */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">
                        Optimization Changes Summary
                    </h4>
                </div>

                {/* Vertical sections with horizontal comparison */}
                <div className="p-6 space-y-8">
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

                        const isExpanded = expandedSections.has(key);

                        return (
                            <div key={key} className="space-y-4">
                                {/* Section Header with Toggle Button */}
                                <div 
                                    className="flex items-center justify-between pb-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors duration-200"
                                    onClick={() => toggleSection(key)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="text-gray-600">
                                            {getSectionIcon(formatKeyName(key))}
                                        </div>
                                        <h5 className="text-lg font-semibold text-gray-800">
                                            {formatKeyName(key)} Changes
                                        </h5>
                                    </div>
                                    
                                    {/* Toggle Button */}
                                    <div className="flex items-center">
                                        <svg 
                                            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Collapsible Content */}
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                    {/* Horizontal comparison within section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                                        {/* Original Content */}
                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Old {formatKeyName(key)}:
                                                </span>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                {originalValue !== undefined ? (
                                                    <div className="text-sm leading-relaxed">
                                                        {renderValue(originalValue)}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400 italic">
                                                        No original content
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Optimized Content */}
                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Optimized {formatKeyName(key)}:
                                                </span>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                {optimizedValue !== undefined ? (
                                                    <div className="text-sm leading-relaxed">
                                                        {renderValue(optimizedValue)}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400 italic">
                                                        No optimized content
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary of changes */}
            {/* {changesMade.changedSections && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">
                        Sections Modified
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {changesMade.changedSections.map((section: any) => (
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
            )} */}
        </div>
    );
};


export default ResumeChangesComparison;
