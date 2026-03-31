

import React, { useState, createContext, useEffect, useCallback, useMemo } from "react";
import { TokenManager } from "../utils/tokenManager";
import { toastUtils, toastMessages } from "../utils/toast";

type UserContextType = {
  userDetails: any;
  token: string | null;
  setData: ({ userDetails, token }: { userDetails: any; token: string }) => void;
  refreshToken: () => Promise<boolean>;
  logout: () => void;
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

const setData = useCallback(({ userDetails: newDetails, token: newToken }: { userDetails: any; token: string }) => {
  // update React state
  setUserDetails(newDetails);
  setToken(newToken);

  // merge into existing localStorage.userAuth (preserve other keys)
  try {
    const raw = localStorage.getItem("userAuth");
    const existing = raw ? JSON.parse(raw) : {};

    const next = {
      ...existing,       // keep everything else under userAuth
      userDetails: newDetails,
      token: newToken,
    };

    localStorage.setItem("userAuth", JSON.stringify(next));
  } catch (err) {
    console.error("Failed to update userAuth:", err);
    localStorage.setItem("userAuth", JSON.stringify({ userDetails: newDetails, token: newToken }));
  }
}, []);

const logout = useCallback(() => {
  setUserDetails({});
  setToken(null);
  TokenManager.clearStoredToken();
  toastUtils.success(toastMessages.logoutSuccess);
}, []);

const refreshToken = useCallback(async (): Promise<boolean> => {
  try {
    if (!userDetails?.email) {
      console.error("No email found for token refresh");
      return false;
    }

    const result = await TokenManager.refreshToken(userDetails.email);
    if (result) {
      setData({ userDetails: result.userDetails, token: result.token });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}, [userDetails?.email, setData]);

// Auto token refresh effect
useEffect(() => {
  if (!token || !userDetails?.email) return;

  const checkAndRefreshToken = async () => {
    if (TokenManager.isTokenExpired(token)) {
      console.log("Token expired, attempting refresh...");
      const success = await refreshToken();
      if (!success) {
        console.log("Token refresh failed, logging out...");
        logout();
      }
    } else if (TokenManager.isTokenExpiringSoon(token)) {
      console.log("Token expiring soon, refreshing...");
      await refreshToken();
    }
  };

  // Check token on mount
  checkAndRefreshToken();

  // Set up periodic token check (every 5 minutes)
  const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [token, userDetails?.email]);

  const contextValue = useMemo(() => ({
    userDetails, token, setData, refreshToken, logout
  }), [userDetails, token, setData, refreshToken, logout]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

