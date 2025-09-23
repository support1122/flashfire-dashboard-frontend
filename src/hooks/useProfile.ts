import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/api';

export const useProfile = (token: string, email: string) => {
  return useQuery({
    queryKey: ['profile', email],
    queryFn: () => profileApi.getProfile(token, email),
    enabled: !!(token && email),
    staleTime: 10 * 60 * 1000, // 10 minutes for profile data
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ token, profileData }: { token: string; profileData: any }) =>
      profileApi.updateProfile(token, profileData),
    onSuccess: (data, variables) => {
      // Invalidate profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
      profileApi.uploadResume(token, formData),
    onSuccess: (data, variables) => {
      // Invalidate profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
