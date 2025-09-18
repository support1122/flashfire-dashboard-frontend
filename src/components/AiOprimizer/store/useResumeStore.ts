import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialData } from "../data/initialData";

type ResumeDataType = typeof initialData;

interface ResumeStore {
     resumeData: ResumeDataType;
     baseResume: ResumeDataType;
     showLeadership: boolean;
     showProjects: boolean;
     showSummary: boolean;
     isSaved: boolean;
     jobDescription: string;
     isOptimizing: boolean;
     optimizedData: ResumeDataType | null;
     currentView: "editor" | "optimized" | "changes";
     showChanges: boolean;
     changedFields: Set<string>;
     showPublications : boolean;
     
     // actions
     
     setResumeData: (data: ResumeDataType) => void;
     setBaseResume: (data: ResumeDataType) => void;
     setShowLeadership: (value: boolean) => void;
     setShowProjects: (value: boolean) => void;
     setShowSummary: (value: boolean) => void;
     setShowPublications : (value : boolean) => void;
     setIsSaved: (value: boolean) => void;
     setJobDescription: (value: string) => void;
     setIsOptimizing: (value: boolean) => void;
     setOptimizedData: (
          data:
               | ResumeDataType
               | null
               | ((prev: ResumeDataType | null) => ResumeDataType | null)
     ) => void;
     setCurrentView: (view: "editor" | "optimized" | "changes") => void;
     setShowChanges: (value: boolean) => void;
     setChangedFields: (fields: Set<string>) => void;
     resetStore: () => void;
}


export const useResumeStore = create<ResumeStore>()(
     persist(
          (set) => ({
               resumeData: initialData,
               baseResume: initialData,
               showLeadership: false,
               showProjects: false, // Will be set based on database check
               showSummary: false, // Will be set based on database check
               isSaved: false,
               jobDescription: "",
               isOptimizing: false,
               optimizedData: null,
               currentView: "editor",
               showChanges: false,
               changedFields: new Set(),
               showPublications: false,
               

               setShowPublications: (value) => set({ showPublications: value }),
               setResumeData: (data) => set({ resumeData: data }),
               setBaseResume: (data) => set({ baseResume: data }),
               setShowLeadership: (value) => set({ showLeadership: value }),
               setShowProjects: (value) => set({ showProjects: value }),
               setShowSummary: (value) => set({ showSummary: value }),
               setIsSaved: (value) => set({ isSaved: value }),
               setJobDescription: (value) => set({ jobDescription: value }),
               setIsOptimizing: (value) => set({ isOptimizing: value }),
               setOptimizedData: (data) =>
                    set((state) => ({
                         optimizedData:
                              typeof data === "function"
                                   ? data(state.optimizedData)
                                   : data,
                    })),
               setCurrentView: (view) => set({ currentView: view }),
               setShowChanges: (value) => set({ showChanges: value }),
               setChangedFields: (fields) => set({ changedFields: fields }),

               resetStore: () =>
                    set({
                         resumeData: initialData,
                         showLeadership: true,
                         showProjects: false, // Will be set based on database check
                         showSummary: false, // Will be set based on database check
                         isSaved: false,
                         showPublications : false,
                         jobDescription: "",
                         isOptimizing: false,
                         optimizedData: null,
                         currentView: "editor",
                         showChanges: false,
                         changedFields: new Set(),
                    }),
          }),
          {
               name: "resume-storage", // key in localStorage
               partialize: (state) => ({
                    ...state,
                    changedFields: Array.from(state.changedFields),
               }),
               onRehydrateStorage: () => (state) => {
                    if (state) {
                         state.changedFields = new Set(state.changedFields || []);
                    }
               },
          }
     )
);
