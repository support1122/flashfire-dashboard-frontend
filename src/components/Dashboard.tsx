"use client"

import { Briefcase, FileText, TrendingUp, Users, Target, CheckCircle, XCircle, Clock, Award } from "lucide-react"
import type React from "react"
import { useEffect, useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserJobs } from "../state_management/UserJobs.tsx"
import { UserContext } from "../state_management/UserContext.js"
import { useUserProfile } from "../state_management/ProfileContext.tsx"
import LoadingScreen from "./LoadingScreen.tsx"
import { calculateDashboardStats } from "../utils/storage.ts"
import NewUserModal from "./NewUserModal.tsx"

const Dashboard: React.FC = ({ setUserProfileFormVisibility }) => {
  const context = useContext(UserContext)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  const { userProfile, isProfileComplete } = useUserProfile()
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const token = context?.token
  const userDetails = context?.userDetails
  const setData = context?.setData

  const { userJobs, setUserJobs, loading } = useUserJobs()

  async function FetchAllJobs(localToken, localUserDetails) {
    try {
      setLoadingDetails(true)
      const res = await fetch(`${API_BASE_URL}/getalljobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localToken}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setUserJobs(data?.allJobs)
      } else if (data.message === "invalid token please login again") {
        localStorage.clear()
        navigate("/login")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    if (!token || !userDetails) {
      navigate("/login")
      return
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

    FetchAllJobs(token, userDetails)
  }, [token, userDetails, isProfileComplete])
  const stats = calculateDashboardStats(userJobs)

  const recentJobs = userJobs
    .sort((a, b) => new Date(b?.updatedAt).getTime() - new Date(a?.updatedAt).getTime())
    .slice(0, 6)

  const successRate = stats.total > 0 ? Math.round((stats.offer / stats.total) * 100) : 0
  const responseRate = stats.total > 0 ? Math.round(((stats.interviewing + stats.offer) / stats.total) * 100) : 0

  if (loadingDetails) {
    return <LoadingScreen />
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {showProfileModal && (
        <NewUserModal
          setUserProfileFormVisibility={setShowProfileModal}
          onProfileComplete={() => setShowProfileModal(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 ">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold font-bold text-gray-900 mb-6 leading-tight">Welcome to Your Career Dashboard</h1>
          <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
            Track your job applications, monitor your progress, and optimize your career journey with AI-powered
            insights.
          </p>
        </div>

        {/* Main Stats Grid */}
        <div data-aos="fade-right" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Total Applications */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-blue-100/50 border border-white/50 p-8 hover:shadow-2xl hover:shadow-blue-200/30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {userJobs?.length - userJobs.filter((items) => items.currentStatus == "deleted").length}
                </p>
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.total / 50) * 100)}%` }}
              />
            </div>
          </div>

          {/* Active Interviews */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-amber-100/50 border border-white/50 p-8 hover:shadow-2xl hover:shadow-amber-200/30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-all duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {userJobs?.filter((item) => item.currentStatus == "interviewing").length}
                </p>
                <p className="text-sm font-medium text-gray-500">Active Interviews</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.interviewing / 10) * 100)}%` }}
              />
            </div>
          </div>

          {/* Offers Received */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-emerald-100/50 border border-white/50 p-8 hover:shadow-2xl hover:shadow-emerald-200/30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {userJobs?.filter((item) => item.currentStatus == "offer").length}
                </p>
                <p className="text-sm font-medium text-gray-500">Offers Received</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.offer / 5) * 100)}%` }}
              />
            </div>
          </div>

          {/* Success Rate */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-purple-100/50 border border-white/50 p-8 hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{successRate}%</p>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {userJobs?.filter((item) => item.currentStatus == "applied").length}
                </p>
                <p className="text-sm text-gray-600">Applications Sent</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {(
                    (userJobs?.filter((item) => item.currentStatus === "interviewing").length +
                      userJobs?.filter((item) => item.currentStatus === "offer").length +
                      userJobs?.filter((item) => item.currentStatus === "rejected").length) /
                    userJobs?.length
                  ).toFixed(0)}
                  %
                </p>
                <p className="text-sm text-gray-600">Response Rate</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {userJobs?.filter((item) => item.currentStatus == "saved").length}
                </p>
                <p className="text-sm text-gray-600">Jobs Saved</p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div> */}

        {/* Application Pipeline */}
        <div data-aos="fade-up" className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Application Pipeline</h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              {
                status: "saved",
                label: "Saved",
                count: userJobs?.filter((item) => item.currentStatus == "saved").length,
                color: "bg-gray-500",
                icon: Clock,
              },
              {
                status: "applied",
                label: "Applied",
                count: userJobs?.filter((item) => item.currentStatus == "applied").length,
                color: "bg-blue-600",
                icon: FileText,
              },
              {
                status: "interviewing",
                label: "Interviewing",
                count: userJobs?.filter((item) => item.currentStatus == "interviewing").length,
                color: "bg-blue-600",
                icon: Users,
              },
              {
                status: "offer",
                label: "Offers",
                count: userJobs?.filter((item) => item.currentStatus == "offer").length,
                color: "bg-green-600",
                icon: CheckCircle,
              },
              {
                status: "rejected",
                label: "Rejected",
                count: userJobs?.filter((item) => item.currentStatus == "rejected").length,
                color: "bg-red-600",
                icon: XCircle,
              },
            ].map(({ status, label, count, color, icon: Icon }) => (
              <div key={status} className="text-center">
                <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm font-medium text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
