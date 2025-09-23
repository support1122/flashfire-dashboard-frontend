const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Generic API error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'An error occurred',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, error);
  }
}

// Auth API functions
export const authApi = {
  login: (email: string, password: string) => {
    const endpoint = email.toLowerCase().includes("@flashfirehq")
      ? "/operations/login"
      : "/login";
    
    return apiRequest<any>(endpoint, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: (userData: any) => 
    apiRequest<any>("/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  googleOAuth: (token: string) =>
    apiRequest<any>("/googleOAuth", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

// Jobs API functions
export const jobsApi = {
  getAllJobs: (token: string, email: string, isOperations = false) => {
    const endpoint = isOperations ? "/operations/alljobs" : "/getalljobs";
    const headers = isOperations ? {} : { Authorization: `Bearer ${token}` };
    
    return apiRequest<any>(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ email }),
    });
  },

  createJob: (_token: string, jobData: any, userDetails: any) =>
    apiRequest<any>("/operations/jobs", {
      method: "POST",
      body: JSON.stringify({ jobDetails: jobData, userDetails }),
    }),

  updateJob: (token: string, jobId: string, jobData: any) =>
    apiRequest<any>(`/updatejob/${jobId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobData }),
    }),

  deleteJob: (token: string, jobId: string) =>
    apiRequest<any>(`/deletejob/${jobId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  bulkImportJobs: (token: string, jobs: any[]) =>
    apiRequest<any>("/bulkimportjobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobs }),
    }),
};

// Profile API functions
export const profileApi = {
  getProfile: (token: string, email: string) =>
    apiRequest<any>("/getprofile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    }),

  updateProfile: (token: string, profileData: any) =>
    apiRequest<any>("/updateprofile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    }),

  uploadResume: (token: string, formData: FormData) =>
    apiRequest<any>("/uploadresume", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }),
};

// Resume optimization API functions
export const resumeApi = {
  optimizeResume: (token: string, jobData: any, resumeData: any) =>
    apiRequest<any>("/optimizeresume", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobData, resumeData }),
    }),

  getResumeChanges: (token: string, jobId: string) =>
    apiRequest<any>(`/getresumechanges/${jobId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

// Operations API functions
export const operationsApi = {
  getUserDetails: (email: string) =>
    apiRequest<any>("/operations/getUserDetails", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  createJob: (jobDetails: any, userDetails: any) =>
    apiRequest<any>("/operations/jobs", {
      method: "POST",
      body: JSON.stringify({ jobDetails, userDetails }),
    }),

  updateJob: (jobData: any) =>
    apiRequest<any>("/operations/jobs", {
      method: "PUT",
      body: JSON.stringify(jobData),
    }),

  selectPlan: (planData: any) =>
    apiRequest<any>("/operations/plans/select", {
      method: "POST",
      body: JSON.stringify(planData),
    }),
};
