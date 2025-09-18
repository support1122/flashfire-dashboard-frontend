import { create } from "zustand";
import { persist } from "zustand/middleware";


interface ResumeStore {
     versionV: number;
     // actions
     setVersion: (versionV: number) => void;

}


export const PreviewStore = create<ResumeStore>()(
     persist(
          (set) => ({
               versionV: 0,
               setVersion: (versionV) => set({ versionV }),
          }),
          {
               name: "version-storage", // key in localStorage
          }
     )
);
