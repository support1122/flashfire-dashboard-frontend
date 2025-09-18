import { ResumeData } from "../types/ResumeTypes";

export const initialData: ResumeData = {
    personalInfo: {
        name: "",
        title: "",
        phone: "",
        email: "",
        location: "",
        linkedin: "",
        portfolio: "",
        github: "",
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