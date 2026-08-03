

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

// A stored client session is only usable if it has both a token and an email.
// A token with no email is the signature of a session that got clobbered (see
// the /get-updated-user note in MainContent): the app stays "logged in" enough
// to render, but every call needing the email fails, and because it is
// persisted, reloading does not help. Dropping it here makes an already-stuck
// browser recover on its own instead of needing site data cleared by hand.
// Operator sessions never write userAuth - they live in the operations store -
// so nothing below can log an operator out.
const readStoredAuth = (): { userDetails: any; token: string | null } => {
  try {
    const stored = localStorage.getItem("userAuth");
    const parsed = stored ? JSON.parse(stored) : null;
    const details = parsed?.userDetails || {};
    const storedToken = parsed?.token || null;

    if (storedToken && !details?.email) {
      console.warn("Stored session has a token but no email; clearing it and requiring a fresh login.");
      localStorage.removeItem("userAuth");
      return { userDetails: {}, token: null };
    }

    return { userDetails: details, token: storedToken };
  } catch (err) {
    console.error("Error parsing stored session:", err);
    localStorage.removeItem("userAuth");
    return { userDetails: {}, token: null };
  }
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Read once: the corrupt-session branch mutates localStorage, so two reads
  // would have the second one observing the cleanup rather than the session.
  const [initialAuth] = useState(readStoredAuth);
  const [userDetails, setUserDetails] = useState(initialAuth.userDetails);
  const [token, setToken] = useState<string | null>(initialAuth.token);

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
    // Dev bypass: skip token validation for non-JWT tokens
    if (token === 'dev-bypass-token') return;
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

