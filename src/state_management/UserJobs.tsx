
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from './UserContext.tsx';
import { useNavigate } from 'react-router-dom';
import { useOperationsStore } from "./Operations.ts";
import { useJobsSessionStore, useShouldFetchJobs } from './JobsSessionStore';

type Job = any;

interface UserJobsContextType {
  userJobs: Job[];
  setUserJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  loading: boolean;
}

const UserJobsContext = createContext<UserJobsContextType | null>(null);

export const useUserJobs = () => {
  const context = useContext(UserJobsContext);
  if (!context) {
    throw new Error('useUserJobs must be used within a UserJobsProvider');
  }
  return context;
};

export const UserJobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false); // Changed to false - never show loading
  const context = useContext(UserContext);
  const navigate = useNavigate();
  
  const userDetails = context?.userDetails;
  const token = context?.token;
  const { role } = useOperationsStore();
  
  // Use session storage store
  const { 
    jobs: userJobs, 
    setJobs, 
    setLoading: setStoreLoading, 
    setUserEmail,
    loading: storeLoading 
  } = useJobsSessionStore();
  
  const lastManualUpdateRef = React.useRef<number>(0);
  
  // Always fetch fresh data in the background on mount or when user changes
  useEffect(() => {
    if (userDetails?.email) {
      // Add a small delay to avoid race conditions with recent updates
      const timeoutId = setTimeout(() => {
        fetchJobsInBackground();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [userDetails?.email, token, role]);
  
  useEffect(() => {
    if (userDetails?.email) {
      setUserEmail(userDetails.email);
    }
  }, [userDetails?.email, setUserEmail]);

  const fetchJobsInBackground = async () => {
    console.log("🔄 Fetching jobs in background for role:", role);
    // Don't set loading states - keep showing cached data
    
    try {
      console.log("Fetching jobs...", userDetails.email);
      let data;
      
      if (role == "operations") {
        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/operations/alljobs`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userDetails.email }),
            }
        );
        data = await res.json();
        console.log("✅ Got job data (operations):", data?.allJobs?.length, "jobs");
      } else {
        console.log("Fetching jobs with token:", token);
        console.log(
            "API URL:",
            `${import.meta.env.VITE_API_BASE_URL}/getalljobs`
        );

        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/getalljobs`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: userDetails.email }),
            }
        );

        console.log("Response status:", res.status);

        data = await res.json();
        console.log("✅ Fetched jobs response:", data?.allJobs?.length, "jobs");

        if (
            data?.message == "Token or user details missing" ||
            data?.message == "Token or user details missing" ||
            data?.message == "Invalid token or expired"
        ) {
            console.log("Authentication failed, attempting token refresh...");

            // Try to refresh token
            if (context?.refreshToken) {
                const refreshSuccess = await context.refreshToken();
                if (refreshSuccess) {
                    // Retry the request with new token
                    console.log("Token refreshed, retrying job fetch...");
                    setTimeout(() => fetchJobsInBackground(), 100);
                    return;
                }
            }

            console.log("Token refresh failed, redirecting to login");
            navigate("/login");
            return;
        }
      }
      
      // Store in session storage - but only if no recent manual update
      const timeSinceLastUpdate = Date.now() - lastManualUpdateRef.current;
      if (timeSinceLastUpdate > 2000) {
        console.log("💾 Updating session storage with fresh data (no recent updates)");
        setJobs(data?.allJobs || []);
      } else {
        console.log("⏸️ Skipping background fetch update - recent manual update detected");
      }
      
    } catch (err) {
      console.error('❌ Error fetching jobs:', err);
      // Don't clear existing data on error - keep showing cached data
    }
  };

  // Wrapper function to maintain compatibility with existing code
  const setUserJobs = (jobs: Job[] | ((prevJobs: Job[]) => Job[])) => {
    lastManualUpdateRef.current = Date.now();
    
    try {
      if (typeof jobs === 'function') {
        const currentJobs = Array.isArray(userJobs) ? userJobs : [];
        const nextJobs = jobs(currentJobs);
        setJobs(nextJobs);
      } else {
        setJobs(jobs);
      }
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
        console.warn('⚠️ Storage quota exceeded - clearing old jobs data and retrying');
        try {
          sessionStorage.removeItem('jobs-session-storage');
          if (typeof jobs === 'function') {
            const currentJobs = Array.isArray(userJobs) ? userJobs : [];
            const nextJobs = jobs(currentJobs);
            setJobs(nextJobs);
          } else {
            setJobs(jobs);
          }
        } catch (retryError) {
          console.error('❌ Failed to update jobs even after clearing storage:', retryError);
          if (typeof jobs === 'function') {
            const currentJobs = Array.isArray(userJobs) ? userJobs : [];
            const nextJobs = jobs(currentJobs);
            setJobs(nextJobs);
          } else {
            setJobs(jobs);
          }
        }
      } else {
        // Re-throw non-quota errors
        throw error;
      }
    }
  };

  // Ensure userJobs is always an array
  const safeUserJobs = Array.isArray(userJobs) ? userJobs : [];

  return (
    <UserJobsContext.Provider value={{ userJobs: safeUserJobs, setUserJobs, loading }}>
      {children}
    </UserJobsContext.Provider>
  );
};
