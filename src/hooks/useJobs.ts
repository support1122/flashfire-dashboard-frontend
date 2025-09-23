import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../services/api';

export const useJobs = (token: string, email: string, isOperations = false) => {
  return useQuery({
    queryKey: ['jobs', email, isOperations],
    queryFn: () => jobsApi.getAllJobs(token, email, isOperations),
    enabled: !!(email && (isOperations || token)), // For operations, only need email; for regular users, need both token and email
    staleTime: 2 * 60 * 1000, // 2 minutes for jobs data
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ token, jobData, userDetails }: { token: string; jobData: any; userDetails: any }) =>
      jobsApi.createJob(token, jobData, userDetails),
    onSuccess: (data, variables) => {
      // Invalidate jobs queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      token, 
      jobId, 
      jobData 
    }: { 
      token: string; 
      jobId: string; 
      jobData: any 
    }) => jobsApi.updateJob(token, jobId, jobData),
    onSuccess: (data, variables) => {
      // Invalidate jobs queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ token, jobId }: { token: string; jobId: string }) =>
      jobsApi.deleteJob(token, jobId),
    onSuccess: (data, variables) => {
      // Invalidate jobs queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useBulkImportJobs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ token, jobs }: { token: string; jobs: any[] }) =>
      jobsApi.bulkImportJobs(token, jobs),
    onSuccess: (data, variables) => {
      // Invalidate jobs queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};