
import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserContext } from './UserContext.tsx';
import { useNavigate } from 'react-router-dom';
import { useOperationsStore } from "./Operations.ts";
import { useJobs } from '../hooks/useJobs';

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
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const context = useContext(UserContext);
  const navigate = useNavigate();
  
  const userDetails = context?.userDetails;
  const token = context?.token;
  const { role } = useOperationsStore();
  
  // Use React Query for jobs data
  const isOperations = role === "operations";
  const { 
    data: jobsData, 
    isLoading: loading, 
    error: jobsError,
    refetch: refetchJobs 
  } = useJobs(token, userDetails?.email, isOperations);

  // Update userJobs when React Query data changes
  useEffect(() => {
    if (jobsData?.allJobs) {
      setUserJobs(jobsData.allJobs);
    }
  }, [jobsData]);

  // Handle authentication errors from React Query
  useEffect(() => {
    if (jobsError) {
      console.log("Jobs fetch error:", jobsError);
      if (jobsError.status === 401 || jobsError.status === 403) {
        console.log("Authentication failed, attempting token refresh...");
        
        if (context?.refreshToken) {
          context.refreshToken().then((refreshSuccess) => {
            if (refreshSuccess) {
              console.log("Token refreshed, retrying job fetch...");
              refetchJobs();
            } else {
              console.log("Token refresh failed, redirecting to login");
              navigate("/login");
            }
          });
        } else {
          navigate("/login");
        }
      }
    }
  }, [jobsError, context, refetchJobs, navigate]);

  return (
    <UserJobsContext.Provider value={{ userJobs, setUserJobs, loading }}>
      {children}
    </UserJobsContext.Provider>
  );
};
