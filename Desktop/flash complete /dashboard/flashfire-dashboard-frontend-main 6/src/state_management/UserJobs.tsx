
import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserContext } from './UserContext.tsx';
import { useNavigate } from 'react-router-dom';

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
  const [loading, setLoading] = useState(true);
  const context = useContext(UserContext);
  const navigate = useNavigate();
  
  const userDetails = context?.userDetails;
  const token = context?.token;
  
  useEffect(() => {
    if (token && userDetails) {
      fetchJobs();
    }
  }, [token, userDetails]);

  const fetchJobs = async () => {
    if (!token || !userDetails) {
      console.log('No token or userDetails available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching jobs with token:', token);
      console.log('API URL:', `${import.meta.env.VITE_API_BASE_URL}/getalljobs`);
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/getalljobs`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      const data = await res.json();
      console.log('Fetched jobs response:', data);
      
      if(data?.message =='Token or user details missing' || data?.message == 'Token or user details missing' || data?.message == 'Invalid token or expired') {
        console.log('Authentication failed, attempting token refresh...');
        
        // Try to refresh token
        if (context?.refreshToken) {
          const refreshSuccess = await context.refreshToken();
          if (refreshSuccess) {
            // Retry the request with new token
            console.log('Token refreshed, retrying job fetch...');
            setTimeout(() => fetchJobs(), 100);
            return;
          }
        }
        
        console.log('Token refresh failed, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('Setting userJobs:', data?.allJobs);
      setUserJobs(data?.allJobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserJobsContext.Provider value={{ userJobs, setUserJobs, loading }}>
      {children}
    </UserJobsContext.Provider>
  );
};
