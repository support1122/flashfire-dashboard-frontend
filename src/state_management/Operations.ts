import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ManagedUser {
     _id: string;
     name: string;
     email: string;
     userID: string;
}

interface Operations {
     name: string;
     email: string;
     role: string;
     managedUsers: ManagedUser[];
     operatorNamesMap: Record<string, string>;

     setName: (name: string) => void;
     setEmailOperations: (email: string) => void;
     setRole: (role: string) => void;
     setManagedUsers: (users: ManagedUser[]) => void;
     addManagedUser: (user: ManagedUser) => void;
     removeManagedUser: (id: string) => void;
     setOperatorNamesMap: (map: Record<string, string>) => void;
     getOperatorName: (email: string) => string;
     reset: () => void;
}

export const useOperationsStore = create<Operations>()(
     persist(
          (set, get) => ({
               name: "",
               email: "",
               role: "",
               managedUsers: [],
               operatorNamesMap: {},

               setName: (name) => set({ name }),
               setEmailOperations: (email) => set({ email }),
               setRole: (role) => set({ role }),
               setManagedUsers: (users) => set({ managedUsers: users }),
               addManagedUser: (user) =>
                    set((state) => ({
                         managedUsers: [...state.managedUsers, user],
                    })),
               removeManagedUser: (id) =>
                    set((state) => ({
                         managedUsers: state.managedUsers.filter((u) => u._id !== id),
                    })),
               setOperatorNamesMap: (map) => set({ operatorNamesMap: map || {} }),
               getOperatorName: (email: string) => {
                    const map = get().operatorNamesMap;
                    if (!email) return '';
                    return map[email.toLowerCase()] || '';
               },
               reset: () =>
                    set({
                         name: "",
                         email: "",
                         role: "",
                         managedUsers: [],
                         operatorNamesMap: {},
                    }),
          }),
          {
               name: "Operations-store",
          }
     )
);
