
import React, { createContext, useState, useEffect, useContext } from 'react';
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
  const [loading, setLoading] = useState(true);
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
  
  // Check if we need to fetch fresh data
  const shouldFetch = useShouldFetchJobs(userDetails?.email);
  
  useEffect(() => {
    if (token && userDetails && shouldFetch) {
      fetchJobs();
    } else if (userDetails?.email && !shouldFetch) {
      // Data is fresh in session storage, just set loading to false
      setLoading(false);
    }
  }, [token, userDetails, shouldFetch]);
  
  useEffect(() => {
    if (userDetails?.email) {
      setUserEmail(userDetails.email);
    }
  }, [userDetails?.email, setUserEmail]);

  const fetchJobs = async () => {
    console.log("Role is ", role);
    setLoading(true);
    setStoreLoading(true);
    
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
        console.log("got job data", data);
      } else {
        console.log("Fetching jobs with token:", token);
        console.log(
            "API URL:",
            `${import.meta.env.VITE_API_BASE_URL}/getalljobs`
        );

       const res = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/getalljobs?email=${encodeURIComponent(userDetails?.email)}`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
);


        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers);

        data = await res.json();
        console.log("Fetched jobs response:", data);

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
                    setTimeout(() => fetchJobs(), 100);
                    return;
                }
            }

            console.log("Token refresh failed, redirecting to login");
            navigate("/login");
            return;
        }
      }
      
      // Store in session storage
      console.log("Setting jobs in session storage:", data?.allJobs);
      setJobs(data?.allJobs || []);
      
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  };

  // Wrapper function to maintain compatibility with existing code
  const setUserJobs = (jobs: Job[] | ((prevJobs: Job[]) => Job[])) => {
    if (typeof jobs === 'function') {
      // Compute next jobs array from current store value, then set
      const currentJobs = Array.isArray(userJobs) ? userJobs : [];
      const nextJobs = jobs(currentJobs);
      setJobs(nextJobs);
    } else {
      setJobs(jobs);
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
