

import React, { useState, createContext } from "react";

type UserContextType = {
  userDetails: any;
  token: string | null;
  setData: ({ userDetails, token }: { userDetails: any; token: string }) => void;
};

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userDetails, setUserDetails] = useState(() => {
    try {
      const stored = localStorage.getItem("userAuth");
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed?.userDetails || {};
    } catch (err) {
      console.error("Error parsing userDetails:", err);
      return {};
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const stored = localStorage.getItem("userAuth");
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed?.token || null;
    } catch (err) {
      console.error("Error parsing token:", err);
      return null;
    }
  });

const setData = ({ userDetails, token }: { userDetails: any; token: string }) => {
  // update React state
  setUserDetails(userDetails);
  setToken(token);

  // merge into existing localStorage.userAuth (preserve other keys)
  try {
    const raw = localStorage.getItem("userAuth");
    const existing = raw ? JSON.parse(raw) : {};

    const next = {
      ...existing,       // keep everything else under userAuth
      userDetails,       // replace with latest
      token,             // replace with latest
    };

    localStorage.setItem("userAuth", JSON.stringify(next));
  } catch (err) {
    console.error("Failed to update userAuth:", err);
    // Fallback: at least persist the two keys
    localStorage.setItem("userAuth", JSON.stringify({ userDetails, token }));
  }
};

  return (
    <UserContext.Provider value={{ userDetails, token, setData }}>
      {children}
    </UserContext.Provider>
  );
}

