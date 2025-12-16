import React, { useState, useEffect, useContext, Suspense, lazy, useRef } from "react";
import { Search, Plus } from "lucide-react";
import { Job, JobStatus } from "../types/index.ts";
const JobForm = lazy(() => import("./JobForm.tsx"));
const JobCard = lazy(() => import("./JobCard.tsx"));
import { UserContext } from "../state_management/UserContext.tsx";
import { useUserJobs } from "../state_management/UserJobs.tsx";
import LoadingScreen from "./LoadingScreen.tsx";
import { useOperationsStore } from "../state_management/Operations.ts";
import { toastUtils, toastMessages } from "../utils/toast.ts";
import { useJobsSessionStore } from "../state_management/JobsSessionStore.ts";
const JobModal = lazy(() => import("./JobModal.tsx"));
const RemovalLimitModal = lazy(() => import("./RemovalLimitModal.tsx"));

const JOBS_PER_PAGE = 30;

const JobTracker = () => {
    const [showJobForm, setShowJobForm] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [showRemovalLimitModal, setShowRemovalLimitModal] = useState(false);
    const { userJobs, setUserJobs } = useUserJobs();
    const { userDetails, token } = useContext(UserContext) || {};
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const { clearPendingUpdate } = useJobsSessionStore();

    // Handle URL parameters for opening job modal with specific section
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get('jobId');
        const section = urlParams.get('section');

        if (jobId && userJobs.length > 0) {
            const job = userJobs.find(j => j.jobID === jobId || j._id === jobId);
            if (job) {
                setSelectedJob(job);
                setShowJobModal(true);

                // If section is specified, we'll pass it to JobModal
                if (section === 'resume') {
                    // The JobModal will handle the initialSection prop
                }
            }
        }
    }, [userJobs]);

    // near other useState hooks
    const [pendingMove, setPendingMove] = useState<{ jobID: string; status: JobStatus } | null>(null);

    const boardRef = useRef<HTMLDivElement | null>(null);

    const [columnPages, setColumnPages] = useState<{
        [key in JobStatus]?: number;
    }>({});

    const role = useOperationsStore((state) => state.role);
    const name = useOperationsStore((state) => state.name);
    const operationsEmail = useOperationsStore((state) => state.email);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const statusColumns: { status: JobStatus; label: string; color: string }[] = [
        { status: "saved", label: "Saved", color: "bg-gray-50" },
        { status: "applied", label: "Applied", color: "bg-blue-50" },
        { status: "interviewing", label: "Interviewing", color: "bg-amber-50" },
        { status: "offer", label: "Offers", color: "bg-green-50" },
        { status: "rejected", label: "Rejected", color: "bg-red-50" },
        { status: "deleted", label: "Removed", color: "bg-gray-100" },
    ];
    // useEffect(()=>{
    //    setUserJobs(userJobs);
    // },[ userJobs])

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredJobs([]);
            return;
        }

        const matches = userJobs.filter(
            (job) =>
                job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setFilteredJobs(matches);
    }, [searchQuery, userJobs]);

    /**
     * Parse a date string coming from the backend (stored as en-IN locale string)
     * or any ISO/standard format into a numeric timestamp.
     *
     * Tries multiple formats: ISO, DD/MM/YYYY (IST), MM/DD/YYYY (US).
     * Returns 0 if parsing fails (will be sorted to bottom when sorting newest first).
     */
    const parseJobDate = (value?: string | null): number => {
        if (!value || typeof value !== "string") return 0;

        try {
            // Fast path: ISO timestamps (e.g., "2025-12-03T10:30:00.000Z")
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
                const iso = new Date(value);
                if (!Number.isNaN(iso.getTime()) && iso.getTime() > 0) {
                    return iso.getTime();
                }
            }

            // Parse format: "DD/MM/YYYY, h:mm:ss am/pm" or "MM/DD/YYYY, h:mm:ss am/pm"
            const parts = value.trim().split(",");
            if (parts.length === 2) {
                const datePart = parts[0].trim();
                const timePart = parts[1].trim();

                const dateNumbers = datePart.split("/").map((p) => Number(p.trim()));

                if (dateNumbers.length === 3 && dateNumbers.every(n => !Number.isNaN(n) && n > 0)) {
                    // Parse time first (common to both formats)
                    let hour = 0, minute = 0, second = 0;
                    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)/i);
                    if (timeMatch) {
                        hour = Number(timeMatch[1]);
                        minute = Number(timeMatch[2]);
                        second = timeMatch[3] ? Number(timeMatch[3]) : 0;
                        const meridian = (timeMatch[4] || "").toLowerCase();
                        if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
                            if (meridian === "pm" && hour !== 12) hour += 12;
                            if (meridian === "am" && hour === 12) hour = 0;
                        } else {
                            return 0; // Invalid time
                        }
                    } else {
                        const timeMatch24 = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
                        if (timeMatch24) {
                            hour = Number(timeMatch24[1]);
                            minute = Number(timeMatch24[2]);
                            second = timeMatch24[3] ? Number(timeMatch24[3]) : 0;
                            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                                return 0; // Invalid time
                            }
                        }
                    }

                    const now = Date.now();
                    const currentYear = new Date().getFullYear();
                    let bestTimestamp = 0;

                    if (dateNumbers[0] <= 31 && dateNumbers[1] <= 12) {
                        let yyyy = dateNumbers[2];
                        if (yyyy < 100) yyyy += 2000;
                        if (yyyy >= 2000 && yyyy <= currentYear + 1) {
                            try {
                                const istOffsetMinutes = 330;
                                const utcMs = Date.UTC(yyyy, dateNumbers[1] - 1, dateNumbers[0], hour, minute, second) - istOffsetMinutes * 60 * 1000;
                                const d = new Date(utcMs);
                                if (!Number.isNaN(d.getTime()) && d.getTime() > 0 && d.getTime() <= now + 86400000) { // Allow 1 day in future for timezone issues
                                    bestTimestamp = d.getTime();
                                }
                            } catch (e) {
                            }
                        }
                    }

                    if (dateNumbers[0] <= 12 && dateNumbers[1] <= 31 && (bestTimestamp === 0 || (dateNumbers[0] <= 12 && dateNumbers[1] <= 12))) {
                        let yyyy = dateNumbers[2];
                        if (yyyy < 100) yyyy += 2000;
                        if (yyyy >= 2000 && yyyy <= currentYear + 1) {
                            try {
                                const istOffsetMinutes = 330;
                                const utcMs = Date.UTC(yyyy, dateNumbers[0] - 1, dateNumbers[1], hour, minute, second) - istOffsetMinutes * 60 * 1000;
                                const d = new Date(utcMs);
                                if (!Number.isNaN(d.getTime()) && d.getTime() > 0 && d.getTime() <= now + 86400000) {
                                    if (bestTimestamp === 0 || d.getTime() > bestTimestamp) {
                                        bestTimestamp = d.getTime();
                                    }
                                }
                            } catch (e) {
                                // Invalid date
                            }
                        }
                    }

                    if (bestTimestamp > 0) {
                        return bestTimestamp;
                    }
                }
            }

            // Fallback: try native Date parse
            const native = new Date(value);
            if (!Number.isNaN(native.getTime()) && native.getTime() > 0) {
                const now = Date.now();
                if (native.getTime() <= now + 86400000) {
                    return native.getTime();
                }
            }
        } catch (error) {
            console.warn("Failed to parse job date:", value, error);
        }

        // Return 0 for unparseable dates (will be sorted to bottom when sorting newest first)
        return 0;
    };

    /**
     * Get the timestamp we will use for ordering cards.
     * Requirement from product: sort strictly by "when it was added",
     * so we prefer dateAdded first, then createdAt, and do NOT use updatedAt.
     * Returns 0 if neither date can be parsed (will be sorted to bottom).
     */
    const getJobCreationTime = (job: Job): number => {
        // Prioritize dateAdded (when job was added)
        const dateAddedTime = parseJobDate(job.dateAdded);
        if (dateAddedTime > 0) {
            return dateAddedTime;
        }

        // Fall back to createdAt if dateAdded is not available or invalid
        const createdAtTime = parseJobDate(job.createdAt);
        if (createdAtTime > 0) {
            return createdAtTime;
        }

        // If both are invalid, return 0 (will be sorted to bottom)
        return 0;
    };


    useEffect(() => {
        if (!showJobModal) setPendingMove(null);
    }, [showJobModal]);

    console.log("Role in job tracker is ", role);

    const handleEditJob = async (jobData: Partial<Job>) => {
        if (!editingJob) return;

        if (role === "operations") {
            try {
                const updatedJobDetails = {
                    ...editingJob,
                    ...jobData,
                    userID: userDetails?.email,
                };
                console.log("operations ");
                const response = await fetch(
                    `${API_BASE_URL}/operations/jobs`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            token,
                            jobID: editingJob.jobID,
                            userDetails,
                            jobDetails: updatedJobDetails,
                            action: "edited by " + (name || "operations"),
                        }),
                    }
                );

                const result = await response.json();

                if (result.message === "Jobs updated successfully") {
                    setUserJobs(result.updatedJobs);
                    toastUtils.success(toastMessages.jobUpdated);
                    console.log("Job updated:", result.updatedJobs);
                } else {
                    toastUtils.error(toastMessages.jobError);
                }
            } catch (err) {
                console.error("Failed to update job", err);
                toastUtils.error(toastMessages.jobError);
            } finally {
                setEditingJob(null);
                setShowJobForm(false);
            }
        } else {
            try {
                const updatedJobDetails = {
                    ...editingJob,
                    ...jobData,
                    userID: userDetails?.email,
                };

                const response = await fetch(`${API_BASE_URL}/updatechanges`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        jobID: editingJob.jobID,
                        userDetails,
                        jobDetails: updatedJobDetails,
                        action: "edited by ",
                    }),
                });

                const result = await response.json();

                if (result.message === "Jobs updated successfully") {
                    setUserJobs(result.updatedJobs);
                    toastUtils.success(toastMessages.jobUpdated);
                    console.log("Job updated:", result.updatedJobs);
                } else if (result.message === "Removal limit exceeded") {
                    setShowRemovalLimitModal(true);
                } else {
                    toastUtils.error(toastMessages.jobError);
                }
            } catch (err) {
                console.error("Failed to update job", err);
                toastUtils.error(toastMessages.jobError);
            } finally {
                setEditingJob(null);
                setShowJobForm(false);
            }
        }
    };

    const handleAddJob = async (
        jobData: Omit<Job, "jobID" | "createdAt" | "updatedAt">
    ) => {
        try {
            const jobDetails = {
                ...jobData,
                jobID: Date.now().toString(),
                userID: userDetails?.email,
            };

            const saveJobsToDb = await fetch(`${API_BASE_URL}/api/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ jobDetails, userDetails, token }),
            });

            const responseFromServer = await saveJobsToDb.json();
            console.log(responseFromServer);
            setUserJobs(responseFromServer.NewJobList);
            setShowJobForm(false);
            if (responseFromServer.message == 'Job Added Succesfully') {
                setUserJobs(responseFromServer.NewJobList);
                return;
            }
        } catch (err) {
            console.log(err);
            toastUtils.error("Failed to save job. Please try again.");
        }
    }

    // const handleDragStart = (e: React.DragEvent, job: Job) => {
    //   e.dataTransfer.setData('jobId', job.jobID);
    // };

    // Replace your current handleDragStart with this:
    const handleDragStart = (e: React.DragEvent, job: Job) => {
        // Keep backward compatibility with any existing reads
        e.dataTransfer.setData('jobID', job.jobID);   // <-- new (capital D)
        e.dataTransfer.setData('jobId', job.jobID);   // existing key some code may rely on
        // Optional: source status for future-proofing (not strictly needed)
        e.dataTransfer.setData('sourceStatus', job.currentStatus);

        // Enhanced visual feedback for drag start
        const target = e.target as HTMLElement;
        target.style.opacity = '0.8';
        target.style.transform = 'rotate(8deg) scale(1.05)';
        target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        target.style.zIndex = '1000';
        target.style.transition = 'none'; // Disable transition during drag for instant feedback
    };

    const handleDragEnd = (e: React.DragEvent) => {
        // Reset visual effects with smooth animation
        const target = e.target as HTMLElement;
        target.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'; // Restore smooth transition
        target.style.opacity = '1';
        target.style.transform = 'none';
        target.style.boxShadow = '';
        target.style.zIndex = '';
    };


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        // Enhanced visual feedback for drop zones
        const target = e.currentTarget as HTMLElement;
        target.style.borderColor = '#3b82f6';
        target.style.borderWidth = '3px';
        target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        target.style.transform = 'scale(1.02)';
        target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.2)';
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Reset visual feedback when leaving drop zone
        const target = e.currentTarget as HTMLElement;
        target.style.borderColor = '';
        target.style.borderWidth = '';
        target.style.backgroundColor = '';
        target.style.transform = '';
        target.style.boxShadow = '';
    };

    const handleDragOverBoard = (e: React.DragEvent) => {
        e.preventDefault();
        const container = boardRef.current;
        if (!container) return;

        const { clientX } = e;
        const { left, right } = container.getBoundingClientRect();
        const edgeSize = 100; // Reduced for more responsive scrolling

        // Throttle scroll updates for better performance
        const scrollContainer = container as any;
        if (!scrollContainer._scrollTimeout) {
            scrollContainer._scrollTimeout = true;

            if (clientX - left < edgeSize) {
                const distance = clientX - left;
                const intensity = Math.max(0.3, (edgeSize - distance) / edgeSize);
                const scrollSpeed = intensity * 150; // Increased speed
                container.scrollBy({ left: -scrollSpeed, behavior: "auto" }); // Changed to auto for instant scroll
            } else if (right - clientX < edgeSize) {
                const distance = right - clientX;
                const intensity = Math.max(0.3, (edgeSize - distance) / edgeSize);
                const scrollSpeed = intensity * 150; // Increased speed
                container.scrollBy({ left: scrollSpeed, behavior: "auto" }); // Changed to auto for instant scroll
            }

            // Reset throttle after 16ms (60fps)
            setTimeout(() => {
                scrollContainer._scrollTimeout = false;
            }, 16);
        }
    };

    const onDeleteJob = async (jobID: string) => {
        try {
            let Code = prompt("Enter The Code to Delete.");
            if (Code !== import.meta.env.VITE_JOB_DELETION_CODE) return;
            else {
                if (role === "operations") {
                    const response = await fetch(
                        `${API_BASE_URL}/operations/jobs`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                jobID,
                                userDetails,
                                action: "delete",
                            }),
                        }
                    );

                    const result = await response.json();
                    if (result.message === "Jobs updated successfully") {
                        setUserJobs(result?.updatedJobs);
                        toastUtils.success(toastMessages.jobDeleted);
                        console.log("Job deleted:", result?.updatedJobs);
                    } else {
                        toastUtils.error(toastMessages.jobError);
                    }
                } else {
                    const response = await fetch(
                        `${API_BASE_URL}/updatechanges`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                jobID,
                                userDetails,
                                token,
                                action: "delete",
                            }),
                        }
                    );

                    const result = await response.json();
                    if (result.message === "Jobs updated successfully") {
                        setUserJobs(result?.updatedJobs);
                        toastUtils.success(toastMessages.jobDeleted);
                        console.log("Job deleted:", result?.updatedJobs);
                    } else {
                        toastUtils.error(toastMessages.jobError);
                    }
                }
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            toastUtils.error("Failed to delete job. Please try again.");
        }
    };


    const onUpdateJobStatus = async (jobID: string, status: JobStatus, userDetails: any) => {
        const originalJob = userJobs?.find((job) => job.jobID === jobID);
        if (!originalJob) return;

        const originalStatus = originalJob.currentStatus;
        const statusSuffix = role === "operations" ? " by " + (name || "operations") : " by user";
        const newStatus = status + statusSuffix;

        // OPTIMISTIC UPDATE: Update UI immediately
        setUserJobs((prevJobs) =>
            prevJobs.map((j) =>
                j.jobID === jobID
                    ? {
                        ...j,
                        currentStatus: newStatus,
                        // Keep updatedAt for history, but sorting will rely on createdAt/dateAdded.
                        updatedAt: new Date().toLocaleString("en-IN")
                    }
                    : j
            )
        );

        // When a job is moved into "applied", make sure the Applied column
        // shows from the top (page 1) so the user can see the relevant jobs.
        if (status === "applied") {
            setColumnPages((prev) => ({ ...prev, applied: 1 }));
        }

        try {
            const endpoint =
                role === "operations"
                    ? `${API_BASE_URL}/operations/jobs`
                    : `${API_BASE_URL}/updatechanges`;

            let reqToServer = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "UpdateStatus",
                    status: newStatus,
                    userDetails,
                    token: role !== "operations" ? token : undefined,
                    jobID,
                    // Send operations user name and email when operations member updates status
                    ...(role === "operations" && {
                        role: "operations",
                        operationsName: name || "operations",
                        operationsEmail: operationsEmail || "operations@flashfirehq"
                    }),
                }),
            });

            let resFromServer = await reqToServer.json();
            if (resFromServer.message === "Jobs updated successfully") {
                // Server confirmed - update with server data
                setUserJobs(resFromServer?.updatedJobs);
                clearPendingUpdate(jobID);
                toastUtils.success("Job status updated successfully!");
                console.log("Job status updated:", resFromServer?.updatedJobs);
            } else if (resFromServer.message === "Removal limit exceeded") {
                // Handle removal limit exceeded
                setUserJobs((prevJobs) =>
                    prevJobs.map((j) =>
                        j.jobID === jobID ? { ...j, currentStatus: originalStatus } : j
                    )
                );
                clearPendingUpdate(jobID);
                setShowRemovalLimitModal(true);
                console.log("Removal limit exceeded for user");
            } else {
                // Server failed - revert to original state
                setUserJobs((prevJobs) =>
                    prevJobs.map((j) =>
                        j.jobID === jobID ? { ...j, currentStatus: originalStatus } : j
                    )
                );
                clearPendingUpdate(jobID);
                toastUtils.error("Failed to update job status");
                console.error("Failed to update job status on server");
            }
        } catch (error) {
            console.error("Error updating job status:", error);
            // Network error - revert to original state
            setUserJobs((prevJobs) =>
                prevJobs.map((j) =>
                    j.jobID === jobID ? { ...j, currentStatus: originalStatus } : j
                )
            );
            clearPendingUpdate(jobID);
            toastUtils.error("Network error while updating job status");
        }
    };

    const handleDrop = (e: React.DragEvent, status: JobStatus) => {
        e.preventDefault();

        // Reset visual feedback
        const target = e.currentTarget as HTMLElement;
        target.style.borderColor = '';
        target.style.borderWidth = '';
        target.style.backgroundColor = '';
        target.style.transform = '';
        target.style.boxShadow = '';

        const jobID =
            e.dataTransfer.getData("jobID") || e.dataTransfer.getData("jobId");
        if (!jobID) return;

        const job = userJobs?.find((j) => j.jobID === jobID);
        if (!job) return;

        // Gate only when moving out of "saved" to a real status (not deleted/saved)
        if (job.currentStatus === 'saved' && status !== 'deleted' && status !== 'saved') {
            setSelectedJob(job);
            setPendingMove({ jobID, status });
            setShowJobModal(true);
            return;
        }

        // INSTANT UPDATE: Move immediately in UI, then sync with server
        onUpdateJobStatus(jobID, status, userDetails);
    };



    // Replace your current handleDrop with this:
    // const handleDrop = (e: React.DragEvent, status: JobStatus) => {
    //   e.preventDefault();
    //   const jobID = e.dataTransfer.getData('jobID') || e.dataTransfer.getData('jobId');
    //   if (!jobID) return;

    //   const job = userJobs?.find((j) => j.jobID === jobID);
    //   if (!job) return;

    //   // Gate only when moving out of "saved" to a real status (not deleted/saved)
    //   if (job.currentStatus === 'saved' && status !== 'deleted' && status !== 'saved') {
    //     setSelectedJob(job);
    //     setPendingMove({ jobID, status });
    //     setShowJobModal(true);        // ⬅️ open modal
    //     return;                       // ⛔ do NOT move yet
    //   }

    //   // Normal moves (non-gated)
    //   onUpdateJobStatus(jobID, status, userDetails);
    // };

    const updateColumnPage = (status: JobStatus, page: number) => {
        setColumnPages((prev) => ({ ...prev, [status]: page }));
    };

    const getPaginatedJobs = (jobs: Job[], status: JobStatus) => {
        const currentPage = columnPages[status] || 1;
        const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
        const endIndex = startIndex + JOBS_PER_PAGE;
        return jobs.slice(startIndex, endIndex);
    };

    const getTotalPages = (jobs: Job[]) => {
        return Math.ceil(jobs.length / JOBS_PER_PAGE);
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6  min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex flex-col justify-around items-start w-full">
                    <h2 className="text-4xl md:text-4xl font-extrabold text-zinc-900 mb-2 tracking-tight leading-[1.1]">Job Tracker</h2>
                    <p className="text-gray-600 text-3x1 ">Track your job applications and manage your career pipeline</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center justify-end gap-4 w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
                        />
                        {filteredJobs.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {filteredJobs.map((job) => (
                                    <div
                                        key={job.jobID}
                                        onClick={() => {
                                            setSelectedJob(job);
                                            setShowJobModal(true);
                                            setSearchQuery(''); // Clear after selection
                                            setFilteredJobs([]); // Hide box
                                        }}
                                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-none"
                                    >
                                        <p className="font-semibold text-gray-900">{job.jobTitle}</p>
                                        <p className="text-sm text-gray-500">{job.companyName}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowJobForm(true)}
                        className="whitespace-nowrap bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        Add Jobs
                    </button>
                </div>
            </div>

            {/* Board */}
            <div
                ref={boardRef}
                className="flex gap-6 overflow-x-auto pb-6"
                onDragOver={handleDragOverBoard}
            >
                {statusColumns.map(({ status, label, color }) => {
                    const filteredAndSortedJobs =
                        (userJobs && Array.isArray(userJobs))
                            ? userJobs
                                .filter((job) => {
                                    const statusMatch =
                                        job.currentStatus?.startsWith(status);
                                    if (!statusMatch) return false;
                                    if (!searchQuery.trim()) return true;

                                    const query = searchQuery.toLowerCase();
                                    const titleMatch = job.jobTitle
                                        ?.toLowerCase()
                                        .includes(query);
                                    const companyMatch = job.companyName
                                        ?.toLowerCase()
                                        .includes(query);
                                    return titleMatch || companyMatch;
                                })
                                .sort((a, b) => {
                                    // Sort strictly by creation time (when job was added),
                                    // newest first, so "Added now" appears at the top,
                                    // "Added 1 day ago" appears above "Added 2 days ago", etc.
                                    const timeA = getJobCreationTime(a);
                                    const timeB = getJobCreationTime(b);

                                    // Handle unparseable dates (0): put them at the bottom
                                    if (timeA === 0 && timeB === 0) return 0; // Both unparseable, maintain order
                                    if (timeA === 0) return 1; // A is unparseable, put it after B
                                    if (timeB === 0) return -1; // B is unparseable, put it after A

                                    // If times are equal, maintain stable sort
                                    if (timeA === timeB) return 0;

                                    // Newest first: larger timestamp comes first (descending order)
                                    return timeB - timeA;
                                })
                            : [];

                    const paginatedJobs = getPaginatedJobs(
                        filteredAndSortedJobs,
                        status
                    );
                    const totalPages = getTotalPages(filteredAndSortedJobs);
                    const currentPage = columnPages[status] || 1;

                    return (
                        <div
                            key={status}
                            className={`${color} rounded-xl p-4 min-w-[280px] w-80 flex flex-col shadow-sm border border-gray-200 transition-all duration-200`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, status)}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${status === "saved"
                                                ? "bg-gray-400"
                                                : status === "applied"
                                                    ? "bg-blue-500"
                                                    : status === "interviewing"
                                                        ? "bg-amber-500"
                                                        : status === "offer"
                                                            ? "bg-green-500"
                                                            : status === "rejected"
                                                                ? "bg-red-500"
                                                                : status === "deleted"
                                                                    ? "bg-gray-700"
                                                                    : "bg-gray-300"
                                            }`}
                                    ></div>
                                    <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{label}</h3>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${status === "saved"
                                            ? "bg-gray-100 text-gray-700"
                                            : status === "applied"
                                                ? "bg-blue-100 text-blue-700"
                                                : status === "interviewing"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : status === "offer"
                                                        ? "bg-green-100 text-green-700"
                                                        : status === "rejected"
                                                            ? "bg-red-100 text-red-700"
                                                            : status === "deleted"
                                                                ? "bg-gray-200 text-gray-700"
                                                                : ""
                                        }`}
                                >
                                    {userJobs?.filter((item) => item.currentStatus?.startsWith(status)).length}
                                </span>
                            </div>

                            {/* Job Cards */}
                            <div className="flex-1 space-y-3 min-h-[500px]">
                                <Suspense fallback={<LoadingScreen />}>
                                    {paginatedJobs?.map((job) => (
                                        <div key={job.jobID} className="relative">
                                            <JobCard
                                                job={job}
                                                showJobModal={showJobModal}
                                                setShowJobModal={setShowJobModal}
                                                setSelectedJob={setSelectedJob}
                                                onDragStart={handleDragStart}
                                                onDragEnd={handleDragEnd}
                                                onEdit={() =>
                                                    setEditingJob(job)
                                                }
                                                onDelete={() =>
                                                    onDeleteJob(job.jobID)
                                                }
                                            />
                                        </div>
                                    ))}
                                </Suspense>
                                {filteredAndSortedJobs &&
                                    filteredAndSortedJobs.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium">No jobs yet</p>
                                            <p className="text-xs mt-1">Drag jobs here or add new ones</p>
                                        </div>
                                    )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() =>
                                                updateColumnPage(
                                                    status,
                                                    currentPage - 1
                                                )
                                            }
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${currentPage === 1
                                                    ? "text-gray-400 cursor-not-allowed"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                                                }`}
                                        >
                                            ← Prev
                                        </button>
                                        <span className="text-xs text-gray-600 font-medium bg-white/50 px-2 py-1 rounded">
                                            {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() =>
                                                updateColumnPage(
                                                    status,
                                                    currentPage + 1
                                                )
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${currentPage === totalPages
                                                    ? "text-gray-400 cursor-not-allowed"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                                                }`}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {showJobModal && (
                <Suspense fallback={<LoadingScreen />}>
                    <JobModal
                        setShowJobModal={setShowJobModal}
                        jobDetails={selectedJob}
                        initialSection={
                            pendingMove &&
                                selectedJob &&
                                pendingMove.jobID === selectedJob.jobID
                                ? "attachments"
                                : new URLSearchParams(window.location.search).get('section') === 'resume'
                                    ? "resume"
                                    : undefined
                        }
                        onAutoCheckDone={(exists) => {
                            if (
                                exists &&
                                pendingMove &&
                                selectedJob &&
                                pendingMove.jobID === selectedJob.jobID
                            ) {
                                onUpdateJobStatus(
                                    pendingMove.jobID,
                                    pendingMove.status,
                                    userDetails
                                );
                                setPendingMove(null);
                                setShowJobModal(false);
                            }
                        }}
                        onResumeUploaded={() => {
                            if (
                                pendingMove &&
                                selectedJob &&
                                pendingMove.jobID === selectedJob.jobID
                            ) {
                                onUpdateJobStatus(
                                    pendingMove.jobID,
                                    pendingMove.status,
                                    userDetails
                                );
                                setPendingMove(null);
                                setShowJobModal(false);
                            }
                        }}
                    />
                </Suspense>
            )}
            {(showJobForm || editingJob) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <Suspense fallback={<LoadingScreen />}>
                            <JobForm
                                setUserJobs={setUserJobs}
                                job={editingJob}
                                onCancel={() => {
                                    setShowJobForm(false);
                                    setEditingJob(null);
                                }}
                            />
                        </Suspense>
                    </div>
                </div>
            )}
            {showRemovalLimitModal && (
                <Suspense fallback={<LoadingScreen />}>
                    <RemovalLimitModal
                        isOpen={showRemovalLimitModal}
                        onClose={() => setShowRemovalLimitModal(false)}
                    />
                </Suspense>
            )}

            {/* TESTING: Temporary button to test the modal
            <button
                onClick={() => setShowRemovalLimitModal(true)}
                className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors z-50"
            >
                Test Removal Limit Modal
            </button> */}
        </div>
    );
};

export default JobTracker;
