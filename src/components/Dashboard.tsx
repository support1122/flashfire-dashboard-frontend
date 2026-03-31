import {
  Briefcase,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import React, { useEffect, useContext, useState, Suspense, lazy, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserJobs } from "../state_management/UserJobs.tsx";
import { UserContext } from "../state_management/UserContext.js";
import { useUserProfile } from "../state_management/ProfileContext.tsx";
import LoadingScreen from "./LoadingScreen.tsx";
import NewUserModal from "./NewUserModal.tsx";
import DashboardManagerDisplay from "./DashboardManagerDisplay.tsx";
import ReferralBenefitsDisplay from "./ReferralBenefitsDisplay.tsx";
import { useOperationsStore } from "../state_management/Operations.ts";

const JobForm = lazy(() => import("./JobForm.tsx"));

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

    // Handle format: "MM/DD/YYYY, h:mm:ss am/pm" or "DD/MM/YYYY, h:mm:ss am/pm"
    const parts = dateString.trim().split(",");
    if (parts.length === 2) {
      const datePart = parts[0].trim();
      const timePart = parts[1].trim();

      const dateNumbers = datePart.split("/").map((p) => parseInt(p.trim()));

      if (dateNumbers.length === 3) {
        let dd, mm, yyyy;

        if (dateNumbers[0] > 12) {
          dd = dateNumbers[0];
          mm = dateNumbers[1];
          yyyy = dateNumbers[2];
        } else {
          mm = dateNumbers[0];
          dd = dateNumbers[1];
          yyyy = dateNumbers[2];
        }

        if (dd && mm && yyyy) {
          if (yyyy < 100) yyyy += 2000;

          const date = new Date(yyyy, mm - 1, dd);

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

    const native = new Date(dateString);
    if (!isNaN(native.getTime())) {
      return native;
    }
  } catch {
    // Fall through to default
  }

  return new Date(0);
};

const Dashboard: React.FC = () => {
  const context = useContext(UserContext);
  const navigate = useNavigate();
  const { userProfile } = useUserProfile();

  if (!context) {
    console.error("UserContext is null");
    navigate("/login");
    return null;
  }

  const { token, userDetails } = context;
  const { userJobs, setUserJobs, loading, refreshJobs } = useUserJobs();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  // Check auth and profile on mount only
  useEffect(() => {
    if (!token || !userDetails) {
      navigate("/login");
      return;
    }

    const hasProfileValue = sessionStorage.getItem('hasProfile');
    if (hasProfileValue === 'false') {
      setShowProfileModal(true);
    }
  }, []); // Run once on mount

  // Memoize stats calculation
  const stats = useMemo(() => {
    const safeJobs = Array.isArray(userJobs) ? userJobs : [];
    return safeJobs.reduce((acc, job) => {
      const status = job?.currentStatus?.toLowerCase() || '';

      if (status.startsWith('saved')) acc.saved++;
      else if (status.startsWith('applied')) acc.applied++;
      else if (status.startsWith('interviewing')) acc.interviewing++;
      else if (status.startsWith('offer')) acc.offer++;
      else if (status.startsWith('rejected')) acc.rejected++;
      else if (status.startsWith('deleted')) acc.deleted++;

      acc.total = acc.saved + acc.applied + acc.interviewing + acc.offer + acc.rejected;
      return acc;
    }, {
      total: 0,
      saved: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      deleted: 0,
    });
  }, [userJobs]);

  // Memoize unique jobs (deduplicated)
  const uniqueJobs = useMemo(() => {
    if (!userJobs) return [];
    const seen = new Set<string>();
    return userJobs.filter((job) => {
      if (!job || !job.updatedAt || !job.jobID) return false;
      if (seen.has(job.jobID)) return false;
      seen.add(job.jobID);
      return true;
    });
  }, [userJobs]);

  // Memoize recent jobs (sorted, top 6)
  const recentJobs = useMemo(() => {
    return [...uniqueJobs]
      .sort((a, b) => {
        const dateA = parseCustomDate(a?.dateAdded || a?.createdAt || "");
        const dateB = parseCustomDate(b?.dateAdded || b?.createdAt || "");
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 6);
  }, [uniqueJobs]);

  const successRate = stats.total > 0 ? Math.round((stats.offer / stats.total) * 100) : 0;

  const handleJobFormSuccess = useCallback(() => {
    setShowJobForm(false);
    refreshJobs(true);
  }, [refreshJobs]);

  const handleProfileComplete = useCallback(() => {
    sessionStorage.setItem('hasProfile', 'true');
    setShowProfileModal(false);
  }, []);

  // Show loading only on very first load when we have no cached data
  if (loading && userJobs.length === 0) {
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
          onProfileComplete={handleProfileComplete}
        />
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <Suspense fallback={<LoadingScreen />}>
          <JobForm
            job={null}
            onCancel={() => setShowJobForm(false)}
            onSuccess={handleJobFormSuccess}
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

            {/* Dashboard Manager and Referral Benefits */}
            <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center gap-3">
              <DashboardManagerDisplay />
              <ReferralBenefitsDisplay />
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

        {/* Stats Cards */}
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

        {/* Application Pipeline */}
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
          <RecentActivity recentJobs={recentJobs} />
        )}

        {/* Welcome Message */}
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

// Memoized Recent Activity component to prevent unnecessary re-renders
const RecentActivity = React.memo(({ recentJobs }: { recentJobs: any[] }) => {
  const statusConfig: Record<
    string,
    {
      icon: React.ComponentType<any>;
      label: string;
      bgColor: string;
      textColor: string;
    }
  > = {
    saved: { bgColor: "bg-gray-100", textColor: "text-gray-600", icon: Clock, label: "Saved" },
    applied: { bgColor: "bg-blue-100", textColor: "text-blue-800", icon: FileText, label: "Applied" },
    interviewing: { bgColor: "bg-yellow-100", textColor: "text-yellow-800", icon: Users, label: "Interviewing" },
    offer: { bgColor: "bg-green-100", textColor: "text-green-800", icon: CheckCircle, label: "Offer" },
    rejected: { bgColor: "bg-red-100", textColor: "text-red-800", icon: XCircle, label: "Rejected" },
    deleted: { bgColor: "bg-gray-100", textColor: "text-gray-600", icon: XCircle, label: "Deleted" },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
      <div className="space-y-4">
        {recentJobs.map((job) => {
          const key = (job.currentStatus || "saved").toLowerCase().split(" ")[0];
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
  );
});

export default Dashboard;
