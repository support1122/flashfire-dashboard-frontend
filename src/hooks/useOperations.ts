import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '../services/api';

export const useOperationsUserDetails = (email: string) => {
  return useQuery({
    queryKey: ['operations', 'userDetails', email],
    queryFn: () => operationsApi.getUserDetails(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes for user details
  });
};

export const useOperationsCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobDetails, userDetails }: { jobDetails: any; userDetails: any }) => 
      operationsApi.createJob(jobDetails, userDetails),
    onSuccess: (data, variables) => {
      // Invalidate jobs queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useOperationsUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobData: any) => operationsApi.updateJob(jobData),
    onSuccess: (data, variables) => {
      // Invalidate jobs queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useOperationsSelectPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (planData: any) => operationsApi.selectPlan(planData),
    onSuccess: (data, variables) => {
      // Invalidate user details to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['operations', 'userDetails'] });
    },
  });
};
