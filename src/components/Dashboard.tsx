"use client"

import { Briefcase, FileText, TrendingUp, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import type React from "react"
import { useEffect, useContext, useState, Suspense, lazy } from "react"
import { useNavigate } from "react-router-dom"
import { useUserJobs } from "../state_management/UserJobs.tsx"
import { UserContext } from "../state_management/UserContext.js"
import { useUserProfile } from "../state_management/ProfileContext.tsx"
import LoadingScreen from "./LoadingScreen.tsx"
import NewUserModal from "./NewUserModal.tsx"
import DashboardManagerDisplay from "./DashboardManagerDisplay.tsx"
import { useOperationsStore } from "../state_management/Operations.ts"
import { useJobsSessionStore } from "../state_management/JobsSessionStore"

const JobForm = lazy(() => import("./JobForm"))

const Dashboard: React.FC = () => {
    const context = useContext(UserContext)
    const navigate = useNavigate()
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const { userProfile, isProfileComplete } = useUserProfile()
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    const [showJobForm, setShowJobForm] = useState(false)
    const { role } = useOperationsStore()
    const { userJobs, setUserJobs } = useUserJobs()

    // Use session storage for analytics
    const { getDashboardStats } = useJobsSessionStore()
    const dashboardStats = getDashboardStats()

    async function FetchAllJobs(localToken: string, localUserDetails: any) {
        if (role == "operations") {
            console.log("local storage email : ", localUserDetails.email)
            try {
                setLoadingDetails(true)
                const res = await fetch(`${API_BASE_URL}/operations/getalljobs`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localToken}`,
                    },
                    body: JSON.stringify({ email: localUserDetails.email }),
                })
                const data = await res.json()
                setLoadingDetails(false)
                if (res.ok) {
                    setUserJobs(data?.allJobs)
                } else {
                    alert("something is really wrong")
                }
            } catch (error) {
                console.log("error while initial fetch data", error)
            }
        } else {
            try {
                setLoadingDetails(true)
                const res = await fetch(`${API_BASE_URL}/getalljobs`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localToken}`,
                    },
                    body: JSON.stringify({ email: localUserDetails.email }),
                })
                const data = await res.json()
                if (res.ok) {
                    setUserJobs(data?.allJobs)
                } else if (data.message === "invalid token please login again" || data.message === "Invalid token or expired") {
                    console.log("Token invalid, attempting refresh...")

                    // Try to refresh token
                    if (context?.refreshToken) {
                        const refreshSuccess = await context.refreshToken()
                        if (refreshSuccess) {
                            // Retry the request with new token
                            console.log("Token refreshed, retrying job fetch...")
                            setTimeout(() => FetchAllJobs(context.token!, context.userDetails!), 100)
                            return
                        }
                    }

                    console.log("Token refresh failed, clearing storage and redirecting to login")
                    localStorage.clear()
                    navigate("/login")
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingDetails(false)
            }
        }
    }

    useEffect(() => {
        if (!context) {
            console.error("UserContext is null")
            navigate("/login")
            return
        }

        const { token, userDetails } = context

        // Show welcome only on first login
        const welcomeFlag = localStorage.getItem("welcomeShown")
        if (!welcomeFlag) {
            // first time – show the message and set the flag
            setShowWelcome(true)
            localStorage.setItem("welcomeShown", "true")
        } else {
            // not first time – don't show
            setShowWelcome(false)
        }

        // Check if profile is complete
        console.log("Dashboard - Profile completion check:", {
            userProfile: userProfile,
            isComplete: isProfileComplete(),
            hasProfile: !!userProfile,
        })

        if (!isProfileComplete()) {
            console.log("Profile incomplete, showing modal")
            setShowProfileModal(true)
        } else {
            console.log("Profile complete, hiding modal")
            setShowProfileModal(false)
        }

        // Only fetch if we don't have fresh data in session storage
        if (userJobs.length === 0) {
            FetchAllJobs(token, userDetails)
        }
    }, [context, userJobs, isProfileComplete])

    // Use session storage stats instead of calculating from userJobs
    const stats = dashboardStats
    console.log("stats from session storage = ", stats)

    // Helper function to parse dates in various formats
    const parseCustomDate = (dateString: string): Date => {
        if (!dateString) return new Date(0)

        try {
            // Try to parse with standard Date constructor first
            const standardDate = new Date(dateString)
            if (!isNaN(standardDate.getTime())) {
                return standardDate
            }

            // Handle format like "19/9/2025, 12:19:50 pm" or "5/9/2025, 2:16:09 am"
            const cleaned = dateString.replace(/,/g, "").trim()
            const parts = cleaned.split(" ")

            if (parts.length >= 2) {
                const datePart = parts[0] // "19/9/2025" or "5/9/2025"
                const timePart = parts.slice(1).join(" ") // "12:19:50 pm"

                const [day, month, year] = datePart.split("/")
                if (day && month && year) {
                    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

                    // Add time if available
                    if (timePart) {
                        const timeMatch = timePart.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?/i)
                        if (timeMatch) {
                            let hours = Number.parseInt(timeMatch[1])
                            const minutes = Number.parseInt(timeMatch[2])
                            const seconds = Number.parseInt(timeMatch[3])
                            const period = timeMatch[4]?.toLowerCase()

                            if (period === "pm" && hours !== 12) hours += 12
                            if (period === "am" && hours === 12) hours = 0

                            date.setHours(hours, minutes, seconds)
                        }
                    }

                    return date
                }
            }

            // Try parsing as ISO string or other common formats
            const isoDate = new Date(dateString)
            if (!isNaN(isoDate.getTime())) {
                return isoDate
            }
        } catch (error) {
            console.warn("Failed to parse date:", dateString, error)
        }

        // Final fallback - return epoch time to sort at the end
        return new Date(0)
    }

    // Remove duplicates based on jobID and filter valid jobs
    const uniqueJobs =
        userJobs?.filter(
            (job, index, self) => job && job.updatedAt && job.jobID && self.findIndex((j) => j.jobID === job.jobID) === index,
        ) || []

    console.log("Total unique jobs:", uniqueJobs.length)
    console.log(
        "All jobs with updatedAt:",
        uniqueJobs.map((job) => ({
            jobID: job.jobID,
            title: job.jobTitle,
            company: job.companyName,
            updatedAt: job.updatedAt,
            parsedDate: parseCustomDate(job.updatedAt),
        })),
    )

    const recentJobs =
        uniqueJobs
            ?.sort((a, b) => {
                // Use updatedAt first, fallback to createdAt, then fallback to dateAdded
                const dateA = parseCustomDate(a?.updatedAt || a?.createdAt || a?.dateAdded || "")
                const dateB = parseCustomDate(b?.updatedAt || b?.createdAt || b?.dateAdded || "")
                return dateB.getTime() - dateA.getTime()
            })
            ?.slice(0, 6) || []

    console.log(
        "RecentAllJOBS META DATA",
        recentJobs.map((job) => ({
            jobID: job.jobID,
            title: job.jobTitle,
            company: job.companyName,
            updatedAt: job.updatedAt,
            status: job.currentStatus,
            parsedDate: parseCustomDate(job.updatedAt),
        })),
    )

    // Force re-calculation when userJobs changes
    useEffect(() => {
        // This effect ensures the component re-renders when userJobs changes
        console.log("userJobs updated, recalculating recent jobs")
    }, [userJobs])
    const successRate = stats.total > 0 ? Math.round((stats.offer / stats.total) * 100) : 0
    // alert(successRate)

    if (loadingDetails) {
        return <LoadingScreen />
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-3xl"></div>
            </div>

            {/* NewUserModal */}
            {showProfileModal && (
                <NewUserModal setUserProfileFormVisibility={setShowProfileModal} mode="create" startSection="personal" />
            )}

            {/* Job Form Modal */}
            {showJobForm && (
                <Suspense fallback={<LoadingScreen />}>
                    <JobForm
                        job={null}
                        onCancel={() => setShowJobForm(false)}
                        onSuccess={() => {
                            setShowJobForm(false)
                            // Refresh jobs data
                            if (context?.token && context?.userDetails) {
                                FetchAllJobs(context.token, context.userDetails)
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
                    <div className="flex items-start justify-between">
                        <div className="flex-1 border-l-4 border-blue-600 pl-6 py-2">
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3 leading-tight">
                                Welcome to Your Career Dashboard
                            </h1>
                            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-3xl">
                                Track your job applications, monitor your progress, and optimize your career journey with{" "}
                                <span className="font-semibold text-blue-600">AI-powered insights</span>.
                            </p>
                        </div>

                        {/* Dashboard Manager Display */}
                        <div className="ml-4">
                            <DashboardManagerDisplay />
                        </div>
                    </div>
                </div>

                {/* Zero jobs hint */}
                {uniqueJobs.length === 0 && (
                    <div className="mb-8 rounded-xl border border-dashed border-gray-300 bg-white p-6">
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {userJobs?.length -
                                userJobs.filter((items) => items.currentStatus?.toLowerCase().startsWith("deleted")).length}
                        </h3>
                        <p className="text-gray-600 text-sm">Total Applications</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                    width: `${Math.min(100, (stats.total / 50) * 100)}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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
                                style={{
                                    width: `${Math.min(100, (stats.interviewing / 10) * 100)}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {userJobs?.filter((item) => item.currentStatus.startsWith("offer")).length}
                        </h3>
                        <p className="text-gray-600 text-sm">Offers Received</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                    width: `${Math.min(100, (stats.offer / 5) * 100)}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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
                                style={{
                                    width: `${successRate}%`,
                                }}
                            ></div>
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
                                <h3 className="text-2xl font-bold text-gray-900">{stats.applied}</h3>
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
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {userJobs?.filter((item) => item.currentStatus?.toLowerCase().startsWith("saved")).length}
                                </h3>
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
                            <span className="text-sm font-medium text-gray-600">Saved</span>
                            <span className="text-lg font-bold text-gray-900">
                                {userJobs?.filter((item) => item.currentStatus?.toLowerCase().startsWith("saved")).length}
                            </span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Applied</span>
                            <span className="text-lg font-bold text-gray-900">{stats.applied}</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                <Users className="w-8 h-8 text-orange-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Interview</span>
                            <span className="text-lg font-bold text-gray-900">{stats.interviewing}</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Offer</span>
                            <span className="text-lg font-bold text-gray-900">{stats.offer}</span>
                        </div>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                        <div className="space-y-4">
                            {recentJobs?.map((job) => {
                                // Determine status key from currentStatus
                                const key = (job.currentStatus || "saved").toLowerCase().split(" ")[0] // Get first word for matching

                                // Configuration for each status
                                const statusConfig: Record<
                                    string,
                                    {
                                        color: string
                                        icon: React.ComponentType<any>
                                        label: string
                                        bgColor: string
                                        textColor: string
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
                                }

                                const config = statusConfig[key] || statusConfig.saved
                                const Icon = config.icon

                                return (
                                    <div key={job.jobID} className="flex items-center space-x-4">
                                        <div
                                            className={`w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}
                                        >
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
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Welcome Message - show only first login and only when there are jobs */}
                {uniqueJobs.length === 0 && (
                    <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-2">
                            Welcome aboard, {userProfile?.firstName || context?.userDetails?.name?.split(" ")?.[0] || "User"}! 🎉
                        </h3>
                        <p className="text-orange-100">
                            Our team will now begin working on your resume, and we'll share a draft here for your review once it's
                            ready. It usually takes around 2-3 days to create a resume from scratch.
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default Dashboard
