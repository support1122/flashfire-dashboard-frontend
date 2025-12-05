import React, { useState, useEffect } from "react";
import {
    Upload,
    FileText,
    Loader,
    CheckCircle,
    AlertCircle,
    X,
} from "lucide-react";
import type {
    ResumeData,
    WorkExperienceItem,
    ProjectItem,
    EducationItem,
} from "../types/ResumeTypes";

const ResumeParserModal = ({
    open,
    onClose,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess?: (data: ResumeData) => void;
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    const [, setParsedData] = useState<ResumeData | null>(null);
    const [progress, setProgress] = useState(0); // For progress bar animation

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!open) {
            setIsUploading(false);
            setUploadStatus(null);
            setParsedData(null);
            setProgress(0);
        }
    }, [open]);

    // Auto-close after success with progress animation
    useEffect(() => {
        if (uploadStatus?.type === "success") {
            const timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        onClose();
                        return 100;
                    }
                    return prev + 5;
                });
            }, 100);
            return () => clearInterval(timer);
        }
    }, [uploadStatus, onClose]);

    // Template structure for the resume JSON
    const getEmptyResumeTemplate = (): ResumeData => ({
        personalInfo: {
            name: "",
            title: "",
            phone: "",
            email: "",
            location: "",
            linkedin: "",
            portfolio: "",
            github: "",
            publications: "",
        },
        summary: "",
        workExperience: [
            {
                id: "1",
                position: "",
                company: "",
                duration: "",
                location: "",
                roleType: "",
                responsibilities: [""],
            },
        ],
        projects: [
            {
                id: "1",
                position: "",
                company: "",
                duration: "",
                location: "",
                roleType: "None",
                responsibilities: [""],
                linkName: "",
                linkUrl: "",
            },
        ],
        leadership: [
            {
                id: "1",
                title: "",
                organization: "",
            },
        ],
        skills: [
            {
                id: "1",
                category: "",
                skills: "",
            },
        ],
        education: [
            {
                id: "1",
                institution: "",
                location: "",
                degree: "",
                field: "",
                duration: "",
                additionalInfo: "",
            },
        ],
    });

    // Extract text from PDF using FileReader (basic approach)
    const extractTextFromPDF = async (file: File): Promise<string> => {
        try {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    let text = "";

                    // Basic text extraction (this is a simplified approach)
                    for (let i = 0; i < uint8Array.length; i++) {
                        const char = String.fromCharCode(uint8Array[i]);
                        if (/[a-zA-Z0-9\s.,@\-\/]/.test(char)) {
                            text += char;
                        }
                    }

                    if (text.trim().length === 0) {
                        reject(
                            new Error(
                                "No readable text found in PDF. Consider using a server-side parser."
                            )
                        );
                    } else {
                        resolve(text.trim());
                    }
                };
                reader.onerror = () => {
                    reject(new Error("Failed to read PDF file."));
                };
                reader.readAsArrayBuffer(file);
            });
        } catch (error) {
            console.error("Error extracting PDF text:", error);
            throw new Error(
                "Failed to extract text from PDF. For better results, use a server-side PDF parser."
            );
        }
    };

    // Parse resume text into structured format (same as original)
    const parseResumeText = async (text: string): Promise<ResumeData> => {
        const template = getEmptyResumeTemplate();

        if (!text || text.trim().length === 0) {
            throw new Error("No text could be extracted from the PDF");
        }

        const lines = text.split("\n").filter((line) => line.trim());
        const fullText = text.toLowerCase();

        // Enhanced regex patterns
        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
        const phoneRegex = /[\+]?[1-9]?[\d\s\(\)\-\.]{7,15}/g;
        const linkedinRegex =
            /(?:linkedin\.com\/in\/)([\w\-]+)|(?:linkedin\.com\/)([\w\-]+)/gi;
        const portfolioRegex =
            /(?:portfolio|website|portfolio\.com)[\s:]*([^\s\n]+)/gi;
        const githubRegex = /(?:github\.com\/)([\w\-]+)/gi;

        // Extract personal information
        const emailMatch = text.match(emailRegex);
        const phoneMatch = text.match(phoneRegex);
        const linkedinMatch = text.match(linkedinRegex);
        const portfolioMatch = text.match(portfolioRegex);
        const githubMatch = text.match(githubRegex);

        if (emailMatch) template.personalInfo.email = emailMatch[0];
        if (phoneMatch) template.personalInfo.phone = phoneMatch[0];
        if (linkedinMatch) {
            const match = linkedinMatch[0];
            template.personalInfo.linkedin = match.startsWith("http")
                ? match
                : `https://${match}`;
        }
        if (portfolioMatch) {
            template.personalInfo.portfolio =
                portfolioMatch[0].split(/[\s:]+/).pop() || "";
        }
        if (githubMatch) {
            const match = githubMatch[0];
            template.personalInfo.github = match.startsWith("http")
                ? match
                : `https://${match}`;
        }

        // Extract name
        const potentialName = lines.find(
            (line) =>
                line.length > 2 &&
                line.length < 60 &&
                !emailRegex.test(line) &&
                !phoneRegex.test(line) &&
                !line.toLowerCase().includes("resume") &&
                !line.toLowerCase().includes("cv") &&
                !/^\d/.test(line)
        );
        if (potentialName) template.personalInfo.name = potentialName.trim();

        // Extract title/position
        const nameIndex = lines.findIndex((line) =>
            line.includes(template.personalInfo.name)
        );
        if (nameIndex !== -1 && nameIndex + 1 < lines.length) {
            const nextLine = lines[nameIndex + 1];
            if (
                nextLine &&
                nextLine.length > 5 &&
                nextLine.length < 100 &&
                !emailRegex.test(nextLine) &&
                !phoneRegex.test(nextLine)
            ) {
                template.personalInfo.title = nextLine.trim();
            }
        }

        // Extract summary
        const summaryKeywords = ["summary", "objective", "profile", "about"];
        const summaryIndex = lines.findIndex((line) =>
            summaryKeywords.some((keyword) =>
                line.toLowerCase().includes(keyword)
            )
        );

        if (summaryIndex !== -1) {
            const summaryLines: string[] = [];
            for (let i = summaryIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (
                    line.length > 20 &&
                    !line.toLowerCase().includes("experience") &&
                    !line.toLowerCase().includes("education") &&
                    !line.toLowerCase().includes("skills")
                ) {
                    summaryLines.push(line);
                } else if (summaryLines.length > 0) {
                    break;
                }
            }
            if (summaryLines.length > 0) {
                template.summary = summaryLines.join(" ");
            }
        }

        // Extract work experience
        const workKeywords = [
            "experience",
            "employment",
            "work history",
            "professional experience",
            "career",
        ];
        const workIndex = lines.findIndex((line) =>
            workKeywords.some((keyword) => line.toLowerCase().includes(keyword))
        );

        if (workIndex !== -1) {
            const workExperience: WorkExperienceItem[] = [];
            let currentJob: Partial<WorkExperienceItem> | null = null;

            for (let i = workIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();

                if (
                    line.toLowerCase().includes("education") ||
                    line.toLowerCase().includes("skills") ||
                    line.toLowerCase().includes("projects")
                ) {
                    break;
                }

                if (
                    line.includes("|") ||
                    line.includes("–") ||
                    line.includes("-")
                ) {
                    if (
                        currentJob &&
                        (currentJob.position || currentJob.company)
                    ) {
                        workExperience.push({
                            id:
                                currentJob.id ||
                                (workExperience.length + 1).toString(),
                            position: currentJob.position || "",
                            company: currentJob.company || "",
                            duration: currentJob.duration || "",
                            location: currentJob.location || "",
                            roleType: currentJob.roleType || "Full-time",
                            responsibilities: currentJob.responsibilities || [],
                        });
                    }

                    const parts = line.split(/[\|\–\-]/).map((p) => p.trim());
                    currentJob = {
                        id: (workExperience.length + 1).toString(),
                        position: parts[0] || "",
                        company: parts[1] || "",
                        duration: parts[2] || "",
                        location: parts[3] || "",
                        roleType: "Full-time",
                        responsibilities: [],
                    };
                } else if (
                    line.startsWith("•") ||
                    line.startsWith("-") ||
                    line.startsWith("*")
                ) {
                    if (currentJob && currentJob.responsibilities) {
                        currentJob.responsibilities.push(
                            line.substring(1).trim()
                        );
                    }
                } else if (
                    line.length > 10 &&
                    currentJob &&
                    (!currentJob.responsibilities ||
                        currentJob.responsibilities.length === 0)
                ) {
                    if (!currentJob.responsibilities)
                        currentJob.responsibilities = [];
                    currentJob.responsibilities.push(line);
                }
            }

            if (currentJob && (currentJob.position || currentJob.company)) {
                workExperience.push({
                    id: currentJob.id || (workExperience.length + 1).toString(),
                    position: currentJob.position || "",
                    company: currentJob.company || "",
                    duration: currentJob.duration || "",
                    location: currentJob.location || "",
                    roleType: currentJob.roleType || "Full-time",
                    responsibilities: currentJob.responsibilities || [],
                });
            }

            if (workExperience.length > 0) {
                template.workExperience = workExperience;
            }
        }

        // Extract education
        const educationKeywords = [
            "education",
            "academic",
            "university",
            "college",
            "degree",
        ];
        const educationIndex = lines.findIndex((line) =>
            educationKeywords.some((keyword) =>
                line.toLowerCase().includes(keyword)
            )
        );

        if (educationIndex !== -1) {
            const education: EducationItem[] = [];
            let currentEdu: Partial<EducationItem> | null = null;

            for (
                let i = educationIndex + 1;
                i < Math.min(educationIndex + 15, lines.length);
                i++
            ) {
                const line = lines[i].trim();

                if (
                    line.toLowerCase().includes("skills") ||
                    line.toLowerCase().includes("projects") ||
                    line.toLowerCase().includes("certifications")
                ) {
                    break;
                }

                if (
                    line.includes("University") ||
                    line.includes("College") ||
                    line.includes("Institute") ||
                    line.includes("School")
                ) {
                    if (currentEdu && currentEdu.institution) {
                        education.push({
                            id:
                                currentEdu.id ||
                                (education.length + 1).toString(),
                            institution: currentEdu.institution,
                            location: currentEdu.location || "",
                            degree: currentEdu.degree || "",
                            field: currentEdu.field || "",
                            duration: currentEdu.duration || "",
                            additionalInfo: currentEdu.additionalInfo || "",
                        });
                    }
                    currentEdu = {
                        id: (education.length + 1).toString(),
                        institution: line,
                        location: "",
                        degree: "",
                        field: "",
                        duration: "",
                        additionalInfo: "",
                    };
                } else if (
                    line.includes("Bachelor") ||
                    line.includes("Master") ||
                    line.includes("PhD") ||
                    line.includes("Degree")
                ) {
                    if (currentEdu) {
                        currentEdu.degree = line;
                    } else {
                        currentEdu = {
                            id: "1",
                            institution: "",
                            location: "",
                            degree: line,
                            field: "",
                            duration: "",
                            additionalInfo: "",
                        };
                    }
                }
            }

            if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
                education.push({
                    id: currentEdu.id || "1",
                    institution: currentEdu.institution || "",
                    location: currentEdu.location || "",
                    degree: currentEdu.degree || "",
                    field: currentEdu.field || "",
                    duration: currentEdu.duration || "",
                    additionalInfo: currentEdu.additionalInfo || "",
                });
                template.education = education;
            }
        }

        // Extract skills
        const skillsKeywords = [
            "skills",
            "technical skills",
            "core competencies",
            "expertise",
            "technologies",
        ];
        const skillsIndex = lines.findIndex((line) =>
            skillsKeywords.some((keyword) =>
                line.toLowerCase().includes(keyword)
            )
        );

        if (skillsIndex !== -1) {
            const skillsLines: string[] = [];
            for (
                let i = skillsIndex + 1;
                i < Math.min(skillsIndex + 10, lines.length);
                i++
            ) {
                const line = lines[i].trim();
                if (
                    line &&
                    !line.toLowerCase().includes("projects") &&
                    !line.toLowerCase().includes("certifications") &&
                    !line.toLowerCase().includes("references")
                ) {
                    skillsLines.push(line);
                } else if (skillsLines.length > 0) {
                    break;
                }
            }

            if (skillsLines.length > 0) {
                template.skills = [
                    {
                        id: "1",
                        category: "Technical Skills",
                        skills: skillsLines.join(", "),
                    },
                ];
            }
        }

        // Extract projects
        const projectsKeywords = ["projects", "portfolio", "achievements"];
        const projectsIndex = lines.findIndex((line) =>
            projectsKeywords.some((keyword) =>
                line.toLowerCase().includes(keyword)
            )
        );

        if (projectsIndex !== -1) {
            const projects: ProjectItem[] = [];
            let currentProject: Partial<ProjectItem> | null = null;

            for (
                let i = projectsIndex + 1;
                i < Math.min(projectsIndex + 10, lines.length);
                i++
            ) {
                const line = lines[i].trim();

                if (
                    line.toLowerCase().includes("certifications") ||
                    line.toLowerCase().includes("references")
                ) {
                    break;
                }

                if (line && !line.startsWith("•") && !line.startsWith("-")) {
                    if (currentProject && currentProject.position) {
                        projects.push({
                            id:
                                currentProject.id ||
                                (projects.length + 1).toString(),
                            position: currentProject.position,
                            company: currentProject.company || "",
                            duration: currentProject.duration || "",
                            location: currentProject.location || "",
                            roleType: currentProject.roleType || "None",
                            responsibilities:
                                currentProject.responsibilities || [],
                            linkName: "",
                            linkUrl: "",
                        });
                    }
                    currentProject = {
                        id: (projects.length + 1).toString(),
                        position: line,
                        company: "",
                        duration: "",
                        location: "",
                        roleType: "None",
                        responsibilities: [],
                        linkName: "",
                        linkUrl: "",
                    };
                } else if (line.startsWith("•") || line.startsWith("-")) {
                    if (currentProject && currentProject.responsibilities) {
                        currentProject.responsibilities.push(
                            line.substring(1).trim()
                        );
                    }
                }
            }

            if (currentProject && currentProject.position) {
                projects.push({
                    id: currentProject.id || (projects.length + 1).toString(),
                    position: currentProject.position,
                    company: currentProject.company || "",
                    duration: currentProject.duration || "",
                    location: currentProject.location || "",
                    roleType: currentProject.roleType || "None",
                    responsibilities: currentProject.responsibilities || [],
                    linkName: "",
                    linkUrl: "",
                });
            }

            if (projects.length > 0) {
                template.projects = projects;
            }
        }

        return template;
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (file.type !== "application/pdf") {
            setUploadStatus({
                type: "error",
                message: "Please select a PDF file, you wild coder! 😜",
            });
            return;
        }

        setIsUploading(true);
        setUploadStatus(null);
        setProgress(10); // Start progress

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // Extract text from PDF
            const extractedText = await extractTextFromPDF(file);

            // Parse the text into structured data
            const parsedResumeData = await parseResumeText(extractedText);

            // Set the parsed data
            setParsedData(parsedResumeData);

            // Call success callback
            if (onSuccess) {
                onSuccess(parsedResumeData);
            }

            clearInterval(progressInterval);
            setProgress(100);
            setUploadStatus({
                type: "success",
                message: "Resume parsed like...",
            });

            console.log(
                "Parsed Resume Data:",
                JSON.stringify(parsedResumeData, null, 2)
            );
        } catch (error) {
            console.error("Error parsing resume:", error);
            setUploadStatus({
                type: "error",
                message:
                    "Whoops! Resume parsing crashed. Try a server-side parser for better results! 🚀",
            });
            setProgress(0);
        } finally {
            setIsUploading(false);
            if (event.target) {
                event.target.value = "";
            }
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 animate-gradient-x">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-70 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-gray-900 rounded-2xl shadow-2xl transform transition-all scale-100 hover:scale-105 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neon-blue">
                    <h3 className="text-2xl font-bold text-neon-blue animate-pulse">
                        Resume Parser
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neon-blue hover:bg-opacity-20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-neon-blue" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <FileText className="mx-auto h-16 w-16 text-neon-pink animate-bounce" />
                        <p className="text-gray-300 text-lg mt-4">
                            Drop your PDF resume
                        </p>
                    </div>

                    <div className="mb-8">
                        <label
                            htmlFor="resume-upload-modal"
                            className={`
                flex flex-col items-center justify-center w-full h-40 border-4 border-dashed rounded-xl cursor-pointer
                ${
                    isUploading
                        ? "border-gray-600 bg-gray-800"
                        : "border-neon-pink bg-neon-pink bg-opacity-10 hover:bg-opacity-20"
                }
                transition-all duration-300 transform hover:scale-105
              `}
                        >
                            <div className="flex flex-col items-center justify-center pt-6 pb-8">
                                {isUploading ? (
                                    <Loader className="w-10 h-10 mb-3 text-neon-blue animate-spin" />
                                ) : (
                                    <Upload className="w-10 h-10 mb-3 text-neon-pink animate-pulse" />
                                )}
                                <p className="mb-3 text-lg text-gray-300 font-semibold">
                                    {isUploading ? (
                                        <span>
                                            Parsing your resume like a boss...
                                            🚀
                                        </span>
                                    ) : (
                                        <span>
                                            <strong>Click to upload</strong> or
                                            drag that PDF here! 😎
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Only PDF files, because we're fancy like
                                    that!
                                </p>
                            </div>
                            <input
                                id="resume-upload-modal"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Progress Bar */}
                    {isUploading && (
                        <div className="mb-6">
                            <div className="w-full bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-neon-blue to-neon-pink h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-400 mt-2 text-center">
                                Parsing Progress: {progress}%
                            </p>
                        </div>
                    )}

                    {uploadStatus && (
                        <div
                            className={`
              flex items-center p-4 mb-6 rounded-lg border-2
              ${
                  uploadStatus.type === "success"
                      ? "bg-green-900 border-neon-green"
                      : "bg-red-900 border-neon-red"
              }
              animate-slide-in
            `}
                        >
                            {uploadStatus.type === "success" ? (
                                <CheckCircle className="w-6 h-6 text-neon-green mr-4 animate-spin-slow" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-neon-red mr-4 animate-pulse" />
                            )}
                            <p
                                className={`text-base ${
                                    uploadStatus.type === "success"
                                        ? "text-neon-green"
                                        : "text-neon-red"
                                }`}
                            >
                                {uploadStatus.message}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-neon-blue">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-lg font-medium text-neon-blue bg-gray-800 hover:bg-neon-blue hover:text-gray-900 rounded-lg transition-all duration-300 transform hover:scale-110"
                    ></button>
                </div>
            </div>
        </div>
    );
};

export default ResumeParserModal;
