import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Job, JobStatus } from '../types';

// Custom storage wrapper that handles quota errors gracefully
const createSafeStorage = (): StateStorage => {
  const storage = sessionStorage;
  
  return {
    getItem: (name: string): string | null => {
      try {
        return storage.getItem(name);
      } catch (error) {
        console.warn('Error reading from storage:', error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        storage.setItem(name, value);
      } catch (error: any) {
        if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
          console.warn('⚠️ Storage quota exceeded - attempting to reduce data size');
          try {
           const data = JSON.parse(value);
            
            if (data?.state?.jobs && Array.isArray(data.state.jobs)) {
              const limitedJobs = data.state.jobs.slice(0, 100);
              const reducedData = {
                ...data,
                state: {
                  ...data.state,
                  jobs: limitedJobs,
                },
              };
              storage.setItem(name, JSON.stringify(reducedData));
              console.log('✅ Reduced jobs data size and saved successfully');
            } else {
              storage.removeItem(name);
              const minimalData = {
                state: {
                  jobs: [],
                  lastFetched: data?.state?.lastFetched || Date.now(),
                  userEmail: data?.state?.userEmail || null,
                },
                version: data?.version || 0,
              };
              storage.setItem(name, JSON.stringify(minimalData));
              console.log('✅ Saved minimal data after quota error');
            }
          } catch (retryError) {
            console.error('❌ Failed to save to storage even after reducing size:', retryError);

          }
        } else {
          // Re-throw non-quota errors
          throw error;
        }
      }
    },
    removeItem: (name: string): void => {
      try {
        storage.removeItem(name);
      } catch (error) {
        console.warn('Error removing from storage:', error);
      }
    },
  };
};

interface JobsSessionState {
  jobs: Job[];
  loading: boolean;
  lastFetched: number | null;
  userEmail: string | null;
  updatingJobs: Set<string>; // Track jobs being updated
  pendingUpdates: Map<string, { originalStatus: JobStatus; newStatus: JobStatus }>; // Track pending status changes
  loadingDescriptions: Set<string>; // Track jobs loading descriptions
  jobDescriptions: Map<string, string>; // Cache job descriptions
  
  // Actions
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  refreshJobById: (jobId: string) => Promise<void>;
  refreshJobByMongoId: (mongoId: string) => Promise<void>;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  deleteJob: (jobId: string) => void;
  setLoading: (loading: boolean) => void;
  setUserEmail: (email: string) => void;
  clearJobs: () => void;
  setJobUpdating: (jobId: string, isUpdating: boolean) => void;
  setPendingUpdate: (jobId: string, originalStatus: JobStatus, newStatus: JobStatus) => void;
  clearPendingUpdate: (jobId: string) => void;
  setJobDescriptionLoading: (jobId: string, isLoading: boolean) => void;
  setJobDescription: (jobId: string, description: string) => void;
  getJobDescription: (jobId: string) => string | null;
  isJobDescriptionLoading: (jobId: string) => boolean;
  
  // Computed values
  getJobsByStatus: (status: JobStatus) => Job[];
  getDashboardStats: () => {
    total: number;
    saved: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected: number;
    deleted: number;
  };
}

// Helper function to check if data is stale (older than 5 minutes)
const isDataStale = (lastFetched: number | null): boolean => {
  if (!lastFetched) return true;
  const fiveMinutes = 1000;
  return Date.now() - lastFetched > fiveMinutes;
};

