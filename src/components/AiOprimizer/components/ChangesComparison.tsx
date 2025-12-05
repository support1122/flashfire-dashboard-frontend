import React from "react";
import { useParams } from "react-router-dom";
import { useResumeStore } from "../store/useResumeStore";
import { useJobsSessionStore } from "../../../state_management/JobsSessionStore";

interface WorkExperienceItem {
    id: string;
    position: string;
    company: string;
    duration: string;
    location: string;
    roleType: string;
    responsibilities: string[];
}

interface ProjectItem {
    id: string;
    position: string;
    company: string;
    duration: string;
    location: string;
    roleType: string;
    responsibilities: string[];
}

interface LeadershipItem {
    id: string;
    title: string;
    organization: string;
}

interface SkillCategory {
    id: string;
    category: string;
    skills: string;
}

interface EducationItem {
    id: string;
    institution: string;
    location: string;
    degree: string;
    field: string;
    additionalInfo: string;
}

interface ResumeData {
    personalInfo: {
        name: string;
        title: string;
        phone: string;
        email: string;
        location: string;
        linkedin: string;
        portfolio: string;
    };
    summary: string;
    workExperience: WorkExperienceItem[];
    projects: ProjectItem[];
    leadership: LeadershipItem[];
    skills: SkillCategory[];
    education: EducationItem[];
}

interface ChangesComparisonProps {
    originalData: ResumeData;
    optimizedData: ResumeData;
    changedFields: Set<string>;
}

