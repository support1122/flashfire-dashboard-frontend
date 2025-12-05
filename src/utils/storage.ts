import { Job, Resume, BaseResume, DashboardStats } from '../types';

const STORAGE_KEYS = {
  JOBS: 'career-portal-jobs',
  RESUMES: 'career-portal-resumes',
  BASE_RESUMES: 'career-portal-base-resumes',
};

// Helper function to get user-specific storage key
function getUserStorageKey(baseKey: string, userId?: string): string {
  return userId ? `${baseKey}-${userId}` : baseKey;
}

// Jobs
export function saveJobs(jobs: Job[], userId?: string): void {
  const key = getUserStorageKey(STORAGE_KEYS.JOBS, userId);
  localStorage.setItem(key, JSON.stringify(jobs));
}

export function loadJobs(userId?: string): Job[] {
  const key = getUserStorageKey(STORAGE_KEYS.JOBS, userId);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

// Resumes
export function saveResumes(resumes: Resume[], userId?: string): void {
  const key = getUserStorageKey(STORAGE_KEYS.RESUMES, userId);
  localStorage.setItem(key, JSON.stringify(resumes));
}

export function loadResumes(userId?: string): Resume[] {
  const key = getUserStorageKey(STORAGE_KEYS.RESUMES, userId);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

// Base Resumes
export function saveBaseResumes(baseResumes: BaseResume[], userId?: string): void {
  const key = getUserStorageKey(STORAGE_KEYS.BASE_RESUMES, userId);
  localStorage.setItem(key, JSON.stringify(baseResumes));
}

export function loadBaseResumes(userId?: string): BaseResume[] {
  const key = getUserStorageKey(STORAGE_KEYS.BASE_RESUMES, userId);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

// Dashboard Stats
export function calculateDashboardStats(jobs: Job[]): DashboardStats {
  return jobs.reduce((stats, job) => {
    stats.total++;
    stats[job.status]++;
    return stats;
  }, {
    total: 0,
    saved: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
    deleted: 0,
  });
}

// Export/Import functionality
export function exportData(userId?: string): string {
  const data = {
    jobs: loadJobs(userId),
    resumes: loadResumes(userId),
    baseResumes: loadBaseResumes(userId),
    exportDate: new Date().toISOString(),
    userId,
  };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonData: string, userId?: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    if (data.jobs) saveJobs(data.jobs, userId);
    if (data.resumes) saveResumes(data.resumes, userId);
    if (data.baseResumes) saveBaseResumes(data.baseResumes, userId);
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
}