export const useJobsSessionStore = create<JobsSessionState>()(
  persist(
    (set, get) => ({
      jobs: [],
      loading: false,
      lastFetched: null,
      userEmail: null,
      updatingJobs: new Set<string>(),
      pendingUpdates: new Map<string, { originalStatus: JobStatus; newStatus: JobStatus }>(),
      loadingDescriptions: new Set<string>(),
      jobDescriptions: new Map<string, string>(),

      setJobs: (jobs) => set({ 
        jobs: Array.isArray(jobs) ? jobs : [], 
        lastFetched: Date.now(),
        loading: false 
      }),

      addJob: (job) => set((state) => ({
        jobs: [...state.jobs, job]
      })),

      updateJob: (jobId, updates) => set((state) => ({
        jobs: state.jobs.map(job => 
          job.jobID === jobId 
            ? { ...job, ...updates, updatedAt: new Date().toISOString() }
            : job
        )
      })),

      // Fetch latest job from backend and update only that job in session store
      refreshJobById: async (jobId: string) => {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
          if (!API_BASE) return;
          const res = await fetch(`${API_BASE}/getJobDescription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: jobId })
          });
          if (!res.ok) return;
          const data = await res.json();
          set((state) => ({
            jobs: state.jobs.map((job) =>
              job.jobID === jobId
                ? {
                    ...job,
                    jobDescription: data.jobDescription || job.jobDescription,
                    updatedAt: new Date().toISOString(),
                  }
                : job
            ),
          }));
        } catch {}
      },

      // Fetch latest job from backend by MongoDB _id or jobID and update in session store
      refreshJobByMongoId: async (mongoId: string) => {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
          if (!API_BASE) {
            console.error('API_BASE is not defined in environment variables');
            return;
          }
          
          console.log(`[refreshJobByMongoId] Fetching job with ID: ${mongoId} from ${API_BASE}/getJobById`);
          
          const res = await fetch(`${API_BASE}/getJobById`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: mongoId })
          });
          
          console.log(`[refreshJobByMongoId] Response status: ${res.status}`);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`[refreshJobByMongoId] Failed to fetch job: ${errorText}`);
            return;
          }
          
          const data = await res.json();
          console.log('[refreshJobByMongoId] Response data:', data);
          
          if (!data.success || !data.job) {
            console.error('[refreshJobByMongoId] Invalid response structure:', data);
            return;
          }
          
          const updatedJob = data.job;
          console.log('[refreshJobByMongoId] Updated job data:', updatedJob);
          
          // Update the job in session storage - match by either _id or jobID
          set((state) => {
            const jobIndex = state.jobs.findIndex((job) => 
              job._id === mongoId || job.jobID === mongoId
            );
            console.log(`[refreshJobByMongoId] Found job at index: ${jobIndex}`);
            
            return {
              jobs: state.jobs.map((job) =>
                (job._id === mongoId || job.jobID === mongoId)
                  ? {
                      ...job,
                      ...updatedJob,
                      _id: updatedJob._id,
                      jobID: updatedJob.jobID,
                      dateAdded: updatedJob.dateAdded,
                      userID: updatedJob.userID,
                      jobTitle: updatedJob.jobTitle,
                      currentStatus: updatedJob.currentStatus,
                      jobDescription: updatedJob.jobDescription,
                      joblink: updatedJob.joblink,
                      companyName: updatedJob.companyName,
                      timeline: updatedJob.timeline,
                      createdAt: updatedJob.createdAt,
                      updatedAt: updatedJob.updatedAt,
                      attachments: updatedJob.attachments,
                      changesMade: updatedJob.changesMade,
                      operatorName: updatedJob.operatorName,
                      operatorEmail: updatedJob.operatorEmail,
                      appliedDate: updatedJob.appliedDate
                    }
                  : job
              ),
            };
          });
          
          console.log('[refreshJobByMongoId] Session storage updated successfully');
        } catch (error) {
          console.error('[refreshJobByMongoId] Error refreshing job by MongoDB ID:', error);
        }
      },

      updateJobStatus: (jobId, status) => set((state) => ({
        jobs: state.jobs.map(job => 
          job.jobID === jobId 
            ? { ...job, currentStatus: status, updatedAt: new Date().toISOString() }
            : job
        )
      })),

      deleteJob: (jobId) => set((state) => ({
        jobs: state.jobs.filter(job => job.jobID !== jobId)
      })),

      setLoading: (loading) => set({ loading }),

      setUserEmail: (email) => set({ userEmail: email }),

      clearJobs: () => set({ 
        jobs: [], 
        lastFetched: null, 
        userEmail: null,
        updatingJobs: new Set<string>(),
        pendingUpdates: new Map<string, { originalStatus: JobStatus; newStatus: JobStatus }>(),
        loadingDescriptions: new Set<string>(),
        jobDescriptions: new Map<string, string>()
      }),

      setJobUpdating: (jobId, isUpdating) => set((state) => {
        const newUpdatingJobs = new Set(state.updatingJobs);
        if (isUpdating) {
          newUpdatingJobs.add(jobId);
        } else {
          newUpdatingJobs.delete(jobId);
        }
        return { updatingJobs: newUpdatingJobs };
      }),

      setPendingUpdate: (jobId, originalStatus, newStatus) => set((state) => {
        const newPendingUpdates = new Map(state.pendingUpdates);
        newPendingUpdates.set(jobId, { originalStatus, newStatus });
        return { pendingUpdates: newPendingUpdates };
      }),

      clearPendingUpdate: (jobId) => set((state) => {
        const newPendingUpdates = new Map(state.pendingUpdates);
        newPendingUpdates.delete(jobId);
        return { pendingUpdates: newPendingUpdates };
      }),

      setJobDescriptionLoading: (jobId, isLoading) => set((state) => {
        const newLoadingDescriptions = new Set(state.loadingDescriptions);
        if (isLoading) {
          newLoadingDescriptions.add(jobId);
        } else {
          newLoadingDescriptions.delete(jobId);
        }
        return { loadingDescriptions: newLoadingDescriptions };
      }),

      setJobDescription: (jobId, description) => set((state) => {
        const newJobDescriptions = new Map(state.jobDescriptions);
        newJobDescriptions.set(jobId, description);
        return { jobDescriptions: newJobDescriptions };
      }),

      getJobDescription: (jobId) => {
        const { jobDescriptions } = get();
        return jobDescriptions.get(jobId) || null;
      },

      isJobDescriptionLoading: (jobId) => {
        const { loadingDescriptions } = get();
        return loadingDescriptions.has(jobId);
      },

      getJobsByStatus: (status) => {
        const { jobs, pendingUpdates } = get();
        const safeJobs = Array.isArray(jobs) ? jobs : [];
        
        return safeJobs.filter(job => {
          const pendingUpdate = pendingUpdates.get(job.jobID);
          if (pendingUpdate) {
            // If job has a pending update, show it in the target status
            return pendingUpdate.newStatus === status;
          }
          // Otherwise, use the current status - check if it starts with the status
          return job.currentStatus?.toLowerCase().startsWith(status.toLowerCase());
        });
      },

      getDashboardStats: () => {
        const { jobs } = get();
        const safeJobs = Array.isArray(jobs) ? jobs : [];
        return safeJobs.reduce((stats, job) => {
          stats.total++;
          const status = job.currentStatus?.toLowerCase() || '';
          
          // Check if status starts with each category
          if (status.startsWith('saved')) {
            stats.saved++;
          } else if (status.startsWith('applied')) {
            stats.applied++;
          } else if (status.startsWith('interviewing')) {
            stats.interviewing++;
          } else if (status.startsWith('offer')) {
            stats.offer++;
          } else if (status.startsWith('rejected')) {
            stats.rejected++;
          } else if (status.startsWith('deleted')) {
            stats.deleted++;
          }
          
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
      },
    }),
    {
      name: 'jobs-session-storage',
      storage: createJSONStorage(() => createSafeStorage()),
      // Only persist jobs, loading, lastFetched, and userEmail
      // Don't persist updatingJobs as it's temporary state
      partialize: (state) => {
        const jobsToStore = Array.isArray(state.jobs) 
          ? state.jobs.slice(0, 100) 
          : [];
        
        return {
          jobs: jobsToStore,
          lastFetched: state.lastFetched,
          userEmail: state.userEmail,
        };
      },
    }
  )
);

// Helper hook to check if we need to fetch fresh data
export const useShouldFetchJobs = (userEmail: string | null) => {
  const { jobs, lastFetched, userEmail: storedEmail } = useJobsSessionStore();
  
  // If no user email, we need to fetch
  if (!userEmail) return true;
  
  // If different user, we need to fetch
  if (storedEmail !== userEmail) return true;
  
  // If no jobs and no lastFetched, we need to fetch
  if (jobs.length === 0 && !lastFetched) return true;
  
  // If data is stale, we need to fetch
  if (isDataStale(lastFetched)) return true;
  
  return false;
};

// Helper hook for optimistic updates
export const useOptimisticJobUpdate = () => {
  const { updateJob, updateJobStatus } = useJobsSessionStore();
  
  const optimisticUpdate = (jobId: string, updates: Partial<Job>) => {
    updateJob(jobId, updates);
  };
  
  const optimisticStatusUpdate = (jobId: string, status: JobStatus) => {
    updateJobStatus(jobId, status);
  };
  
  return { optimisticUpdate, optimisticStatusUpdate };
};

// Helper function to clear session storage on logout
export const clearJobsSessionStorage = () => {
  sessionStorage.removeItem('jobs-session-storage');
};

// Hook for lazy loading job descriptions
export const useJobDescriptionLoader = () => {
  const { 
    getJobDescription, 
    setJobDescription, 
    setJobDescriptionLoading, 
    isJobDescriptionLoading 
  } = useJobsSessionStore();

  const loadJobDescription = async (jobId: string) => {
    // Check if already cached
    const cachedDescription = getJobDescription(jobId);
    if (cachedDescription) {
      return cachedDescription;
    }

    // Check if already loading
    if (isJobDescriptionLoading(jobId)) {
      return null;
    }

    // Start loading
    setJobDescriptionLoading(jobId, true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/getJobDescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: jobId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job description');
      }

      const data = await response.json();
      const description = data.jobDescription || '';

      // Cache the description
      setJobDescription(jobId, description);
      return description;
    } catch (error) {
      console.error('Error loading job description:', error);
      return null;
    } finally {
      setJobDescriptionLoading(jobId, false);
    }
  };

  return {
    loadJobDescription,
    getJobDescription,
    isJobDescriptionLoading,
  };
};
