// import { useState, useEffect } from 'react';
// import { Job, JobStatus } from '../types';
// import { saveJobs, loadJobs } from '../utils/storage';
// import { checkForDuplicateJob, DuplicateCheckResult } from '../utils/duplicateDetection';

// export function useJobs(userId?: string) {
//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const loadedJobs = loadJobs(userId);
//     setJobs(loadedJobs);
//     setIsLoading(false);
//   }, [userId]);

//   useEffect(() => {
//     if (!isLoading && userId) {
//       saveJobs(jobs, userId);
//     }
//   }, [jobs, isLoading, userId]);

//   const addJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; job?: Job; duplicateCheck: DuplicateCheckResult } => {
//     // Check for duplicates
//     const duplicateCheck = checkForDuplicateJob(jobData, jobs);
    
//     if (duplicateCheck.isDuplicate) {
//       return { success: false, duplicateCheck };
//     }

//     const newJob: Job = {
//       ...jobData,
//       id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       userId,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };
    
//     setJobs(prev => [...prev, newJob]);
//     return { success: true, job: newJob, duplicateCheck };
//   };

//   const addMultipleJobs = (newJobs: Job[]) => {
//     const jobsWithUserId = newJobs.map(job => ({ ...job, userId }));
//     setJobs(prev => [...prev, ...jobsWithUserId]);
//   };

//   const updateJob = (id: string, updates: Partial<Job>) => {
//     setJobs(prev => prev.map(job => 
//       job.id === id 
//         ? { ...job, ...updates, updatedAt: new Date().toISOString() }
//         : job
//     ));
//   };

//   const deleteJob = (id: string) => {
//     setJobs(prev => prev.filter(job => job.id !== id));
//   };

//   const updateJobStatus = (id: string, status: JobStatus) => {
//     updateJob(id, { status });
//   };

//   const getJobsByStatus = (status: JobStatus) => {
//     return jobs.filter(job => job.status === status);
//   };

//   const searchJobs = (query: string) => {
//     const lowerQuery = query.toLowerCase();
//     return jobs.filter(job => 
//       job.title.toLowerCase().includes(lowerQuery) ||
//       job.company.toLowerCase().includes(lowerQuery) ||
//       job.description.toLowerCase().includes(lowerQuery)
//     );
//   };

//   return {
//     jobs,
//     isLoading,
//     addJob,
//     addMultipleJobs,
//     updateJob,
//     deleteJob,
//     updateJobStatus,
//     getJobsByStatus,
//     searchJobs,
//   };
// }