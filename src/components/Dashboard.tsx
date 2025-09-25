import {
    Briefcase,
    FileText,
    TrendingUp,
    Users,
    Target,
    CheckCircle,
    XCircle,
    Clock,
    Award,
} from "lucide-react";
import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserJobs } from "../state_management/UserJobs.tsx";
import { UserContext } from "../state_management/UserContext.js";
import { useUserProfile } from "../state_management/ProfileContext.tsx";
import LoadingScreen from "./LoadingScreen.tsx";
import { calculateDashboardStats } from "../utils/storage.ts";
import NewUserModal from "./NewUserModal.tsx";
import { useOperationsStore } from "../state_management/Operations.ts";
import ReferralModal from "./ReferralModal.tsx";
import ReferralButton from "./ReferralButton.tsx";
import { generateReferralIdentifier } from "../utils/generateUsername.ts";
import { useJobsSessionStore } from "../state_management/JobsSessionStore";

const Dashboard: React.FC = ({ setUserProfileFormVisibility, userProfileFormVisibility, welcomeShown,setWelcomeShown }) => {
    const context = useContext(UserContext);
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const { userProfile, isProfileComplete } = useUserProfile();

    if (!context) {
        console.error("UserContext is null");
        navigate("/login");
        return null;
    }
//     const [welcomeShown, setWelcomeShown] = useState(()=>{
//     return localStorage.getItem("welcomeShown")? true: false
//   });
    const { token, userDetails, setData } = context;
    const { userJobs, setUserJobs, loading } = useUserJobs();
    const [loadingDetails, setLoadingDetails] = useState(false);
    // const [showProfileModal, setShowProfileModal] = useState(false);
    const { role } = useOperationsStore();
    
    // Use session storage for analytics
    const { getDashboardStats, getJobsByStatus } = useJobsSessionStore();
    const dashboardStats = getDashboardStats();
    // Referral Modal State
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

    async function FetchAllJobs(localToken: string, localUserDetails: any) {
        if (role == "operations") {
            console.log("local storage email : ", localUserDetails.email);
            try {
                setLoadingDetails(true);
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
                setLoadingDetails(false);
                if (res.ok) {
                    setUserJobs(data?.allJobs);
                } else {
                    alert("something is really wrong");
                }
            } catch (error) {
                console.log("error while initial fetch data", error);
            }
        } else {
            try {
                setLoadingDetails(true);
                const res = await fetch(`${API_BASE_URL}/getalljobs`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localToken}`,
                    },
                    user: {email : localUserDetails.email},
                    body: JSON.stringify({ email: localUserDetails.email }),
                });
                const data = await res.json();
                if (res.ok) {
                    setUserJobs(data?.allJobs);
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
                                        context.token,
                                        context.userDetails
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
                }
            } catch (err) {
                console.error(err);
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

        // Check if profile is complete
        console.log("Dashboard - Profile completion check:", {
            userProfile: userProfile,
            isComplete: isProfileComplete(),
            hasProfile: !!userProfile,
        });

        // if (localStorage.getItem('showWelcome')) {
        //     console.log("Profile incomplete, showing modal");
        //     setShowProfileModal(true);
        // } else {
        //     console.log("Profile complete, hiding modal");
        //     setShowProfileModal(false);
        // }

        // Only fetch if we don't have fresh data in session storage
        if (userJobs.length === 0) {
            FetchAllJobs(token, userDetails);
        }
    }, [token, userDetails, isProfileComplete]);
    
    // Use session storage stats instead of calculating from userJobs
    const stats = dashboardStats;
    console.log("stats from session storage = ", stats);

    // Helper function to parse dates in various formats
    const parseCustomDate = (dateString: string): Date => {
        if (!dateString) return new Date(0);

        try {
            // Try to parse with standard Date constructor first
            const standardDate = new Date(dateString);
            if (!isNaN(standardDate.getTime())) {
                return standardDate;
            }

            // Handle format like "19/9/2025, 12:19:50 pm" or "5/9/2025, 2:16:09 am"
            const cleaned = dateString.replace(/,/g, "").trim();
            const parts = cleaned.split(" ");

            if (parts.length >= 2) {
                const datePart = parts[0]; // "19/9/2025" or "5/9/2025"
                const timePart = parts.slice(1).join(" "); // "12:19:50 pm"

                const [day, month, year] = datePart.split("/");
                if (day && month && year) {
                    const date = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day)
                    );

                    // Add time if available
                    if (timePart) {
                        const timeMatch = timePart.match(
                            /(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?/i
                        );
                        if (timeMatch) {
                            let hours = parseInt(timeMatch[1]);
                            const minutes = parseInt(timeMatch[2]);
                            const seconds = parseInt(timeMatch[3]);
                            const period = timeMatch[4]?.toLowerCase();

                            if (period === "pm" && hours !== 12) hours += 12;
                            if (period === "am" && hours === 12) hours = 0;

                            date.setHours(hours, minutes, seconds);
                        }
                    }

                    return date;
                }
            }

            // Try parsing as ISO string or other common formats
            const isoDate = new Date(dateString);
            if (!isNaN(isoDate.getTime())) {
                return isoDate;
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
                // Use updatedAt first, fallback to createdAt, then fallback to dateAdded
                const dateA = parseCustomDate(
                    a?.updatedAt || a?.createdAt || a?.dateAdded || ""
                );
                const dateB = parseCustomDate(
                    b?.updatedAt || b?.createdAt || b?.dateAdded || ""
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
    const responseRate =
        stats.total > 0
            ? Math.round(
                  ((stats.interviewing + stats.offer) / stats.total) * 100
              )
            : 0;
    // alert(successRate)

    if (loadingDetails) {
        return <LoadingScreen />;
    }
    return (
        <div className="min-h-screen bg-gray-50">
            
            {welcomeShown && (
          <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Welcome aboard, {context?.userDetails?.name?.split(' ')[0] || 'User'}! 🎉</h3>
            <p className="text-orange-100">
              Your profile has been successfully set up. You can now start tracking your job applications,
              managing your career pipeline, and leveraging AI-powered insights to optimize your job search strategy.
            </p>
            <button
            className="p-2 m-2 border rounded"
            onClick={()=>{
              localStorage.removeItem('welcomeShown');
              setWelcomeShown(false);
            }}
            >ok. got it!.</button>
          </div>
        )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to Your Career Dashboard
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Track your job applications, monitor your progress, and optimize your career journey with AI-powered insights.
                    </p>
                </div>

                {/* Referral Modal */}
                <ReferralModal
                    isOpen={isReferralModalOpen}
                    onClose={() => setIsReferralModalOpen(false)}
                    referralLink={generateReferralIdentifier(
                        userProfile?.firstName,
                        userProfile?.lastName
                    )}
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">395</h3>
                        <p className="text-gray-600 text-sm">Total Applications</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">2</h3>
                        <p className="text-gray-600 text-sm">Active Interviews</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="bg-orange-600 h-2 rounded-full w-1/4"></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
                        <p className="text-gray-600 text-sm">Offers Received</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="bg-green-600 h-2 rounded-full w-0"></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">0%</h3>
                        <p className="text-gray-600 text-sm">Success Rate</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="bg-purple-600 h-2 rounded-full w-0"></div>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">390</h3>
                                <p className="text-gray-600">Applications Sent</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">3</h3>
                                <p className="text-gray-600">Jobs Saved</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Application Pipeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Application Pipeline</h2>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Applied</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Screening</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                <Users className="w-8 h-8 text-orange-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Interview</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Offer</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Rejected</span>
                        </div>
                    </div>
                </div>

                {/* …inside your component… */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Activity
                    </h3>

                    <div className="space-y-3">
                        {/* Leasing Consultant - Deleted */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                                    <XCircle className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Leasing Consultant
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        thesciongroupllc
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">
                                Deleted
                            </span>
                        </div>

                        {/* Consultant, Marketing Compliance - Deleted */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                                    <XCircle className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Consultant, Marketing Compliance
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ACA Group
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">
                                Deleted
                            </span>
                        </div>

                        {/* Technology Advisory Consultant - Applied */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Technology Advisory Consultant
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        crowe
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">
                                Applied
                            </span>
                        </div>

                        {/* Kearney Senior Business Analyst - Deleted */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                                    <XCircle className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Kearney Senior Business Analyst, Strategic Operations (SOP) Make Tower
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        kearney
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">
                                Deleted
                            </span>
                        </div>

                        {/* Decision Analytics Associate Consultant - Interviewing */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-100">
                                    <Users className="w-4 h-4 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Decision Analytics Associate Consultant - Life Sciences
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ZS
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-yellow-600 font-medium">
                                Interviewing
                            </span>
                        </div>

                        {/* FS Insurance Management Consultant - Deleted */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                                    <XCircle className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        FS Insurance Management Consultant - Senior Associate
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        pwc
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">
                                Deleted
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
