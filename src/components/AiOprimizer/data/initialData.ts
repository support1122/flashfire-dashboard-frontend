import { ResumeData } from "../types/ResumeTypes";

const emptyInitialData: ResumeData = {
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
            location: "Remote, USA",
            roleType: "Full-time",
            responsibilities: [""],
        },
    ],
    projects: [
        {
            id: "1",
            position: "",
            company: "",
            duration: "",
            location: "Remote, USA",
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
    publications: [],
};

// Function to get initial data, checking for last selected resume first
export const getInitialData = (): ResumeData => {
    try {
        // Check if we have stored resume data in localStorage
        const storedData = localStorage.getItem("resume-storage");
        if (storedData) {
            const parsed = JSON.parse(storedData);
            const lastSelectedResume = parsed.state?.lastSelectedResume;
            const lastSelectedResumeId = parsed.state?.lastSelectedResumeId;
            const currentResumeData = parsed.state?.resumeData;

            console.log("🔍 Checking localStorage for last selected resume:", {
                hasStoredData: !!storedData,
                hasLastSelectedResume: !!lastSelectedResume,
                hasCurrentResumeData: !!currentResumeData,
                lastSelectedResumeId: lastSelectedResumeId,
                lastSelectedResumeName: lastSelectedResume?.personalInfo?.name || "No name",
                currentResumeDataName: currentResumeData?.personalInfo?.name || "No name"
            });

            // Check both lastSelectedResume and current resumeData
            if (lastSelectedResume && lastSelectedResumeId) {
                console.log("✅ Loading last selected resume as initial data:", lastSelectedResumeId, lastSelectedResume.personalInfo?.name);
                return lastSelectedResume;
            } else if (currentResumeData && currentResumeData.personalInfo?.name) {
                console.log("✅ Loading current resume data as initial data:", currentResumeData.personalInfo?.name);
                return currentResumeData;
            }
        }
    } catch (error) {
        console.error("❌ Error loading last selected resume from localStorage:", error);
    }

    console.log("❌ No last selected resume found, using empty initial data");
    // Return empty initial data if no stored resume found
    return emptyInitialData;
};

// Export the function result as initialData for backward compatibility
// Note: This will be called at module load time, but the store will call getInitialData() again during initialization
export const initialData = getInitialData();