export const ChangesComparison: React.FC<ChangesComparisonProps> = ({
    originalData,
    optimizedData,
    changedFields,
}) => {
    const { setCurrentView: setCurrentResumeView } = useResumeStore();
    const { refreshJobByMongoId } = useJobsSessionStore(); // Get the refresh function from store
    // Helper to check if a field has changed
    const isFieldChanged = (field: string) => changedFields.has(field);

    // Helper to compare arrays of objects
    const getChangedItems = (
        originalArr: any[],
        optimizedArr: any[],
        keyFields: string[]
    ) => {
        return originalArr
            .map((orig, idx) => {
                const opt = optimizedArr[idx];
                if (!opt) return null;
                for (const key of keyFields) {
                    if (
                        JSON.stringify(orig[key]) !== JSON.stringify(opt[key])
                    ) {
                        return { original: orig, optimized: opt };
                    }
                }
                return null;
            })
            .filter(Boolean);
    };

    // Personal Info fields
    const personalInfoFields = [
        "name",
        "title",
        "email",
        "phone",
        "location",
        "linkedin",
        "portfolio",
    ];
    const personalInfoChanged = personalInfoFields.some(
        (field) =>
            originalData.personalInfo[field] !==
            optimizedData.personalInfo[field]
    );

    // Summary
    const summaryChanged = originalData.summary !== optimizedData.summary;

    // Work Experience
    const changedWorkExperience = getChangedItems(
        originalData.workExperience,
        optimizedData.workExperience,
        [
            "position",
            "company",
            "duration",
            "location",
            "roleType",
            "responsibilities",
        ]
    );

    // Projects
    const changedProjects = getChangedItems(
        originalData.projects,
        optimizedData.projects,
        [
            "position",
            "company",
            "duration",
            "location",
            "roleType",
            "responsibilities",
        ]
    );

    // Leadership
    const changedLeadership = getChangedItems(
        originalData.leadership,
        optimizedData.leadership,
        ["title", "organization"]
    );

    // Skills
    const changedSkills = getChangedItems(
        originalData.skills,
        optimizedData.skills,
        ["category", "skills"]
    );

    // Education
    const changedEducation = getChangedItems(
        originalData.education,
        optimizedData.education,
        ["institution", "location", "degree", "field", "additionalInfo"]
    );
    const getChangedFieldsOnly = () => {
        const startingContent: any = {};
        const finalChanges: any = {};

        // Personal Info - only changed fields
        const personalInfoChanged = Object.keys(
            originalData.personalInfo
        ).filter(
            (key) =>
                originalData.personalInfo[
                    key as keyof typeof originalData.personalInfo
                ] !==
                optimizedData.personalInfo[
                    key as keyof typeof optimizedData.personalInfo
                ]
        );

        if (personalInfoChanged.length > 0) {
            startingContent.personalInfo = {};
            finalChanges.personalInfo = {};
            personalInfoChanged.forEach((key) => {
                const typedKey = key as keyof typeof originalData.personalInfo;
                startingContent.personalInfo[key] =
                    originalData.personalInfo[typedKey];
                finalChanges.personalInfo[key] =
                    optimizedData.personalInfo[typedKey];
            });
        }

        // Summary - only if changed
        if (originalData.summary !== optimizedData.summary) {
            startingContent.summary = originalData.summary;
            finalChanges.summary = optimizedData.summary;
        }

        // Work Experience - only changed items and their changed fields
        const changedWorkExp = originalData.workExperience
            .map((orig, idx) => {
                const opt = optimizedData.workExperience[idx];
                if (!opt) return null;

                const changes: any = {};
                const originals: any = {};
                let hasChanges = false;

                // Check each field for changes
                [
                    "position",
                    "company",
                    "duration",
                    "location",
                    "roleType",
                ].forEach((field) => {
                    if (
                        orig[field as keyof typeof orig] !==
                        opt[field as keyof typeof opt]
                    ) {
                        originals[field] = orig[field as keyof typeof orig];
                        changes[field] = opt[field as keyof typeof opt];
                        hasChanges = true;
                    }
                });

                // Check responsibilities
                if (
                    JSON.stringify(orig.responsibilities) !==
                    JSON.stringify(opt.responsibilities)
                ) {
                    originals.responsibilities = [...orig.responsibilities];
                    changes.responsibilities = [...opt.responsibilities];
                    hasChanges = true;
                }

                if (hasChanges) {
                    return {
                        id: orig.id,
                        original: originals,
                        optimized: changes,
                    };
                }
                return null;
            })
            .filter(Boolean);

        if (changedWorkExp.length > 0) {
            startingContent.workExperience = changedWorkExp.map((item) => ({
                id: item!.id,
                ...item!.original,
            }));
            finalChanges.workExperience = changedWorkExp.map((item) => ({
                id: item!.id,
                ...item!.optimized,
            }));
        }

        // Projects - only changed items and their changed fields
        const changedProjects = originalData.projects
            .map((orig, idx) => {
                const opt = optimizedData.projects[idx];
                if (!opt) return null;

                const changes: any = {};
                const originals: any = {};
                let hasChanges = false;

                // Check each field for changes
                [
                    "position",
                    "company",
                    "duration",
                    "location",
                    "roleType",
                ].forEach((field) => {
                    if (
                        orig[field as keyof typeof orig] !==
                        opt[field as keyof typeof opt]
                    ) {
                        originals[field] = orig[field as keyof typeof orig];
                        changes[field] = opt[field as keyof typeof opt];
                        hasChanges = true;
                    }
                });

                // Check responsibilities
                if (
                    JSON.stringify(orig.responsibilities) !==
                    JSON.stringify(opt.responsibilities)
                ) {
                    originals.responsibilities = [...orig.responsibilities];
                    changes.responsibilities = [...opt.responsibilities];
                    hasChanges = true;
                }

                if (hasChanges) {
                    return {
                        id: orig.id,
                        original: originals,
                        optimized: changes,
                    };
                }
                return null;
            })
            .filter(Boolean);

        if (changedProjects.length > 0) {
            startingContent.projects = changedProjects.map((item) => ({
                id: item!.id,
                ...item!.original,
            }));
            finalChanges.projects = changedProjects.map((item) => ({
                id: item!.id,
                ...item!.optimized,
            }));
        }

        // Leadership - only changed items
        const changedLeadership = originalData.leadership
            .map((orig, idx) => {
                const opt = optimizedData.leadership[idx];
                if (!opt) return null;

                if (
                    orig.title !== opt.title ||
                    orig.organization !== opt.organization
                ) {
                    return {
                        id: orig.id,
                        original: {
                            title: orig.title,
                            organization: orig.organization,
                        },
                        optimized: {
                            title: opt.title,
                            organization: opt.organization,
                        },
                    };
                }
                return null;
            })
            .filter(Boolean);

        if (changedLeadership.length > 0) {
            startingContent.leadership = changedLeadership.map((item) => ({
                id: item!.id,
                ...item!.original,
            }));
            finalChanges.leadership = changedLeadership.map((item) => ({
                id: item!.id,
                ...item!.optimized,
            }));
        }

        // Skills - only changed categories
        const changedSkills = originalData.skills
            .map((orig, idx) => {
                const opt = optimizedData.skills[idx];
                if (!opt) return null;

                if (
                    orig.category !== opt.category ||
                    orig.skills !== opt.skills
                ) {
                    return {
                        id: orig.id,
                        original: {
                            category: orig.category,
                            skills: orig.skills,
                        },
                        optimized: {
                            category: opt.category,
                            skills: opt.skills,
                        },
                    };
                }
                return null;
            })
            .filter(Boolean);

        if (changedSkills.length > 0) {
            startingContent.skills = changedSkills.map((item) => ({
                id: item!.id,
                ...item!.original,
            }));
            finalChanges.skills = changedSkills.map((item) => ({
                id: item!.id,
                ...item!.optimized,
            }));
        }

        // Education - only changed items
        const changedEducation = originalData.education
            .map((orig, idx) => {
                const opt = optimizedData.education[idx];
                if (!opt) return null;

                const fields = [
                    "institution",
                    "location",
                    "degree",
                    "field",
                    "additionalInfo",
                ];
                const hasChanges = fields.some(
                    (field) =>
                        orig[field as keyof typeof orig] !==
                        opt[field as keyof typeof opt]
                );

                if (hasChanges) {
                    const originals: any = {};
                    const changes: any = {};

                    fields.forEach((field) => {
                        const typedField = field as keyof typeof orig;
                        if (orig[typedField] !== opt[typedField]) {
                            originals[field] = orig[typedField];
                            changes[field] = opt[typedField];
                        }
                    });

                    return {
                        id: orig.id,
                        original: originals,
                        optimized: changes,
                    };
                }
                return null;
            })
            .filter(Boolean);

        if (changedEducation.length > 0) {
            startingContent.education = changedEducation.map((item) => ({
                id: item!.id,
                ...item!.original,
            }));
            finalChanges.education = changedEducation.map((item) => ({
                id: item!.id,
                ...item!.optimized,
            }));
        }

        return { startingContent, finalChanges };
    };
    const { startingContent, finalChanges } = getChangedFieldsOnly();
    const { jobId } = useParams<{ jobId: string }>();
    console.log("Job ID from URL:", jobId);

    const handleComparisonChange = async () => {
        try {
            const apiUrl =
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

            console.log("Saving changes for job ID:", jobId);

            const response = await fetch(`${apiUrl}/saveChangedSession`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: jobId,
                    startingContent: startingContent,
                    finalChanges: finalChanges,
                }),
            });
            
            if (response.ok) {
                console.log("Changes saved successfully, now refreshing job data...");
                
                // After saving successfully, refresh the job from backend in the background
                // This happens seamlessly without any loaders
                if (jobId && refreshJobByMongoId) {
                    try {
                        // Call the new backend route to fetch updated job data
                        // This will update session storage with the latest changesMade from DB
                        await refreshJobByMongoId(jobId);
                        console.log("Job data refreshed successfully in session storage");
                    } catch (err) {
                        console.error('Error refreshing job in background:', err);
                    }
                }
                
                alert("Changes saved successfully");
            } else {
                const errorText = await response.text();
                console.error("Failed to save changes:", errorText);
                alert("Failed to save changes");
            }
        } catch (error) {
            console.error("Error during comparison change:", error);
            console.log("Error during comparison change:", error);
            alert("Error saving changes");
        }
        // console.log("hi", "original", finalChanges);
        // console.log("hi", "optimized", startingContent);
    };

    return (
        <div className="space-y-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                📊 Optimization Changes Summary
            </h2>

            {/* Personal Info Changes */}
            {personalInfoChanged && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        👤 Personal Information Changes
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-red-700 mb-3 bg-red-50 p-2 rounded">
                                🔴 Old Personal Info:
                            </h4>
                            <div className="text-sm text-gray-700 bg-red-50 p-4 rounded border-l-4 border-red-400 leading-relaxed space-y-2">
                                {personalInfoFields.map(
                                    (field) =>
                                        originalData.personalInfo[field] !==
                                            optimizedData.personalInfo[
                                                field
                                            ] && (
                                            <div key={field}>
                                                <strong>
                                                    {field
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        field.slice(1)}
                                                    :
                                                </strong>{" "}
                                                {
                                                    originalData.personalInfo[
                                                        field
                                                    ]
                                                }
                                            </div>
                                        )
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-green-700 mb-3 bg-green-50 p-2 rounded">
                                🟢 Optimized Personal Info:
                            </h4>
                            <div className="text-sm text-gray-700 bg-green-50 p-4 rounded border-l-4 border-green-400 leading-relaxed space-y-2">
                                {personalInfoFields.map(
                                    (field) =>
                                        originalData.personalInfo[field] !==
                                            optimizedData.personalInfo[
                                                field
                                            ] && (
                                            <div key={field}>
                                                <strong>
                                                    {field
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        field.slice(1)}
                                                    :
                                                </strong>{" "}
                                                {
                                                    optimizedData.personalInfo[
                                                        field
                                                    ]
                                                }
                                            </div>
                                        )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Changes */}
            {summaryChanged && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        📝 Summary Changes
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-red-700 mb-3 bg-red-50 p-2 rounded">
                                🔴 Old Summary:
                            </h4>
                            <div className="text-sm text-gray-700 bg-red-50 p-4 rounded border-l-4 border-red-400 leading-relaxed">
                                {originalData.summary || "No summary provided"}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-green-700 mb-3 bg-green-50 p-2 rounded">
                                🟢 Optimized Summary:
                            </h4>
                            <div className="text-sm text-gray-700 bg-green-50 p-4 rounded border-l-4 border-green-400 leading-relaxed">
                                {optimizedData.summary}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Work Experience Changes */}
            {changedWorkExperience.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        💼 Work Experience Changes
                    </h3>
                    {changedWorkExperience.map(
                        ({ original, optimized }, idx) => (
                            <div
                                key={original.id}
                                className="mb-8 border border-gray-200 rounded-lg overflow-hidden"
                            >
                                <div className="bg-gray-100 p-3">
                                    <h4 className="font-semibold text-gray-800">
                                        {original.company} - {original.position}
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                                    <div className="p-4 bg-red-25">
                                        <h5 className="font-medium text-red-700 mb-3 bg-red-100 p-2 rounded">
                                            🔴 Old Work Experience:
                                        </h5>
                                        <div className="space-y-2">
                                            {original.responsibilities.map(
                                                (resp, respIndex) =>
                                                    (!optimized
                                                        .responsibilities[
                                                        respIndex
                                                    ] ||
                                                        resp !==
                                                            optimized
                                                                .responsibilities[
                                                                respIndex
                                                            ]) &&
                                                    resp.trim() && (
                                                        <div
                                                            key={respIndex}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="text-red-600 mt-1">
                                                                •
                                                            </span>
                                                            <div className="text-sm text-gray-700 leading-relaxed">
                                                                {resp}
                                                            </div>
                                                        </div>
                                                    )
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-green-25 border-l border-gray-200">
                                        <h5 className="font-medium text-green-700 mb-3 bg-green-100 p-2 rounded">
                                            🟢 New Work Experience:
                                        </h5>
                                        <div className="space-y-2">
                                            {optimized.responsibilities.map(
                                                (resp, respIndex) =>
                                                    (!original.responsibilities[
                                                        respIndex
                                                    ] ||
                                                        resp !==
                                                            original
                                                                .responsibilities[
                                                                respIndex
                                                            ]) &&
                                                    resp.trim() && (
                                                        <div
                                                            key={respIndex}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="text-green-600 mt-1">
                                                                •
                                                            </span>
                                                            <div className="text-sm text-gray-700 leading-relaxed">
                                                                {resp}
                                                            </div>
                                                        </div>
                                                    )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Projects Changes */}
            {changedProjects.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        🚀 Projects Changes
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-red-700 mb-3 bg-red-50 p-2 rounded">
                                🔴 Old Projects:
                            </h4>
                            <div className="space-y-3">
                                {changedProjects.map(({ original }, idx) => (
                                    <div
                                        key={original.id}
                                        className="bg-red-50 p-4 rounded border-l-4 border-red-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-2">
                                            {original.position} -{" "}
                                            {original.company}
                                        </div>
                                        <div className="text-xs text-gray-600 mb-2">
                                            {original.duration} |{" "}
                                            {original.location}
                                        </div>
                                        <div className="space-y-1">
                                            {original.responsibilities.map(
                                                (resp, respIndex) =>
                                                    (!changedProjects[idx]
                                                        .optimized
                                                        .responsibilities[
                                                        respIndex
                                                    ] ||
                                                        resp !==
                                                            changedProjects[idx]
                                                                .optimized
                                                                .responsibilities[
                                                                respIndex
                                                            ]) &&
                                                    resp.trim() && (
                                                        <div
                                                            key={respIndex}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="text-red-600 mt-1 text-xs">
                                                                •
                                                            </span>
                                                            <div className="text-xs text-gray-700 leading-relaxed">
                                                                {resp}
                                                            </div>
                                                        </div>
                                                    )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-green-700 mb-3 bg-green-50 p-2 rounded">
                                🟢 Optimized Projects:
                            </h4>
                            <div className="space-y-3">
                                {changedProjects.map(({ optimized }, idx) => (
                                    <div
                                        key={optimized.id}
                                        className="bg-green-50 p-4 rounded border-l-4 border-green-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-2">
                                            {optimized.position} -{" "}
                                            {optimized.company}
                                        </div>
                                        <div className="text-xs text-gray-600 mb-2">
                                            {optimized.duration} |{" "}
                                            {optimized.location}
                                        </div>
                                        <div className="space-y-1">
                                            {optimized.responsibilities.map(
                                                (resp, respIndex) =>
                                                    (!changedProjects[idx]
                                                        .original
                                                        .responsibilities[
                                                        respIndex
                                                    ] ||
                                                        resp !==
                                                            changedProjects[idx]
                                                                .original
                                                                .responsibilities[
                                                                respIndex
                                                            ]) &&
                                                    resp.trim() && (
                                                        <div
                                                            key={respIndex}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="text-green-600 mt-1 text-xs">
                                                                •
                                                            </span>
                                                            <div className="text-xs text-gray-700 leading-relaxed">
                                                                {resp}
                                                            </div>
                                                        </div>
                                                    )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leadership Changes */}
            {changedLeadership.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        🏆 Leadership & Achievements Changes
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-red-700 mb-3 bg-red-50 p-2 rounded">
                                🔴 Old Leadership:
                            </h4>
                            <div className="space-y-3">
                                {changedLeadership.map(({ original }) => (
                                    <div
                                        key={original.id}
                                        className="bg-red-50 p-3 rounded border-l-4 border-red-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-1">
                                            {original.title}
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {original.organization}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-green-700 mb-3 bg-green-50 p-2 rounded">
                                🟢 Optimized Leadership:
                            </h4>
                            <div className="space-y-3">
                                {changedLeadership.map(({ optimized }) => (
                                    <div
                                        key={optimized.id}
                                        className="bg-green-50 p-3 rounded border-l-4 border-green-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-1">
                                            {optimized.title}
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {optimized.organization}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Skills Changes */}
            {changedSkills.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        🛠️ Skills Changes
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-red-700 mb-3 bg-red-50 p-2 rounded">
                                🔴 Old Skills:
                            </h4>
                            <div className="space-y-3">
                                {changedSkills.map(({ original }) => (
                                    <div
                                        key={original.id}
                                        className="bg-red-50 p-3 rounded border-l-4 border-red-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-1">
                                            {original.category}:
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {original.skills}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-green-700 mb-3 bg-green-50 p-2 rounded">
                                🟢 Optimized Skills:
                            </h4>
                            <div className="space-y-3">
                                {changedSkills.map(({ optimized }) => (
                                    <div
                                        key={optimized.id}
                                        className="bg-green-50 p-3 rounded border-l-4 border-green-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-1">
                                            {optimized.category}:
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {optimized.skills}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Education Changes */}
            {changedEducation.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        🎓 Education Changes
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-red-700 mb-3 bg-red-50 p-2 rounded">
                                🔴 Old Education:
                            </h4>
                            <div className="space-y-3">
                                {changedEducation.map(({ original }) => (
                                    <div
                                        key={original.id}
                                        className="bg-red-50 p-4 rounded border-l-4 border-red-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-2">
                                            {original.institution} -{" "}
                                            {original.degree}, {original.field}
                                        </div>
                                        {original.additionalInfo && (
                                            <div className="text-sm text-gray-700">
                                                {original.additionalInfo}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-green-700 mb-3 bg-green-50 p-2 rounded">
                                🟢 Optimized Education:
                            </h4>
                            <div className="space-y-3">
                                {changedEducation.map(({ optimized }) => (
                                    <div
                                        key={optimized.id}
                                        className="bg-green-50 p-4 rounded border-l-4 border-green-400"
                                    >
                                        <div className="font-medium text-sm text-gray-800 mb-2">
                                            {optimized.institution} -{" "}
                                            {optimized.degree},{" "}
                                            {optimized.field}
                                        </div>
                                        {optimized.additionalInfo && (
                                            <div className="text-sm text-gray-700">
                                                {optimized.additionalInfo}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* <div className="flex justify-center">
                <button
                    onClick={handleComparisonChange}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700"
                >
                    show changes in dashboard
                </button>
            </div> */}
            {/* Summary Note */}
            {(personalInfoChanged ||
                summaryChanged ||
                changedWorkExperience.length > 0 ||
                changedProjects.length > 0 ||
                changedLeadership.length > 0 ||
                changedSkills.length > 0 ||
                changedEducation.length > 0) && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center text-blue-800">
                        <span className="text-2xl mr-3">ℹ️</span>
                        <span className="font-medium">
                            Only changed sections and content are shown above.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
