import React from "react";

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
    };
    summary: string;
    workExperience: Array<{
        id: string;
        position: string;
        company: string;
        location: string;
        duration: string;
        roleType: string;
        responsibilities: string[];
    }>;
    projects: Array<{
        id: string;
        position: string;
        company: string;
        location: string;
        duration: string;
        roleType: string;
        responsibilities: string[];
        linkName: string;
        linkUrl: string;
    }>;
    leadership: Array<{
        id: string;
        title: string;
        organization: string;
    }>;
    skills: Array<{
        id: string;
        category: string;
        skills: string;
    }>;
    education: Array<{
        id: string;
        institution: string;
        location: string;
        degree: string;
        field: string;
        duration: string;
        additionalInfo: string;
    }>;
    publications: Array<{
        id: string;
        details: string;
    }>;
}

interface ResumePreviewProps {
    data: ResumeData;
    showLeadership?: boolean;
    showProjects?: boolean;
    showSummary?: boolean;
    showPublications?: boolean;
}

export const ResumePreviewMedical: React.FC<ResumePreviewProps> = ({
    data,
    showLeadership = true,
    showProjects = false,
    showPublications = false,
    showSummary = true,
}) => {
    const formatLinkedIn = (linkedin: string) => {
        if (!linkedin) return "";
        if (linkedin.startsWith("http")) {
            return "LinkedIn";
        }
        return linkedin;
    };

    const formatPortfolio = (portfolio: string) => {
        if (!portfolio) return "";
        if (portfolio.startsWith("http")) {
            return "Portfolio";
        }
        return portfolio;
    };

    const formatGithub = (github: string) => {
        if (!github) return "";
        if (github.startsWith("http")) {
            return "GitHub";
        }
        return github;
    };

    const getLinkedInUrl = (linkedin: string) => {
        if (!linkedin) return "#";
        if (linkedin.startsWith("http")) {
            return linkedin;
        }
        return `https://linkedin.com/in/${linkedin}`;
    };

    const getPortfolioUrl = (portfolio: string) => {
        if (!portfolio) return "#";
        if (portfolio.startsWith("http")) {
            return portfolio;
        }
        return `https://${portfolio}`;
    };

    const getGithubUrl = (github: string) => {
        if (!github) return "#";
        if (github.startsWith("http")) {
            return github;
        }
        return `https://github.com/${github}`;
    };

    const resumeContent = (
        <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <div
                    style={{
                        fontSize: "16px",
                        marginBottom: "4px",
                        fontWeight: "bold",
                    }}
                >
                    {data.personalInfo.name || "Your Name"}
                </div>
                <div style={{ fontSize: "9pt", marginBottom: "4px" }}>
                    {data.personalInfo.title || "Your Professional Title"}
                </div>
                <div style={{ fontSize: "9pt" }}>
                    {data.personalInfo.phone}
                    {data.personalInfo.email && (
                        <>
                            {" | "}
                            <a
                                href={`mailto:${data.personalInfo.email}`}
                                style={{
                                    color: "blue",
                                    textDecoration: "none",
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {data.personalInfo.email}
                            </a>
                        </>
                    )}
                    {data.personalInfo.location && (
                        <>
                            {" | "}
                            {data.personalInfo.location}
                        </>
                    )}
                    {data.personalInfo.linkedin && (
                        <>
                            {" | "}
                            <a
                                href={getLinkedInUrl(
                                    data.personalInfo.linkedin
                                )}
                                style={{
                                    color: "blue",
                                    textDecoration: "none",
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {formatLinkedIn(data.personalInfo.linkedin)}
                            </a>
                        </>
                    )}
                    {data.personalInfo.portfolio && (
                        <>
                            {" | "}
                            <a
                                href={getPortfolioUrl(
                                    data.personalInfo.portfolio
                                )}
                                style={{
                                    color: "blue",
                                    textDecoration: "none",
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {formatPortfolio(data.personalInfo.portfolio)}
                            </a>
                        </>
                    )}
                    {data.personalInfo.github && (
                        <>
                            {" | "}
                            <a
                                href={getGithubUrl(data.personalInfo.github)}
                                style={{
                                    color: "blue",
                                    textDecoration: "none",
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {formatGithub(data.personalInfo.github)}
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Summary */}
            {showSummary && (
                <div
                    style={{
                        marginBottom: "12px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "9pt",
                            borderBottom: "1px solid #000",
                            paddingBottom: "2px",
                            marginBottom: "6px",
                            fontWeight: "bold",
                            letterSpacing: "-0.025em",
                        }}
                    >
                        SUMMARY
                    </div>
                    <div
                        style={{
                            textAlign: "justify",
                            fontSize: "9pt",
                            lineHeight: "1.3",
                            letterSpacing: "-0.025em",
                        }}
                    >
                        {data.summary ||
                            "Your professional summary will appear here..."}
                    </div>
                </div>
            )}

            {/* Work Experience */}
            <div style={{ marginBottom: "12px" }}>
                <div
                    style={{
                        fontSize: "9pt",
                        borderBottom: "1px solid #000",
                        paddingBottom: "2px",
                        marginBottom: "6px",
                        fontWeight: "bold",
                    }}
                >
                    WORK EXPERIENCE
                </div>
                {data.workExperience.length > 0 ? (
                    data.workExperience.map((exp, index) => (
                        <div key={exp.id} style={{ marginBottom: "8px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "3px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "9pt",
                                        fontWeight: "bold",
                                        flex: "1",
                                    }}
                                >
                                    {exp.company}
                                </div>
                                <div
                                    style={{
                                        fontSize: "9pt",
                                        textAlign: "right",
                                    }}
                                >
                                    {exp.location}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "3px",
                                }}
                            >
                                <div style={{ fontSize: "9pt" }}>
                                    {exp.position}
                                    {exp.roleType &&
                                        exp.roleType !== "None" &&
                                        ` – ${exp.roleType}`}
                                </div>
                                <div
                                    style={{
                                        fontSize: "9pt",
                                        textAlign: "right",
                                    }}
                                >
                                    {exp.duration}
                                </div>
                            </div>
                            {exp.responsibilities.map(
                                (resp, respIndex) =>
                                    resp.trim() && (
                                        <div
                                            key={respIndex}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "9pt",
                                                    marginRight: "4px",
                                                    minWidth: "8px",
                                                }}
                                            >
                                                •
                                            </span>
                                            <div
                                                style={{
                                                    textAlign: "justify",
                                                    fontSize: "9pt",
                                                    lineHeight: "1.3",
                                                }}
                                            >
                                                {resp}
                                            </div>
                                        </div>
                                    )
                            )}
                        </div>
                    ))
                ) : (
                    <div
                        style={{
                            fontSize: "9pt",
                            fontStyle: "italic",
                            color: "#666",
                        }}
                    >
                        Your work experience will appear here...
                    </div>
                )}
            </div>

            {/* Projects - Only show if enabled */}
            {showProjects && data.projects && data.projects.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                    <div
                        style={{
                            fontSize: "9pt",
                            borderBottom: "1px solid #000",
                            paddingBottom: "2px",
                            marginBottom: "6px",
                            fontWeight: "bold",
                        }}
                    >
                        PROJECTS
                    </div>
                    {data.projects.map((project, index) => (
                        <div key={project.id} style={{ marginBottom: "8px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "3px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "9pt",
                                        fontWeight: "bold",
                                        flex: "1",
                                    }}
                                >
                                    {project.company}
                                </div>
                                <div
                                    style={{
                                        fontSize: "9pt",
                                        textAlign: "right",
                                    }}
                                >
                                    {project.location}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "3px",
                                }}
                            >
                                <div style={{ fontSize: "9pt" }}>
                                    {project.position}
                                    {project.roleType &&
                                        project.roleType !== "None" &&
                                        ` – ${project.roleType}`}
                                    {project.linkName && project.linkUrl && (
                                        <>
                                            {" — "}
                                            <a
                                                href={project.linkUrl}
                                                style={{
                                                    color: "blue",
                                                    textDecoration: "none",
                                                }}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {project.linkName}
                                            </a>
                                        </>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: "9pt",
                                        textAlign: "right",
                                    }}
                                >
                                    {project.duration}
                                </div>
                            </div>
                            {project.responsibilities.map(
                                (resp, respIndex) =>
                                    resp.trim() && (
                                        <div
                                            key={respIndex}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "9pt",
                                                    marginRight: "4px",
                                                    minWidth: "8px",
                                                }}
                                            >
                                                •
                                            </span>
                                            <div
                                                style={{
                                                    textAlign: "justify",
                                                    fontSize: "9pt",
                                                    lineHeight: "1.3",
                                                }}
                                            >
                                                {resp}
                                            </div>
                                        </div>
                                    )
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Leadership & Volunteering - Only show if enabled */}
            {showLeadership &&
                data.leadership &&
                data.leadership.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                        <div
                            style={{
                                fontSize: "9pt",
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: "6px",
                                fontWeight: "bold",
                            }}
                        >
                            LEADERSHIP & VOLUNTEERING
                        </div>
                        {data.leadership.map((item) => (
                            <div
                                key={item.id}
                                style={{ fontSize: "9pt", marginBottom: "3px" }}
                            >
                                {item.title}
                                {item.organization && `, ${item.organization}`}
                            </div>
                        ))}
                    </div>
                )}

            {/* Skills */}
            <div style={{ marginBottom: "12px" }}>
                <div
                    style={{
                        fontSize: "9pt",
                        borderBottom: "1px solid #000",
                        paddingBottom: "2px",
                        marginBottom: "6px",
                        fontWeight: "bold",
                    }}
                >
                    SKILLS
                </div>
                {data.skills.length > 0 ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "160px 20px 1fr",
                            rowGap: "8px",
                        }}
                    >
                        {data.skills.map((category) => (
                            <div
                                key={category.id}
                                style={{
                                    display: "contents",
                                    fontSize: "9pt",
                                    lineHeight: "1.3",
                                }}
                            >
                                <span
                                    style={{
                                        width: "160px",
                                        flexShrink: 0,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {category.category}
                                </span>
                                <span
                                    style={{
                                        fontWeight: "bold",
                                        margin: "0 5px",
                                    }}
                                >
                                    :
                                </span>
                                <span
                                    style={{
                                        flex: "1",
                                        wordWrap: "break-word",
                                        textAlign: "justify",
                                    }}
                                >
                                    {category.skills}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            fontSize: "9pt",
                            fontStyle: "italic",
                            color: "#666",
                        }}
                    >
                        Your skills will appear here...
                    </div>
                )}
            </div>

            {/* Education */}
            <div style={{ marginBottom: "12px" }}>
                <div
                    style={{
                        fontSize: "9pt",
                        borderBottom: "1px solid #000",
                        paddingBottom: "2px",
                        marginBottom: "6px",
                        fontWeight: "bold",
                    }}
                >
                    EDUCATION
                </div>
                {data.education.length > 0 ? (
                    data.education.map((edu, index) => (
                        <div key={edu.id} style={{ marginBottom: "6px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "2px",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "9pt",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {edu.institution}
                                </span>
                                <span
                                    style={{
                                        fontSize: "9pt",
                                        textAlign: "right",
                                    }}
                                >
                                    {edu.duration}
                                </span>
                            </div>
                            <div style={{ fontSize: "9pt" }}>{edu.degree}</div>
                        </div>
                    ))
                ) : (
                    <div
                        style={{
                            fontSize: "9pt",
                            fontStyle: "italic",
                            color: "#666",
                        }}
                    >
                        Your education will appear here...
                    </div>
                )}
            </div>

            {/* Publications - Only show if enabled */}
            {showPublications &&
                data.publications &&
                data.publications.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                        <div
                            style={{
                                fontSize: "9pt",
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: "6px",
                                fontWeight: "bold",
                            }}
                        >
                            PUBLICATIONS
                        </div>
                        {data.publications.map((publication) => (
                            <div key={publication.id} style={{ marginBottom: "6px" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "9pt",
                                            marginRight: "4px",
                                            minWidth: "8px",
                                        }}
                                    >
                                        •
                                    </span>
                                    <div
                                        style={{
                                            fontSize: "9pt",
                                            lineHeight: "1.3",
                                            textAlign: "justify",
                                            flex: 1,
                                        }}
                                    >
                                        {publication.details}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </>
    );

    return (
        <div className="resume-medical-print">
            {/* Screen Preview */}
            <div
                className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden no-print"
                style={{ height: "800px", overflow: "auto" }}
            >
                <div
                    style={{
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: "9pt",
                        lineHeight: "1.2",
                        color: "#000000",
                        padding: "0.1in 0.5in",
                        margin: "0",
                        height: "auto",
                        background: "white",
                        boxSizing: "border-box",
                        width: "100%",
                        letterSpacing: "-0.025em",
                    }}
                >
                    {resumeContent}
                </div>
            </div>

            {/* Print-Only Version - Hidden on screen, visible only when printing */}
            <div
                id="resume-print-only"
                style={{
                    display: "none", // Hidden on screen
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: "9pt",
                    lineHeight: "1.2",
                    color: "#000000",
                    background: "white",
                    boxSizing: "border-box",
                    width: "100%",
                    minHeight: "auto",
                    height: "auto",
                    margin: "0",
                    padding: "0.1in 0.3in",
                    letterSpacing: "-0.025em",
                }}
            >
                {resumeContent}
            </div>
        </div>
    );
};
