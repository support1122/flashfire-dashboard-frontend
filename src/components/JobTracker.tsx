import React, { useState, useEffect, useContext, Suspense, lazy } from "react";
import { Plus, Search } from "lucide-react";
import { Job, JobStatus } from "../types";
const JobForm = lazy(() => import("./JobForm"));
const JobCard = lazy(() => import("./JobCard"));
import { UserContext } from "../state_management/UserContext.tsx";
import { useNavigate } from "react-router-dom";
import { useUserJobs } from "../state_management/UserJobs.tsx";
import LoadingScreen from "./LoadingScreen.tsx";
import { useOperationsStore } from "../state_management/Operations.ts";
import { toastUtils, toastMessages } from "../utils/toast";
const JobModal = lazy(() => import("./JobModal.tsx"));

const JOBS_PER_PAGE = 30;

const JobTracker = () => {
    const [showJobForm, setShowJobForm] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const { userJobs, setUserJobs, loading } = useUserJobs();
    const { userDetails, token, setData } = useContext(UserContext);
    const navigate = useNavigate();
    const [pendingMove, setPendingMove] = useState<{
        jobID: string;
        status: JobStatus;
    } | null>(null);

    const [columnPages, setColumnPages] = useState<{
        [key in JobStatus]?: number;
    }>({});

    const role = useOperationsStore((state) => state.role);
    const name = useOperationsStore((state) => state.name);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const statusColumns: { status: JobStatus; label: string; color: string }[] =
        [
            {
                status: "saved",
                label: "Saved",
                color: "bg-gray-50 border-gray-200",
            },
            {
                status: "applied",
                label: "Applied",
                color: "bg-blue-50 border-blue-200",
            },
            {
                status: "interviewing",
                label: "Interviewing",
                color: "bg-amber-50 border-amber-200",
            },
            {
                status: "offer",
                label: "Offers",
                color: "bg-green-50 border-green-200",
            },
            {
                status: "rejected",
                label: "Rejected",
                color: "bg-red-50 border-red-200",
            },
            {
                status: "deleted",
                label: "Removed",
                color: "bg-red-500/50 border-red-100",
            },
        ];

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

            if (responseFromServer.message === "Job Added Succesfully") {
                setUserJobs(responseFromServer.NewJobList);
            }
        } catch (err) {
            console.error("Failed to save job. Please try again.", err);
        } finally {
            setShowJobForm(false); // Close the form regardless of outcome
        }
    };

    const handleDragStart = (e: React.DragEvent, job: Job) => {
        e.dataTransfer.setData("jobID", job.jobID);
        e.dataTransfer.setData("jobId", job.jobID);
        e.dataTransfer.setData("sourceStatus", job.currentStatus);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
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

    const updateJobStatusOptimistically = (
        jobID: string,
        newStatus: JobStatus
    ) => {
        setUserJobs((currentJobs) => {
            if (!currentJobs) return currentJobs;

            return currentJobs.map((job) => {
                if (job.jobID === jobID) {
                    return {
                        ...job,
                        currentStatus:
                            newStatus +
                            (role === "operations"
                                ? " by " + (name || "operations")
                                : " by user"),
                        updatedAt: new Date().toLocaleString("en-IN"),
                    };
                }
                return job;
            });
        });
    };

    const revertJobStatusUpdate = (jobID: string, originalStatus: string) => {
        setUserJobs((currentJobs) => {
            if (!currentJobs) return currentJobs;

            return currentJobs.map((job) => {
                if (job.jobID === jobID) {
                    return {
                        ...job,
                        currentStatus: originalStatus,
                    };
                }
                return job;
            });
        });
    };

    const onUpdateJobStatus = async (jobID, status, userDetails) => {
        const originalJob = userJobs?.find((job) => job.jobID === jobID);
        if (!originalJob) return;

        const originalStatus = originalJob.currentStatus;

        updateJobStatusOptimistically(jobID, status);

        try {
            const endpoint =
                role === "operations"
                    ? `${API_BASE_URL}/operations/jobs`
                    : `${API_BASE_URL}/updatechanges`;
            const statusSuffix =
                role === "operations"
                    ? " by " + (name || "operations")
                    : " by user";

            let reqToServer = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "UpdateStatus",
                    status: status + statusSuffix,
                    userDetails,
                    token: role !== "operations" ? token : undefined,
                    jobID,
                }),
            });

            let resFromServer = await reqToServer.json();
            if (resFromServer.message === "Jobs updated successfully") {
                setUserJobs(resFromServer?.updatedJobs);
                toastUtils.success("Job status updated successfully!");
                console.log("Job status updated:", resFromServer?.updatedJobs);
            } else {
                revertJobStatusUpdate(jobID, originalStatus);
                toastUtils.error("Failed to update job status");
                console.error("Failed to update job status on server");
            }
        } catch (error) {
            console.error("Error updating job status:", error);
            revertJobStatusUpdate(jobID, originalStatus);
            toastUtils.error("Network error while updating job status");
        }
    };

    const handleDrop = (e: React.DragEvent, status: JobStatus) => {
        e.preventDefault();
        const jobID =
            e.dataTransfer.getData("jobID") || e.dataTransfer.getData("jobId");
        if (!jobID) return;

        const job = userJobs?.find((j) => j.jobID === jobID);
        if (!job) return;

        if (
            job.currentStatus === "saved" &&
            status !== "deleted" &&
            status !== "saved"
        ) {
            setSelectedJob(job);
            setPendingMove({ jobID, status });
            setShowJobModal(true);
            return;
        }

        onUpdateJobStatus(jobID, status, userDetails);
    };

    const tsFromUpdatedAt = (val: unknown): number => {
        if (!val) return 0;
        if (val instanceof Date) return val.getTime();
        if (typeof val === "string") {
            const parts = val.split(",").map((s) => s.trim());
            if (parts.length !== 2) return 0;

            const [datePart, timePartRaw] = parts;
            const [ddStr, mmStr, yyyyStr] = datePart.split("/");
            const dd = parseInt(ddStr, 10);
            const mm = parseInt(mmStr, 10);
            const yyyy = parseInt(yyyyStr, 10);
            if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return 0;

            const timeBits = timePartRaw.toLowerCase().split(" ");
            const clock = timeBits[0] || "";
            const ampm = timeBits[1] || "";

            const [hStr, mStr, sStr] = clock.split(":");
            let h = parseInt(hStr || "0", 10);
            const m = parseInt(mStr || "0", 10);
            const s = parseInt(sStr || "0", 10);

            if (ampm === "pm" && h < 12) h += 12;
            if (ampm === "am" && h === 12) h = 0;

            return new Date(yyyy, mm - 1, dd, h, m || 0, s || 0).getTime();
        }

        const t = new Date(val as any).getTime();
        return isNaN(t) ? 0 : t;
    };

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
        <div className="px-4 sm:px-2 lg:px-1 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex flex-col justify-around items-start w-full ml-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Job Tracker
                    </h2>
                    <p className="text-gray-600">
                        Track your job applications and manage your career
                        pipeline
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center justify-center gap-4 w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowJobForm(true)}
                        className="whitespace-nowrap bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    >
                        Add Jobs
                    </button>
                </div>
            </div>

            <div className="flex gap-2 justify-evenly w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 m-4 w-full">
                    {statusColumns.map(({ status, label, color }) => {
                        const filteredAndSortedJobs =
                            userJobs
                                ?.filter((job) => {
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
                                .sort(
                                    (a, b) =>
                                        tsFromUpdatedAt(b.updatedAt) -
                                        tsFromUpdatedAt(a.updatedAt)
                                ) || [];

                        const paginatedJobs = getPaginatedJobs(
                            filteredAndSortedJobs,
                            status
                        );
                        const totalPages = getTotalPages(filteredAndSortedJobs);
                        const currentPage = columnPages[status] || 1;

                        return (
                            <div
                                key={status}
                                className={`rounded-lg border-2 border-dashed ${color} p-1 min-h-[600px] flex flex-col`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, status)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">
                                        {label}
                                    </h3>
                                    <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                                        {
                                            userJobs?.filter((item) =>
                                                item.currentStatus?.startsWith(
                                                    status
                                                )
                                            ).length
                                        }
                                    </span>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <Suspense fallback={<LoadingScreen />}>
                                        {paginatedJobs?.map((job) => (
                                            <JobCard
                                                showJobModal={showJobModal}
                                                setShowJobModal={
                                                    setShowJobModal
                                                }
                                                setSelectedJob={setSelectedJob}
                                                key={job.jobID}
                                                job={job}
                                                onDragStart={handleDragStart}
                                                onEdit={() =>
                                                    setEditingJob(job)
                                                }
                                                onDelete={() =>
                                                    onDeleteJob(job.jobID)
                                                }
                                            />
                                        ))}
                                    </Suspense>
                                    {filteredAndSortedJobs &&
                                        filteredAndSortedJobs.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <p className="text-sm">
                                                    No jobs in this stage
                                                </p>
                                            </div>
                                        )}
                                </div>

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
                                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                                                    currentPage === 1
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                }`}
                                            >
                                                ‹ Prev
                                            </button>

                                            <span className="text-xs text-gray-600 font-medium">
                                                {currentPage}/{totalPages}
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
                                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                                                    currentPage === totalPages
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                }`}
                                            >
                                                Next ›
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            {showJobModal && (
                <Suspense fallback={<LoadingScreen />}>
                    <JobModal
                        setShowJobModal={setShowJobModal}
                        showJobModal={showJobModal}
                        jobDetails={selectedJob}
                        initialSection={
                            pendingMove &&
                            selectedJob &&
                            pendingMove.jobID === selectedJob.jobID
                                ? "attachments"
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
                                onSubmit={
                                    editingJob ? handleEditJob : handleAddJob
                                }
                                onCancel={() => {
                                    setShowJobForm(false);
                                    setEditingJob(null);
                                }}
                            />
                        </Suspense>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobTracker;
