import {
    Briefcase,
    FileText,
    TrendingUp,
    Users,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import React, { useEffect, useContext, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useUserJobs } from "../state_management/UserJobs.tsx";
import { UserContext } from "../state_management/UserContext.js";
import { useUserProfile } from "../state_management/ProfileContext.tsx";
import LoadingScreen from "./LoadingScreen.tsx";
import NewUserModal from "./NewUserModal.tsx";
import DashboardManagerDisplay from "./DashboardManagerDisplay.tsx";
import { useOperationsStore } from "../state_management/Operations.ts";
import { useJobsSessionStore } from "../state_management/JobsSessionStore.ts";

const JobForm = lazy(() => import("./JobForm.tsx"));

const Dashboard: React.FC = () => {
    const context = useContext(UserContext);
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const { userProfile } = useUserProfile();

    if (!context) {
        console.error("UserContext is null");
        navigate("/login");
        return null;
    }

    const { token, userDetails } = context;
    const { userJobs, setUserJobs } = useUserJobs();
    const [loadingDetails, setLoadingDetails] = useState(true); // Start with true to show loading initially
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showJobForm, setShowJobForm] = useState(false);
    const { role } = useOperationsStore();
    
    // Use session storage for analytics
    const { getDashboardStats } = useJobsSessionStore();
    const dashboardStats = getDashboardStats();
    

    async function FetchAllJobs(localToken: string, localUserDetails: any) {
        if (role == "operations") {
            console.log("local storage email : ", localUserDetails.email);
            try {
                setLoadingDetails(true);
                setIsInitialLoad(true);
                const res = await fetch(
                    `${API_BASE_URL}/operations/getalljobs`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localToken}`,
                        },
                        body: JSON.stringify({ email: localUserDetails.email }),
                    }
                );
                const data = await res.json();
                if (res.ok) {
                    setUserJobs(data?.allJobs || []);
                    setIsInitialLoad(false);
                } else {
                    alert("something is really wrong");
                    setIsInitialLoad(false);
                }
            } catch (error) {
                console.log("error while initial fetch data", error);
                setIsInitialLoad(false);
            } finally {
                setLoadingDetails(false);
            }
        } else {
            try {
                setLoadingDetails(true);
                setIsInitialLoad(true);
                const res = await fetch(`${API_BASE_URL}/getalljobs`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localToken}`,
                    },
                    body: JSON.stringify({ email: localUserDetails.email }),
                });
                const data = await res.json();
                if (res.ok) {
                    setUserJobs(data?.allJobs || []);
                    setIsInitialLoad(false);
                } else if (
                    data.message === "invalid token please login again" ||
                    data.message === "Invalid token or expired"
                ) {
                    console.log("Token invalid, attempting refresh...");

                    // Try to refresh token
                    if (context?.refreshToken) {
                        const refreshSuccess = await context.refreshToken();
                        if (refreshSuccess) {
                            // Retry the request with new token
                            console.log(
                                "Token refreshed, retrying job fetch..."
                            );
                            setTimeout(
                                () =>
                                    FetchAllJobs(
                                        context?.token!,
                                        context?.userDetails!
                                    ),
                                100
                            );
                            return;
                        }
                    }

                    console.log(
                        "Token refresh failed, clearing storage and redirecting to login"
                    );
                    localStorage.clear();
                    navigate("/login");
                    setIsInitialLoad(false);
                } else {
                    setIsInitialLoad(false);
                }
            } catch (err) {
                console.error(err);
                setIsInitialLoad(false);
            } finally {
                setLoadingDetails(false);
            }
        }
    }

    useEffect(() => {
        if (!token || !userDetails) {
            navigate("/login");
            return;
        }

        const hasProfileValue = sessionStorage.getItem('hasProfile');
        
        if (hasProfileValue === 'false') {
            console.log("No profile - showing modal");
            setShowProfileModal(true);
        } else {
            console.log("Has profile or not checked - not showing modal");
            setShowProfileModal(false);
        }

        // Always fetch fresh data on mount/refresh to ensure we have latest data
        // This prevents showing stale cached data from sessionStorage
        setIsInitialLoad(true);
        FetchAllJobs(token, userDetails);
    }, [token, userDetails]);
    
    // Calculate stats directly from userJobs to avoid stale sessionStorage data
    const calculateStatsFromJobs = (jobs: typeof userJobs) => {
        const safeJobs = Array.isArray(jobs) ? jobs : [];
        return safeJobs.reduce((stats, job) => {
            const status = job?.currentStatus?.toLowerCase() || '';
            stats.total++;
            
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
    };

    // Calculate stats from current userJobs (not from sessionStorage to avoid stale data)
    // Only calculate after initial load completes to prevent showing stale values
    const stats = isInitialLoad ? {
        total: 0,
        saved: 0,
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
        deleted: 0,
    } : calculateStatsFromJobs(userJobs);
    
    console.log("stats calculated from userJobs = ", stats);

    // Helper function to parse dates in various formats
    const parseCustomDate = (dateString: string): Date => {
        if (!dateString) return new Date(0);

        try {
            // Try ISO format first
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateString)) {
                const iso = new Date(dateString);
                if (!isNaN(iso.getTime())) {
                    return iso;
                }
            }

            // Handle format: "MM/DD/YYYY, h:mm:ss am/pm" (dateAdded) or "DD/MM/YYYY, h:mm:ss am/pm" (createdAt)
            const parts = dateString.trim().split(",");
            if (parts.length === 2) {
                const datePart = parts[0].trim();
                const timePart = parts[1].trim();

                const dateNumbers = datePart.split("/").map((p) => parseInt(p.trim()));
                
                if (dateNumbers.length === 3) {
                    let dd, mm, yyyy;
                    
                    // Detect format: if first number > 12, it's DD/MM/YYYY (createdAt)
                    // Otherwise, assume MM/DD/YYYY (US format) for dateAdded
                    if (dateNumbers[0] > 12) {
                        // DD/MM/YYYY format (createdAt)
                        dd = dateNumbers[0];
                        mm = dateNumbers[1];
                        yyyy = dateNumbers[2];
                    } else {
                        // MM/DD/YYYY format (dateAdded)
                        mm = dateNumbers[0];
                        dd = dateNumbers[1];
                        yyyy = dateNumbers[2];
                    }
                    
                    if (dd && mm && yyyy) {
                        // Handle 2-digit years
                        if (yyyy < 100) yyyy += 2000;

                        const date = new Date(yyyy, mm - 1, dd);

                        // Parse time with AM/PM
                        const timeMatch = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)/i);
                        if (timeMatch) {
                            let hours = parseInt(timeMatch[1]);
                            const minutes = parseInt(timeMatch[2]);
                            const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
                            const period = timeMatch[4]?.toLowerCase();

                            if (period === "pm" && hours !== 12) hours += 12;
                            if (period === "am" && hours === 12) hours = 0;

                            date.setHours(hours, minutes, seconds);
                        }

                        return date;
                    }
                }
            }

            // Fallback: try native Date parse (handles US format, etc.)
            const native = new Date(dateString);
            if (!isNaN(native.getTime())) {
                return native;
            }
        } catch (error) {
            console.warn("Failed to parse date:", dateString, error);
        }

        // Final fallback - return epoch time to sort at the end
        return new Date(0);
    };

    // Remove duplicates based on jobID and filter valid jobs
    const uniqueJobs =
        userJobs?.filter(
            (job, index, self) =>
                job &&
                job.updatedAt &&
                job.jobID &&
                self.findIndex((j) => j.jobID === job.jobID) === index
        ) || [];

    console.log("Total unique jobs:", uniqueJobs.length);
    console.log(
        "All jobs with updatedAt:",
        uniqueJobs.map((job) => ({
            jobID: job.jobID,
            title: job.jobTitle,
            company: job.companyName,
            updatedAt: job.updatedAt,
            parsedDate: parseCustomDate(job.updatedAt),
        }))
    );

    const recentJobs =
        uniqueJobs
            ?.sort((a, b) => {
                // This matches the JobTracker sorting logic for consistency
                const dateA = parseCustomDate(
                    a?.dateAdded || a?.createdAt || ""
                );
                const dateB = parseCustomDate(
                    b?.dateAdded || b?.createdAt || ""
                );
                return dateB.getTime() - dateA.getTime();
            })
            ?.slice(0, 6) || [];

    console.log(
        "RecentAllJOBS META DATA",
        recentJobs.map((job) => ({
            jobID: job.jobID,
            title: job.jobTitle,
            company: job.companyName,
            updatedAt: job.updatedAt,
            status: job.currentStatus,
            parsedDate: parseCustomDate(job.updatedAt),
        }))
    );

    // Force re-calculation when userJobs changes
    useEffect(() => {
        // This effect ensures the component re-renders when userJobs changes
        console.log("userJobs updated, recalculating recent jobs");
    }, [userJobs]);
    const successRate =
        stats.total > 0 ? Math.round((stats.offer / stats.total) * 100) : 0;
    // alert(successRate)

    // Show loading screen while fetching initial data to prevent showing stale cached data
    if (loadingDetails || isInitialLoad) {
        return <LoadingScreen />;
    }
    return (
    <div className="relative min-h-dvh text-zinc-900 overflow-x-hidden">
      {/* NewUserModal */}
      {showProfileModal && (
        <NewUserModal
          setUserProfileFormVisibility={setShowProfileModal}
          mode="create"
          startSection="personal"
          onProfileComplete={() => {
            console.log("Profile completed - closing modal and updating sessionStorage");
            // Set sessionStorage to indicate profile exists now
            sessionStorage.setItem('hasProfile', 'true');
            // Close modal
            setShowProfileModal(false);
          }}
        />
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <Suspense fallback={<LoadingScreen />}>
          <JobForm
            job={null}
            onCancel={() => setShowJobForm(false)}
            onSuccess={() => {
              setShowJobForm(false);
              if (context?.token && context?.userDetails) {
                FetchAllJobs(context?.token, context?.userDetails);
              }
            }}
            setUserJobs={setUserJobs}
          />
        </Suspense>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex-1 border-l-4 border-orange-600 pl-4 md:pl-6 py-2">
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15]">
                <span className="text-zinc-900">Welcome to Your</span>{" "}
                <span className="inline-block bg-gradient-to-r from-[#FF5722] to-[#FF6B00] bg-clip-text text-transparent">
                  Career Dashboard
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl">
                Every role tracked. Every milestone celebrated. Your journey to success starts here.
              </p>
            </div>

            {/* Dashboard Manager Display */}
            <div className="w-full md:w-auto">
              <DashboardManagerDisplay />
            </div>
          </div>
        </div>

        {/* Zero jobs hint */}
        {uniqueJobs.length === 0 && (
          <div className="mb-8 rounded-xl border border-dashed border-gray-300 bg-white p-5 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">You have no jobs yet</h3>
            <p className="text-gray-600 mb-4">
              Start by adding your first job application to kick off tracking and insights.
            </p>
            <button
              onClick={() => setShowJobForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Add Your First Job
            </button>
          </div>
        )}

        {/* Stats Cards (same visuals; stack on mobile, 2-col on md, 4-col on lg) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-8">
          {/* Total Applications */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.total}
            </h3>
            <p className="text-gray-600 text-sm">Total Applications</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (stats.total / 50) * 100)}%` }}
              />
            </div>
          </div>

          {/* Active Interviews */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.interviewing}</h3>
            <p className="text-gray-600 text-sm">Active Interviews</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (stats.interviewing / 10) * 100)}%` }}
              />
            </div>
          </div>

          {/* Offers Received */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.offer}
            </h3>
            <p className="text-gray-600 text-sm">Offers Received</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (stats.offer / 5) * 100)}%` }}
              />
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{successRate}%</h3>
            <p className="text-gray-600 text-sm">Success Rate</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Secondary Stats (unchanged visuals; responsive spacing) */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.applied}</h3>
                <p className="text-gray-600">Applications Sent</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {userJobs?.filter((item) =>
                    item.currentStatus?.toLowerCase().startsWith("saved")
                  ).length}
                </h3>
                <p className="text-gray-600">Jobs Saved</p>
              </div>
            </div>
          </div>
        </div> */}

        {/* Application Pipeline (full-page vertical scroll; stacks on mobile) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Application Pipeline</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Saved */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-600">Saved</span>
              <span className="text-lg font-bold text-gray-900">
                {stats.saved}
              </span>
            </div>

            {/* Applied */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Applied</span>
              <span className="text-lg font-bold text-gray-900">{stats.applied}</span>
            </div>

            {/* Interview */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Interview</span>
              <span className="text-lg font-bold text-gray-900">{stats.interviewing}</span>
            </div>

            {/* Offer */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Offer</span>
              <span className="text-lg font-bold text-gray-900">{stats.offer}</span>
            </div>

            {/* Rejected */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Rejected</span>
              <span className="text-lg font-bold text-gray-900">{stats.rejected}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentJobs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentJobs?.map((job) => {
                const key = (job.currentStatus || "saved").toLowerCase().split(" ")[0];

                const statusConfig: Record<
                  string,
                  {
                    color: string;
                    icon: React.ComponentType<any>;
                    label: string;
                    bgColor: string;
                    textColor: string;
                  }
                > = {
                  saved: {
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-600",
                    icon: Clock,
                    label: "Saved",
                  },
                  applied: {
                    color: "bg-blue-100 text-blue-700 border-blue-200",
                    bgColor: "bg-blue-100",
                    textColor: "text-blue-800",
                    icon: FileText,
                    label: "Applied",
                  },
                  interviewing: {
                    color: "bg-amber-100 text-amber-700 border-amber-200",
                    bgColor: "bg-yellow-100",
                    textColor: "text-yellow-800",
                    icon: Users,
                    label: "Interviewing",
                  },
                  offer: {
                    color: "bg-green-100 text-green-700 border-green-200",
                    bgColor: "bg-green-100",
                    textColor: "text-green-800",
                    icon: CheckCircle,
                    label: "Offer",
                  },
                  rejected: {
                    color: "bg-red-100 text-red-700 border-red-200",
                    bgColor: "bg-red-100",
                    textColor: "text-red-800",
                    icon: XCircle,
                    label: "Rejected",
                  },
                  deleted: {
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-600",
                    icon: XCircle,
                    label: "Deleted",
                  },
                };

                const config = statusConfig[key] || statusConfig.saved;
                const Icon = config.icon;

                return (
                  <div key={job.jobID} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{job.jobTitle}</p>
                      <p className="text-sm text-gray-500">{job.companyName}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
                      >
                        {job.currentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Welcome Message - (original condition kept) */}
        {uniqueJobs.length === 0 && (
          <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 md:p-6 text-white">
            <h3 className="text-lg md:text-xl font-bold mb-2">
              Welcome aboard, {userProfile?.firstName || context?.userDetails?.name?.split(" ")?.[0] || "User"}! 🎉
            </h3>
            <p className="text-orange-100">
              Our team will now begin working on your resume, and we'll share a draft here for your review once it's ready. It usually takes
              around 2-3 days to create a resume from scratch.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
