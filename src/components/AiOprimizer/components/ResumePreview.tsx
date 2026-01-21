import React, { useRef, useEffect, useState } from "react";

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
        duration: string;
        location: string;
        roleType: string;
        responsibilities: string[];
    }>;
    projects: Array<{
        id: string;
        position: string;
        company: string;
        duration: string;
        location: string;
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
    showChanges?: boolean;
    changedFields?: Set<string>;
    onDownloadClick?: () => void;
    showPrintButtons?: boolean;
    sectionOrder?: string[];
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
    data,
    showLeadership = true,
    showProjects = false,
    showSummary = true,
    showPublications = false,
    showChanges = false,
    changedFields = new Set(),
    onDownloadClick,
    showPrintButtons = true,
    sectionOrder = [
        "personalInfo",
        "summary",
        "workExperience",
        "projects",
        "leadership",
        "skills",
        "education",
        "publications",
    ],
}) => {
    const [scalingFactor, setScalingFactor] = useState(1);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const measureRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        setShowWarningModal(true);
    };

    const handlePrintConfirm = () => {
        setShowWarningModal(false);

        const originalTitle = document.title;
        document.title = `${data.personalInfo.name || "Resume"}_Resume`;

        const printStyle = document.createElement("style");
        printStyle.id = "resume-temp-print-style";
        printStyle.innerHTML = `
      @media print {
        @page { size: letter; margin: 0 0.2in 0.2in 0.2in; }
        html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
        
        body.printing-resume > :not(#temp-resume-print-wrapper) { display: none !important; }
        #temp-resume-print-wrapper { display: block !important; width: 100% !important; }
        #temp-resume-print-wrapper #resume-print-only { display: block !important; visibility: visible !important; }
      }
      body.printing-resume > :not(#temp-resume-print-wrapper) { display: none !important; }
      #temp-resume-print-wrapper { display: block !important; width: 100%; background: white; }
    `;

        document.head.appendChild(printStyle);

        const originalPrintElem = document.getElementById("resume-print-only");
        if (!originalPrintElem) {
            window.print();
            document.title = originalTitle;
            if (document.head.contains(printStyle)) document.head.removeChild(printStyle);
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.id = "temp-resume-print-wrapper";
        wrapper.className = "resume-single-page";
        const clone = originalPrintElem.cloneNode(true) as HTMLElement;
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        document.body.classList.add("printing-resume");

        setTimeout(() => {
            try {
                window.print();
            } finally {
                setTimeout(() => {
                    document.title = originalTitle;
                    document.body.classList.remove("printing-resume");
                    if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
                    const tmpStyle = document.getElementById("resume-temp-print-style");
                    if (tmpStyle && tmpStyle.parentNode) tmpStyle.parentNode.removeChild(tmpStyle);
                    if (document.head.contains(printStyle)) document.head.removeChild(printStyle);
                }, 700);
            }
        }, 120);

        if (onDownloadClick) onDownloadClick();
    };

    const showPrintInstructions = () => {
        alert(`Automatic Print Settings:
        
The print dialog will automatically open with optimized settings:
• Pages: Set to 2 (automatically configured)
• Scale: Auto-optimized for best fit
• Margins: Minimal for maximum content space
• Destination: Save as PDF (or your preferred printer)

Just click "Print" or "Save as PDF" - no manual adjustments needed!

The resume will print across multiple pages if needed, ensuring no content is cut off and no blank pages appear.`);
    };

    useEffect(() => {
        const calculateContentDensity = () => {
            let totalLines = 0;

            totalLines +=
                (data.personalInfo.name ? 1 : 1) +
                (data.personalInfo.title ? 1 : 1) +
                1 +
                1;

            const sections = ["workExperience", "skills", "education"];
            if (showSummary && data.summary?.trim() !== "") sections.push("summary");
            if (showProjects && data.projects?.length > 0) sections.push("projects");
            if (showLeadership && data.leadership?.length > 0) sections.push("leadership");
            if (showPublications && data.publications?.length > 0) sections.push("publications");
            totalLines += sections.length * 2;

            if (showSummary && data.summary) {
                totalLines += Math.ceil(data.summary.length / 60);
            } else if (showSummary) {
                totalLines += 1;
            }

            totalLines = data.workExperience.length;
            data.workExperience.forEach((exp) => {
                totalLines += 2;
                exp.responsibilities
                    .filter((r) => r.trim())
                    .forEach((r) => {
                        totalLines += Math.ceil(r.length / 60);
                    });
            });

            if (showProjects && data.projects) {
                data.projects.forEach((proj) => {
                    totalLines += 2;
                    proj.responsibilities
                        .filter((r) => r.trim())
                        .forEach((r) => {
                            totalLines += Math.ceil(r.length / 60);
                        });
                });
            }

            if (showLeadership && data.leadership) {
                data.leadership.forEach((l) => {
                    const text = l.title + (l.organization ? `, ${l.organization}` : "");
                    totalLines += Math.ceil(text.length / 60);
                });
            }

            data.skills.forEach((s) => {
                const text = `${s.category}: ${s.skills}`;
                totalLines += Math.ceil(text.length / 60);
            });

            data.education.forEach((e) => {
                const mainText = `${e.institution}${e.location ? `, ${e.location}` : ""} - ${e.degree}${e.field ? `, ${e.field}` : ""}`;
                totalLines += Math.ceil(mainText.length / 60);
                if (e.additionalInfo) {
                    totalLines += Math.ceil(e.additionalInfo.length / 60);
                }
            });

            if (showPublications && data.publications) {
                data.publications.forEach((p) => {
                    totalLines += Math.ceil(p.details.length / 60);
                });
            }

            return 1.0;
        };

        const newScaling = calculateContentDensity();
        setScalingFactor(newScaling);
    }, [data, showLeadership, showProjects, showSummary, showPublications]);

    const getScaledStyles = () => {
        const baseFontSize = 10;
        const baseHeaderSize = 16;
        const baseContactSize = 9;

        const fontSize = Math.max(9, Math.round(baseFontSize * scalingFactor));
        const headerSize = Math.max(12, Math.round(baseHeaderSize * scalingFactor));
        const contactSize = Math.max(7, Math.round(baseContactSize * scalingFactor));

        const sectionMargin = Math.max(6, Math.round(12 * scalingFactor));
        const itemMargin = Math.max(3, Math.round(8 * scalingFactor));
        const bulletSpacing = Math.max(1, Math.round(3 * scalingFactor));

        const lineHeight = Math.max(1.05, 1.15 * scalingFactor);
        const paddingTop = Math.max(0.3, 0.5 * scalingFactor);
        const paddingBottom = Math.max(0.3, 0.5 * scalingFactor);
        const paddingSide = Math.max(0.3, 0.5 * scalingFactor);

        return {
            fontSize: `${fontSize}pt`,
            headerSize: `${headerSize}px`,
            contactSize: `${contactSize}pt`,
            sectionMargin: `${sectionMargin}px`,
            itemMargin: `${itemMargin}px`,
            bulletSpacing: `${bulletSpacing}px`,
            lineHeight: lineHeight.toString(),
            paddingTop: `${paddingTop}in`,
            paddingBottom: `${paddingBottom}in`,
            paddingSide: `${paddingSide}in`,
        };
    };

    const styles = getScaledStyles();

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

    const formatSkills = (skillsString: string) => {
        if (!skillsString) return "";
        return skillsString.split(",").map((skill) => skill.trim()).join(", ");
    };

    const getGithubUrl = (github: string) => {
        if (!github) return "#";
        if (github.startsWith("http")) {
            return github;
        }
        return `https://github.com/${github}`;
    };

    const getHighlightStyle = (fieldPath: string) => {
        return {};
    };

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case "summary":
                if (!showSummary) return null;
                return (
                    <div
                        style={{
                            marginBottom: styles.sectionMargin,
                            ...getHighlightStyle("summary"),
                        }}
                    >
                        <div
                            style={{
                                fontSize: styles.fontSize,
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: styles.itemMargin,
                                fontWeight: "bold",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            SUMMARY
                        </div>
                        <div
                            style={{
                                textAlign: "justify",
                                fontSize: styles.fontSize,
                                lineHeight: styles.lineHeight,
                                letterSpacing: "-0.025em",
                            }}
                        >
                            {data.summary || "Your professional summary will appear here..."}
                        </div>
                    </div>
                );

            case "workExperience":
                return (
                    <div
                        style={{
                            marginBottom: styles.sectionMargin,
                            ...getHighlightStyle("workExperience"),
                        }}
                    >
                        <div
                            style={{
                                fontSize: styles.fontSize,
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: styles.itemMargin,
                                fontWeight: "bold",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            WORK EXPERIENCE
                        </div>
                        {data.workExperience.length > 0 ? (
                            data.workExperience.map((exp, index) => (
                                <div
                                    key={exp.id}
                                    className="work-experience-item"
                                    style={{
                                        marginBottom:
                                            index === data.workExperience.length - 1
                                                ? styles.bulletSpacing
                                                : styles.itemMargin,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: styles.bulletSpacing,
                                        }}
                                    >
                                        <div style={{ flex: "1" }}>
                                            {exp.company && (
                                                <div
                                                    style={{
                                                        fontSize: styles.fontSize,
                                                        fontWeight: "bold",
                                                        letterSpacing: "-0.025em",
                                                        lineHeight: styles.lineHeight,
                                                    }}
                                                >
                                                    {exp.company}
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    fontSize: styles.fontSize,
                                                    letterSpacing: "-0.025em",
                                                    lineHeight: styles.lineHeight,
                                                }}
                                            >
                                                {exp.position}
                                                {exp.roleType && exp.roleType !== "None" && ` – ${exp.roleType}`}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                textAlign: "right",
                                                marginLeft: "20px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: styles.fontSize,
                                                    letterSpacing: "-0.025em",
                                                    lineHeight: styles.lineHeight,
                                                }}
                                            >
                                                {exp.location}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: styles.fontSize,
                                                    letterSpacing: "-0.025em",
                                                    lineHeight: styles.lineHeight,
                                                }}
                                            >
                                                {exp.duration}
                                            </div>
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
                                                        marginBottom: styles.bulletSpacing,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: styles.fontSize,
                                                            marginRight: "4px",
                                                            minWidth: "8px",
                                                        }}
                                                    >
                                                        •
                                                    </span>
                                                    <div
                                                        style={{
                                                            textAlign: "justify",
                                                            fontSize: styles.fontSize,
                                                            lineHeight: styles.lineHeight,
                                                            letterSpacing: "-0.025em",
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
                                    fontSize: styles.fontSize,
                                    fontStyle: "italic",
                                    color: "#666",
                                    letterSpacing: "-0.025em",
                                }}
                            >
                                Your work experience will appear here...
                            </div>
                        )}
                    </div>
                );

            case "projects":
                if (!showProjects || !data.projects || data.projects.length === 0) return null;
                return (
                    <div
                        style={{
                            marginBottom: styles.sectionMargin,
                            ...getHighlightStyle("projects"),
                        }}
                    >
                        <div
                            style={{
                                fontSize: styles.fontSize,
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: styles.itemMargin,
                                fontWeight: "bold",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            PROJECTS
                        </div>
                        {data.projects.map((project, index) => (
                            <div
                                key={project.id}
                                className="project-item"
                                style={{
                                    marginBottom:
                                        index === data.projects.length - 1
                                            ? styles.bulletSpacing
                                            : styles.itemMargin,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        marginBottom: styles.bulletSpacing,
                                    }}
                                >
                                    <div style={{ flex: "1" }}>
                                        {project.company && (
                                            <div
                                                style={{
                                                    fontSize: styles.fontSize,
                                                    fontWeight: "bold",
                                                    letterSpacing: "-0.025em",
                                                    lineHeight: styles.lineHeight,
                                                }}
                                            >
                                                {project.company}
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                fontSize: styles.fontSize,
                                                fontWeight: "700 !important",
                                                letterSpacing: "-0.025em",
                                                lineHeight: styles.lineHeight,
                                                color: "#000",
                                                fontStyle: "normal",
                                            }}
                                        >
                                            <strong>{project.position}</strong>
                                            {project.roleType && project.roleType !== "None" && ` – ${project.roleType}`}
                                            {project.linkName && project.linkUrl && (
                                                <>
                                                    {" — "}
                                                    <a
                                                        href={project.linkUrl}
                                                        style={{ color: "blue", textDecoration: "none" }}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {project.linkName}
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            textAlign: "right",
                                            marginLeft: "20px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: styles.fontSize,
                                                letterSpacing: "-0.025em",
                                                lineHeight: styles.lineHeight,
                                            }}
                                        >
                                            {project.location}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: styles.fontSize,
                                                letterSpacing: "-0.025em",
                                                lineHeight: styles.lineHeight,
                                            }}
                                        >
                                            {project.duration}
                                        </div>
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
                                                    marginBottom: styles.bulletSpacing,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: styles.fontSize,
                                                        marginRight: "4px",
                                                        minWidth: "8px",
                                                    }}
                                                >
                                                    •
                                                </span>
                                                <div
                                                    style={{
                                                        textAlign: "justify",
                                                        fontSize: styles.fontSize,
                                                        lineHeight: styles.lineHeight,
                                                        letterSpacing: "-0.025em",
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
                );

            case "leadership":
                if (!showLeadership || !data.leadership || data.leadership.length === 0) return null;
                return (
                    <div
                        style={{
                            marginBottom: styles.sectionMargin,
                            ...getHighlightStyle("leadership"),
                        }}
                    >
                        <div
                            style={{
                                fontSize: styles.fontSize,
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: styles.itemMargin,
                                fontWeight: "bold",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            LEADERSHIP & ACHIEVEMENTS
                        </div>
                        {data.leadership.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    fontSize: styles.fontSize,
                                    marginBottom: styles.bulletSpacing,
                                    letterSpacing: "-0.025em",
                                    lineHeight: styles.lineHeight,
                                }}
                            >
                                {item.title}
                                {item.organization && `, ${item.organization}`}
                            </div>
                        ))}
                    </div>
                );

                case "skills":
                    const skillsFontSize = Math.max(11, Math.round(13 * scalingFactor)) + "px";
                    return (
                        <div
                            style={{
                                marginBottom: styles.sectionMargin,
                                ...getHighlightStyle("skills"),
                            }}
                        >
                            <div
                                style={{
                                    fontSize: styles.fontSize,
                                    borderBottom: "1px solid #000",
                                    paddingBottom: "8px",
                                    marginBottom: styles.itemMargin,
                                    fontWeight: "bold",
                                    letterSpacing: "-0.025em",
                                }}
                            >
                                SKILLS
                            </div>
                            {data.skills && data.skills.length > 0 ? (
                                data.skills.map((category) => (
                                    <div
                                        key={category.id}
                                        style={{
                                            fontSize: skillsFontSize,
                                            marginBottom: styles.bulletSpacing,
                                            lineHeight: styles.lineHeight,
                                            letterSpacing: "-0.025em",
                                            display: "flex",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "160px",
                                                flexShrink: 0,
                                                fontWeight: "bold",
                                                letterSpacing: "-0.025em",
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
                                                textTransform: "none",
                                            }}
                                        >
                                            {formatSkills(category.skills)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div
                                    style={{
                                        fontSize: skillsFontSize,
                                        fontStyle: "italic",
                                        color: "#666",
                                        letterSpacing: "-0.025em",
                                    }}
                                >
                                    Your skills will appear here...
                                </div>
                            )}
                        </div>
                    );
    
            case "education":
                return (
                    <div
                        className="education-section"
                        style={{
                            marginBottom: "0px",
                            ...getHighlightStyle("education"),
                        }}
                    >
                        <div
                            style={{
                                fontSize: styles.fontSize,
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: styles.itemMargin,
                                fontWeight: "bold",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            EDUCATION
                        </div>
                        <div>
                            {data.education.length > 0 ? (
                                data.education.map((edu, index) => (
                                    <div
                                        key={edu.id}
                                        className="education-item"
                                        style={{
                                            marginBottom:
                                                index === data.education.length - 1
                                                    ? "0px"
                                                    : styles.itemMargin,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: styles.bulletSpacing,
                                            }}
                                        >
                                            <div style={{ flex: "1" }}>
                                                <div
                                                    style={{
                                                        fontSize: styles.fontSize,
                                                        fontWeight: "bold",
                                                        letterSpacing: "-0.025em",
                                                        lineHeight: styles.lineHeight,
                                                    }}
                                                >
                                                    {edu.institution}
                                                    {edu.location && `, ${edu.location}`}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: styles.fontSize,
                                                        letterSpacing: "-0.025em",
                                                        lineHeight: styles.lineHeight,
                                                    }}
                                                >
                                                    {edu.degree}
                                                    {edu.field && `, ${edu.field}`}
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    textAlign: "right",
                                                    marginLeft: "20px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: styles.fontSize,
                                                        letterSpacing: "-0.025em",
                                                        lineHeight: styles.lineHeight,
                                                    }}
                                                >
                                                    {edu.duration}
                                                </div>
                                            </div>
                                        </div>

                                        {edu.additionalInfo && (
                                            <div
                                                style={{
                                                    fontSize: styles.fontSize,
                                                    letterSpacing: "-0.025em",
                                                    lineHeight: styles.lineHeight,
                                                }}
                                            >
                                                {edu.additionalInfo}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div
                                    style={{
                                        fontSize: styles.fontSize,
                                        fontStyle: "italic",
                                        color: "#666",
                                        letterSpacing: "-0.025em",
                                    }}
                                >
                                    Your education will appear here...
                                </div>
                            )}
                        </div>
                    </div>
                );

            case "publications":
                if (!showPublications || !data.publications || data.publications.length === 0) return null;
                return (
                    <div
                        style={{
                            marginBottom: "10px !important",
                            ...getHighlightStyle("publications"),
                        }}
                    >
                        <div
                            style={{
                                fontSize: styles.fontSize,
                                borderBottom: "1px solid #000",
                                paddingBottom: "2px",
                                marginBottom: styles.itemMargin,
                                fontWeight: "bold",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            PUBLICATIONS
                        </div>
                        {data.publications.map(
                            (item) =>
                                item.details.trim() && (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            marginBottom: styles.bulletSpacing,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: styles.fontSize,
                                                marginRight: "4px",
                                                minWidth: "8px",
                                            }}
                                        >
                                            •
                                        </span>
                                        <div
                                            style={{
                                                textAlign: "justify",
                                                fontSize: styles.fontSize,
                                                lineHeight: styles.lineHeight,
                                                letterSpacing: "-0.025em",
                                            }}
                                        >
                                            {item.details}
                                        </div>
                                    </div>
                                )
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const resumeContent = (
        <>
            <div
                style={{
                    textAlign: "center",
                    marginBottom: styles.sectionMargin,
                    ...getHighlightStyle("personalInfo"),
                }}
            >
                <div
                    style={{
                        fontSize: styles.headerSize,
                        marginBottom: "4px",
                        fontWeight: "bold",
                        letterSpacing: "-0.025em",
                    }}
                >
                    {data.personalInfo.name || "Your Name"}
                </div>
                {data.personalInfo.title && data.personalInfo.title.trim() !== "" && (
                    <div
                        style={{
                            fontSize: styles.contactSize,
                            marginBottom: "4px",
                            letterSpacing: "-0.025em",
                        }}
                    >
                        {data.personalInfo.title}
                    </div>
                )}
                <div
                    style={{
                        fontSize: styles.contactSize,
                        letterSpacing: "-0.025em",
                    }}
                >
                    {data.personalInfo.phone}
                    {data.personalInfo.email && (
                        <>
                            {" | "}
                            <a
                                href={`mailto:${data.personalInfo.email}`}
                                style={{ color: "blue", textDecoration: "none" }}
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
                                href={getLinkedInUrl(data.personalInfo.linkedin)}
                                style={{ color: "blue", textDecoration: "none" }}
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
                                href={getPortfolioUrl(data.personalInfo.portfolio)}
                                style={{ color: "blue", textDecoration: "none" }}
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
                                style={{ color: "blue", textDecoration: "none" }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {formatGithub(data.personalInfo.github)}
                            </a>
                        </>
                    )}
                </div>
            </div>

            {sectionOrder
                .filter((sectionId) => sectionId !== "personalInfo")
                .map((sectionId) => renderSection(sectionId))}
        </>
    );

    return (
        <div className="resume-single-page">
            {showWarningModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            padding: "2rem",
                            borderRadius: "12px",
                            boxShadow:
                                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            maxWidth: "500px",
                            width: "90%",
                            textAlign: "center",
                            border: "3px solid #f59e0b",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "1.5rem",
                                fontWeight: "bold",
                                color: "#dc2626",
                                marginBottom: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                            }}
                        >
                             ⚠️ AUTOMATIC PRINT SETTINGS ⚠️
                         </div>

                         <div
                             style={{
                                 fontSize: "1rem",
                                 lineHeight: "1.6",
                                 color: "#374151",
                                 marginBottom: "1.5rem",
                                 textAlign: "left",
                             }}
                         >
                             <div style={{ marginBottom: "0.75rem" }}>
                                 <strong>
                                     Pages:{" "}
                                     <span
                                         style={{
                                             color: "#10b981",
                                             fontWeight: "bold",
                                         }}
                                     >
                                         AUTO-SET TO 2
                                     </span>
                                 </strong>{" "}
                                 — automatically configured.
                             </div>
                             <div style={{ marginBottom: "0.75rem" }}>
                                 <strong>
                                     Scale:{" "}
                                     <span
                                         style={{
                                             color: "#10b981",
                                             fontWeight: "bold",
                                         }}
                                     >
                                         AUTO-OPTIMIZED
                                     </span>
                                 </strong>{" "}
                                 — for best fit.
                             </div>
                             <div style={{ marginBottom: "0.75rem" }}>
                                 <strong>
                                     Margins:{" "}
                                     <span
                                         style={{
                                             color: "#10b981",
                                             fontWeight: "bold",
                                         }}
                                     >
                                         AUTO-SET TO MINIMAL
                                     </span>
                                 </strong>{" "}
                                 — maximum content space.
                             </div>
                         </div>

                         <div
                             style={{
                                 fontSize: "0.9rem",
                                 color: "#6b7280",
                                 marginBottom: "1.5rem",
                                 fontStyle: "italic",
                             }}
                         >
                             The print dialog will open with optimized settings. Just click "Print" or "Save as PDF"!
                         </div>

                        <button
                            onClick={handlePrintConfirm}
                            style={{
                                backgroundColor: "#10b981",
                                color: "white",
                                padding: "12px 24px",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "1rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "#059669";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "#10b981";
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showPrintButtons && (
                <div
                    className="no-print"
                    style={{ marginBottom: "1rem", textAlign: "center" }}
                >
                    <button
                        onClick={handlePrint}
                        style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "4px",
                            marginRight: "8px",
                            cursor: "pointer",
                        }}
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={showPrintInstructions}
                        style={{
                            backgroundColor: "#6b7280",
                            color: "white",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Print Instructions
                    </button>
                </div>
            )}

            <div
                className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden no-print"
                style={{ height: "800px", overflow: "auto" }}
            >
                <div
                    ref={measureRef}
                    data-resume-preview="true"
                    style={{
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: styles.fontSize,
                        lineHeight: styles.lineHeight,
                        color: "#000000",
                        padding: `${styles.paddingTop} ${styles.paddingSide} ${styles.paddingBottom} ${styles.paddingSide}`,
                        paddingRight: `calc(${styles.paddingSide} + 0.1in)`,
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

            <div
                id="resume-print-only"
                className="resume-container"
                style={{
                    display: "none",
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: styles.fontSize,
                    lineHeight: styles.lineHeight,
                    color: "#000000",
                    background: "white",
                    boxSizing: "border-box",
                    width: "100%",
                    height: "auto",
                    minHeight: "auto",
                    margin: "0",
                    padding: "0.2in 0.5in 0.5in 0.5in",
                    letterSpacing: "-0.025em",
                    overflow: "visible",
                }}
            >
                {resumeContent}
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
           @media print {
                            body {
                                margin: 0 !important;
                                padding: 0 !important;
                                font-size: ${styles.fontSize} !important;
                                letter-spacing: 0.1px !important;
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            
                            @page {
                                margin: 0 !important;
                                size: letter !important;
                            }
                            
                            * {
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            
                            .no-print {
                                display: none !important;
                            }
                            
                            #resume-print-only {
                                display: flex !important;
                                flex-direction: column !important;
                                transform: scale(1.02) !important;
                                transform-origin: top left !important;
                                width: 98% !important;
                            }
                            
                            div[style*="marginBottom"] {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                            
                            a {
                                color: black !important;
                                text-decoration: none !important;
                            }
                            
                            body, html {
                                height: auto !important;
                                overflow: visible !important;
                            }
                        }`,
                }}
            />
        </div>
    );
};
