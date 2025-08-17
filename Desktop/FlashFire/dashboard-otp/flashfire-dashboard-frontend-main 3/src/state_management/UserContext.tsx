

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
    setUserDetails(userDetails);
    setToken(token);
    localStorage.setItem("userAuth", JSON.stringify({ userDetails, token }));
  };

  return (
    <UserContext.Provider value={{ userDetails, token, setData }}>
      {children}
    </UserContext.Provider>
  );
}

