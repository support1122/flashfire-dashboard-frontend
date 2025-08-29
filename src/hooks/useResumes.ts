import { useState, useEffect } from 'react';
import { Resume, BaseResume } from '../types';
import { saveResumes, loadResumes, saveBaseResumes, loadBaseResumes } from '../utils/storage';

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [baseResumes, setBaseResumes] = useState<BaseResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedResumes = loadResumes();
    const loadedBaseResumes = loadBaseResumes();
    setResumes(loadedResumes);
    setBaseResumes(loadedBaseResumes);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveResumes(resumes);
    }
  }, [resumes, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveBaseResumes(baseResumes);
    }
  }, [baseResumes, isLoading]);

  const addResume = (resume: Resume) => {
    setResumes(prev => [...prev, resume]);
  };

  const addMultipleResumes = (newResumes: Resume[]) => {
    setResumes(prev => [...prev, ...newResumes]);
  };

  const updateResume = (id: string, updates: Partial<Resume>) => {
    setResumes(prev => prev.map(resume => 
      resume.id === id 
        ? { ...resume, ...updates, updatedAt: new Date().toISOString() }
        : resume
    ));
  };

  const deleteResume = (id: string) => {
    setResumes(prev => prev.filter(resume => resume.id !== id));
  };

  const getResumeByJobId = (jobId: string) => {
    return resumes.find(resume => resume.jobId === jobId);
  };

  const addBaseResume = (baseResumeData: Omit<BaseResume, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBaseResume: BaseResume = {
      ...baseResumeData,
      id: `base-resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBaseResumes(prev => [...prev, newBaseResume]);
    return newBaseResume;
  };

  const updateBaseResume = (id: string, updates: Partial<BaseResume>) => {
    setBaseResumes(prev => prev.map(baseResume => 
      baseResume.id === id 
        ? { ...baseResume, ...updates, updatedAt: new Date().toISOString() }
        : baseResume
    ));
  };

  const deleteBaseResume = (id: string) => {
    setBaseResumes(prev => prev.filter(baseResume => baseResume.id !== id));
  };

  return {
    resumes,
    baseResumes,
    isLoading,
    addResume,
    addMultipleResumes,
    updateResume,
    deleteResume,
    getResumeByJobId,
    addBaseResume,
    updateBaseResume,
    deleteBaseResume,
  };
}