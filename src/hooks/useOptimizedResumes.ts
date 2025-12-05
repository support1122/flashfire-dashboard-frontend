import { useState, useEffect } from 'react';
import { OptimizedResume } from '../types';

const STORAGE_KEY = 'optimized-resumes';

export function useOptimizedResumes() {
  const [optimizedResumes, setOptimizedResumes] = useState<OptimizedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setOptimizedResumes(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(optimizedResumes));
    }
  }, [optimizedResumes, isLoading]);

  const addOptimizedResume = (resume: OptimizedResume) => {
    setOptimizedResumes(prev => {
      // Remove existing resume for the same job if it exists
      const filtered = prev.filter(r => r.jobId !== resume.jobId);
      return [...filtered, resume];
    });
  };

  const getOptimizedResumeByJobId = (jobId: string) => {
    return optimizedResumes.find(resume => resume.jobId === jobId);
  };

  const deleteOptimizedResume = (jobId: string) => {
    setOptimizedResumes(prev => prev.filter(resume => resume.jobId !== jobId));
  };

  return {
    optimizedResumes,
    isLoading,
    addOptimizedResume,
    getOptimizedResumeByJobId,
    deleteOptimizedResume,
  };
}