import { create } from "zustand";

interface ResumeStore {
     // Global editing state
     isEditingUnlocked: boolean;

     // Section-specific editable states
     isPersonalInfoEditable: boolean;
     isSummaryEditable: boolean;
     isWorkExperienceEditable: boolean;
     isProjectsEditable: boolean;
     isLeadershipEditable: boolean;
     isSkillsEditable: boolean;
    isEducationEditable: boolean;
    resume_id: string;
    accessKey: string;
    unlockKey: string;
    userId: string;

    // Actions
    setUserId: (data: string) => void;
    setEditingUnlocked: (value: boolean) => void;
    validateUnlockKey: (key: string) => Promise<boolean>;
    setResumeId: (id: string) => void;
    setAccessKey: (key: string) => void;
    checkAdminAndUnlock: () => boolean;

     // Individual section controls (for future granular control if needed)
     setPersonalInfoEditable: (value: boolean) => void;
     setSummaryEditable: (value: boolean) => void;
     setWorkExperienceEditable: (value: boolean) => void;
     setProjectsEditable: (value: boolean) => void;
     setLeadershipEditable: (value: boolean) => void;
     setSkillsEditable: (value: boolean) => void;
     setEducationEditable: (value: boolean) => void;

     // Utility functions
     unlockAllSections: () => void;
     lockAllSections: () => void;
}

export const useResumeUnlockStore = create<ResumeStore>((set , get) => ({
     // Initial state - everything locked
     isEditingUnlocked: false,
     isPersonalInfoEditable: false,
     isSummaryEditable: false,
     isWorkExperienceEditable: false,
     isProjectsEditable: false,
    isLeadershipEditable: false,
    isSkillsEditable: false,
    isEducationEditable: false,
    resume_id: "" ,
    userId: "",
    accessKey: "",
    unlockKey: "",

    // Check if user is admin and auto-unlock
     checkAdminAndUnlock: () => {
          const userRole = localStorage.getItem('role');
          if (userRole === 'admin') {
               set({
                    isEditingUnlocked: true,
                    isPersonalInfoEditable: true,
                    isSummaryEditable: true,
                    isWorkExperienceEditable: true,
                    isProjectsEditable: true,
                    isLeadershipEditable: true,
                    isSkillsEditable: true,
                    isEducationEditable: true,
               });
               return true;
          }
          return false;
     },

     // Main unlock function
     setUserId: (data) => set({ userId: data }),
     setEditingUnlocked: (value) => set({ isEditingUnlocked: value }),
     setResumeId: (id) => set({ resume_id: id }),
     setAccessKey: (key) => set({ accessKey: key }),

     // Validation function
     validateUnlockKey: async (key) => {
          // First check if user is admin - if so, always unlock
          const userRole = localStorage.getItem('role');
          if (userRole === 'admin') {
               set({
                    isEditingUnlocked: true,
                    isPersonalInfoEditable: true,
                    isSummaryEditable: true,
                    isWorkExperienceEditable: true,
                    isProjectsEditable: true,
                    isLeadershipEditable: true,
                    isSkillsEditable: true,
                    isEducationEditable: true,
               });
               return true;
          }

          // Simple hardcoded unlock key for non-admin users
          if (key === 'flashfire') {
               set({
                    isEditingUnlocked: true,
                    isPersonalInfoEditable: true,
                    isSummaryEditable: true,
                    isWorkExperienceEditable: true,
                    isProjectsEditable: true,
                    isLeadershipEditable: true,
                    isSkillsEditable: true,
                    isEducationEditable: true,
               });
               return true;
          }
          return false;
     },

     // Individual section setters
     setPersonalInfoEditable: (value) => set({ isPersonalInfoEditable: value }),
     setSummaryEditable: (value) => set({ isSummaryEditable: value }),
     setWorkExperienceEditable: (value) => set({ isWorkExperienceEditable: value }),
     setProjectsEditable: (value) => set({ isProjectsEditable: value }),
     setLeadershipEditable: (value) => set({ isLeadershipEditable: value }),
     setSkillsEditable: (value) => set({ isSkillsEditable: value }),
     setEducationEditable: (value) => set({ isEducationEditable: value }),

     // Utility functions
     unlockAllSections: () => set({
          isEditingUnlocked: true,
          isPersonalInfoEditable: true,
          isSummaryEditable: true,
          isWorkExperienceEditable: true,
          isProjectsEditable: true,
          isLeadershipEditable: true,
          isSkillsEditable: true,
          isEducationEditable: true,
     }),

     lockAllSections: () => set({
          isEditingUnlocked: false,
          isPersonalInfoEditable: false,
          isSummaryEditable: false,
          isWorkExperienceEditable: false,
          isProjectsEditable: false,
          isLeadershipEditable: false,
          isSkillsEditable: false,
          isEducationEditable: false,
     }),
}));