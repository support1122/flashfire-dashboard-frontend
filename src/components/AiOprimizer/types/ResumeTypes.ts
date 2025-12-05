import { initialData } from "../data/initialData";

export interface WorkExperienceItem {
    id: string;
    position: string;
    company: string;
    duration: string;
    location: string;
    roleType: string;
    responsibilities: string[];
}

export interface ProjectItem {
    id: string;
    position: string;
    company: string;
    duration: string;
    location: string;
    roleType: string;
    responsibilities: string[];
    linkName: string;
    linkUrl: string;
}

export interface LeadershipItem {
    id: string;
    title: string;
    organization: string;
}

export interface EducationItem {
    id: string;
    institution: string;
    location: string;
    degree: string;
    field: string;
    duration: string;
    additionalInfo: string;
}

export interface SkillCategory {
    id: string;
    category: string;
    skills: string;
}

export interface PersonalInfo {
    name: string;
    title: string;
    phone: string;
    email: string;
    location: string;
    linkedin: string;
    portfolio: string;
    github: string;
    publications: string;
}

export interface PublicationItem{
    id: string;
    details: string;
}

export interface ResumeData {
    personalInfo: PersonalInfo;
    summary: string;
    workExperience: WorkExperienceItem[];
    projects: ProjectItem[];
    leadership: LeadershipItem[];
    skills: SkillCategory[];
    education: EducationItem[];
    publications: PublicationItem[];

}

export type ResumeDataType = typeof initialData;