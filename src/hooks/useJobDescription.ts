import { useQuery } from '@tanstack/react-query';

// API function to fetch job description
const fetchJobDescription = async (jobId: string) => {
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
  return data;
};

// Hook for lazy loading job descriptions
export const useJobDescription = (jobId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['jobDescription', jobId],
    queryFn: () => fetchJobDescription(jobId!),
    enabled: !!(jobId && enabled), // Only fetch when jobId exists and enabled is true
    staleTime: Infinity, // Job descriptions don't change often, cache forever
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 2,
  });
};

// Hook for fetching multiple job descriptions at once (if needed)
export const useJobDescriptions = (jobIds: string[]) => {
  return useQuery({
    queryKey: ['jobDescriptions', jobIds],
    queryFn: async () => {
      const promises = jobIds.map(id => fetchJobDescription(id));
      const results = await Promise.all(promises);
      return results;
    },
    enabled: jobIds.length > 0,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
};
