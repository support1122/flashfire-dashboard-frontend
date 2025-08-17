
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
  const { userDetails, token } = useContext(UserContext);
  const navigate = useNavigate();
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    // const VITE_API_BASE_URL=import.meta.env.VITE_API_BASE_URL;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alljobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userDetails })
      });
      const data = await res.json();
      console.log(data)
      if(data?.message =='Token or user details missing' || data?.message == 'Token or user details missing' || data?.message == 'Invalid token or expired') {
        // navigate('/login');
        return;
      }
      setUserJobs(data?.allJobs || []);
    } catch (err) {
      console.error(err);
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
