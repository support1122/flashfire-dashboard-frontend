import React from "react";
import { X, FileText, Edit, Trash2, Plus } from "lucide-react";

// Type definitions
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

interface EducationItem {
    id: string;
    institution: string;
    location: string;
    degree: string;
    field: string;
    additionalInfo: string;
}

interface SkillCategory {
    id: string;
    category: string;
    skills: string;
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
        github: string;
        publications?: string;
    };
    summary: string;
    workExperience: WorkExperienceItem[];
    projects: ProjectItem[];
    leadership: LeadershipItem[];
    skills: SkillCategory[];
    education: EducationItem[];
}

interface SavedResume {
    id: string;
    firstName: string;
    fullName: string;
    lastModified: string;
    data: ResumeData;
    showLeadership: boolean;
    showProjects: boolean;
}

interface ResumeListModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedResumes: SavedResume[];
    onLoadResume: (resume: SavedResume) => void;
    onDeleteResume: (resumeId: string) => void;
    onCreateNew: () => void;
}

const ResumeListModal: React.FC<ResumeListModalProps> = ({
    isOpen,
    onClose,
    savedResumes,
    onLoadResume,
    onDeleteResume,
    onCreateNew,
}) => {
    if (!isOpen) return null;

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleDeleteClick = (resumeId: string): void => {
        if (
            window.confirm(
                "Are you sure you want to delete this resume? This action cannot be undone."
            )
        ) {
            onDeleteResume(resumeId);
        }
    };

    const truncateText = (text: string, maxLength: number): string => {
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            All Resumes
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Manage your saved resumes ({savedResumes.length}{" "}
                            total)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Create New Button */}
                    <button
                        onClick={onCreateNew}
                        className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                        <Plus size={20} />
                        Create New Resume
                    </button>

                    {savedResumes.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText
                                size={48}
                                className="mx-auto text-gray-400 mb-4"
                            />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No saved resumes
                            </h3>
                            <p className="text-gray-600">
                                Create your first resume to get started
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {savedResumes
                                .sort(
                                    (a, b) =>
                                        new Date(b.lastModified).getTime() -
                                        new Date(a.lastModified).getTime()
                                )
                                .map((resume) => (
                                    <div
                                        key={resume.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <FileText
                                                        size={20}
                                                        className="text-blue-600 flex-shrink-0"
                                                    />
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {resume.fullName ||
                                                            "Unnamed Resume"}
                                                    </h3>
                                                </div>

                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p>
                                                        <strong>Title:</strong>{" "}
                                                        {truncateText(
                                                            resume.data
                                                                .personalInfo
                                                                .title ||
                                                                "No title",
                                                            80
                                                        )}
                                                    </p>
                                                    <p>
                                                        <strong>Email:</strong>{" "}
                                                        {resume.data
                                                            .personalInfo
                                                            .email ||
                                                            "No email"}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Last Modified:
                                                        </strong>{" "}
                                                        {formatDate(
                                                            resume.lastModified
                                                        )}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Resume ID:
                                                        </strong>
                                                        <span className="font-mono text-xs bg-gray-100 px-1 rounded ml-1">
                                                            {resume.id}
                                                        </span>
                                                    </p>

                                                    <div className="flex gap-4 mt-3">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                resume.showProjects
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-gray-100 text-gray-600"
                                                            }`}
                                                        >
                                                            Projects:{" "}
                                                            {resume.showProjects
                                                                ? "Included"
                                                                : "Hidden"}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                resume.showLeadership
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : "bg-gray-100 text-gray-600"
                                                            }`}
                                                        >
                                                            Leadership:{" "}
                                                            {resume.showLeadership
                                                                ? "Included"
                                                                : "Hidden"}
                                                        </span>
                                                    </div>

                                                    {/* Work Experience Count */}
                                                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                        <span>
                                                            Work Experience:{" "}
                                                            {resume.data
                                                                .workExperience
                                                                ?.length ||
                                                                0}{" "}
                                                            items
                                                        </span>
                                                        <span>
                                                            Skills:{" "}
                                                            {resume.data.skills
                                                                ?.length ||
                                                                0}{" "}
                                                            categories
                                                        </span>
                                                        <span>
                                                            Education:{" "}
                                                            {resume.data
                                                                .education
                                                                ?.length ||
                                                                0}{" "}
                                                            items
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 ml-4 flex-shrink-0">
                                                <button
                                                    onClick={() =>
                                                        onLoadResume(resume)
                                                    }
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                                                    title="Edit this resume"
                                                >
                                                    <Edit size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            resume.id
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
                                                    title="Delete this resume"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        {savedResumes.length > 0 && (
                            <p>
                                Total storage used: ~
                                {Math.round(
                                    JSON.stringify(savedResumes).length / 1024
                                )}
                                KB
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeListModal;
