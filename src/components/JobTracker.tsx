import React, { useState, useEffect, useContext, createContext, Suspense, lazy } from 'react';
import { Plus, Search } from 'lucide-react';
import { Job, JobStatus } from '../types';
const JobForm = lazy(() => import('./JobForm'));
const JobCard = lazy(()=>import('./JobCard'));
import { UserContext } from '../state_management/UserContext.tsx'
import { useNavigate } from 'react-router-dom';
import { useUserJobs } from '../state_management/UserJobs.tsx';
import LoadingScreen from './LoadingScreen.tsx';
// import JobModal from './JobModal.tsx';
const JobModal = lazy(() => import('./JobModal.tsx'));

const JobTracker = () => {
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { userJobs, setUserJobs, loading } = useUserJobs();
  const {userDetails, token, setData} = useContext(UserContext);
  const navigate = useNavigate();
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  // near other useState hooks
const [pendingMove, setPendingMove] = useState<{ jobID: string; status: JobStatus } | null>(null);


  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const statusColumns: { status: JobStatus; label: string; color: string }[] = [
    { status: 'saved', label: 'Saved', color: 'bg-gray-50 border-gray-200' },
    { status: 'applied', label: 'Applied', color: 'bg-blue-50 border-blue-200' },
    { status: 'interviewing', label: 'Interviewing', color: 'bg-amber-50 border-amber-200' },
    { status: 'offer', label: 'Offers', color: 'bg-green-50 border-green-200' },
    { status: 'rejected', label: 'Rejected', color: 'bg-red-50 border-red-200' },
    { status: 'deleted', label: 'Removed', color: 'bg-red-500/50 border-red-100' }
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


  useEffect(() => {
  if (!showJobModal) setPendingMove(null);
}, [showJobModal]);
  const handleEditJob = async (jobData: Partial<Job>) => {
    if (!editingJob) return;

    try {
      const updatedJobDetails = {
        ...editingJob,
        ...jobData,
        userID: userDetails?.email,
      };

      const response = await fetch(`${API_BASE_URL}/updatechanges`, { //${API_BASE_URL}
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          jobID: editingJob.jobID,
          userDetails,
          jobDetails: updatedJobDetails,
          action: 'edit',
        }),
      });

      const result = await response.json();

      if (result.message === 'Jobs updated successfully') {
        setUserJobs(result.updatedJobs);
        console.log('Job updated:', result.updatedJobs);
      }
    } catch (err) {
      console.error('Failed to update job', err);
    } finally {
      setEditingJob(null);
      setShowJobForm(false);
    }
  };

  const handleAddJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const jobDetails = {
        jobID : Date.now().toString(),
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        jobDescription: formData.jobDescription,
        joblink: formData.joblink,
        dateApplied: formData.dateApplied,
        currentStatus: formData.status,
        userID: userDetails.email, // Include user details
      };

      const saveJobsToDb = await fetch(`${API_BASE_URL}/addjob`, { //${API_BASE_URL}
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDetails, userDetails, token }),
      });

      const responseFromServer = await saveJobsToDb.json();
      console.log(responseFromServer);
      
      // Check for token issues
      if (responseFromServer.message === "invalid token please login again" || responseFromServer.message === "Invalid token or expired") {
        console.log('Token invalid, attempting refresh...');
        
        // Try to refresh token
        if (context?.refreshToken) {
          const refreshSuccess = await context.refreshToken();
          if (refreshSuccess) {
            // Retry the request with new token
            console.log('Token refreshed, retrying job creation...');
            setTimeout(() => handleAddJob(jobData), 100);
            return;
          }
        }
        
        console.log('Token refresh failed, clearing storage and redirecting to login');
        localStorage.clear();
        navigate('/login');
        return;
      }
      
      setUserJobs(responseFromServer.NewJobList);
      setShowJobForm(false);
      if (responseFromServer.message == 'Job Added Succesfully') {
        setJobsData(responseFromServer.NewJobList);
        return;
      }
      if (onSuccess) onSuccess();
      onCancel(); // close modal
    } catch (err) {
      console.log(err);
      setError("Failed to save job. Please try again.");
    } finally {
      setIsSubmitting(false);
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
};


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('Drag over event triggered', e);
  };

  const onDeleteJob = async (jobID: string) => {
    try {
      let Code = prompt('Enter The Code to Delete.');
      if(Code !== import.meta.env.VITE_JOB_DELETION_CODE)
        return;
      else{
          const response = await fetch(`${API_BASE_URL}/updatechanges`, { //${API_BASE_URL}
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobID, userDetails, token, action: 'delete' }),
          });

          const result = await response.json();
          if (result.message === 'Jobs updated successfully') {
            setUserJobs(result?.updatedJobs);
            console.log('Job deleted:', result?.updatedJobs);
          }
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const onUpdateJobStatus = async (jobID, status, userDetails)=> {
    try {
      let reqToServer = await fetch(`${API_BASE_URL}/updatechanges`, {  //${API_BASE_URL}
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'UpdateStatus', status, userDetails, token, jobID }),
      });

      let resFromServer = await reqToServer.json();
      if (resFromServer.message === 'Jobs updated successfully') {
        setUserJobs(resFromServer?.updatedJobs);
        console.log('Job status updated:', resFromServer?.updatedJobs);
      }

    } catch (error) {
      console.log(error)
    }
  };

  // const handleDrop = (e: React.DragEvent, status: JobStatus) => {
  //   e.preventDefault();
  //   console.log(status)
  //   const jobID = e.dataTransfer.getData('jobID');
  //   console.log(jobID);
  //   if (jobID) {
  //     onUpdateJobStatus(jobID, status, userDetails);
  //   }
  // };


  // Replace your current handleDrop with this:
const handleDrop = (e: React.DragEvent, status: JobStatus) => {
  e.preventDefault();
  const jobID = e.dataTransfer.getData('jobID') || e.dataTransfer.getData('jobId');
  if (!jobID) return;

  const job = userJobs?.find((j) => j.jobID === jobID);
  if (!job) return;

  // Gate only when moving out of "saved" to a real status (not deleted/saved)
  if (job.currentStatus === 'saved' && status !== 'deleted' && status !== 'saved') {
    setSelectedJob(job);
    setPendingMove({ jobID, status });
    setShowJobModal(true);        // ⬅️ open modal
    return;                       // ⛔ do NOT move yet
  }

  // Normal moves (non-gated)
  onUpdateJobStatus(jobID, status, userDetails);
};




  // Robust timestamp extractor for "en-IN" strings like "14/08/2025, 10:15:30 am"
  const tsFromUpdatedAt = (val: unknown): number => {
    if (!val) return 0;

    if (val instanceof Date) return val.getTime();
    if (typeof val === "string") {
      // Expected formats: "dd/mm/yyyy, hh:mm:ss am/pm" or "dd/mm/yyyy, hh:mm am/pm"
      const parts = val.split(",").map((s) => s.trim());
      if (parts.length !== 2) return 0;

      const [datePart, timePartRaw] = parts;
      const [ddStr, mmStr, yyyyStr] = datePart.split("/").map((s) => s.trim());
      const dd = parseInt(ddStr, 10);
      const mm = parseInt(mmStr, 10);
      const yyyy = parseInt(yyyyStr, 10);
      if (!dd || !mm || !yyyy) return 0;

      // timePart example: "10:15:30 am" OR "10:15 am"
      const timeBits = timePartRaw.split(" ").map((s) => s.trim());
      const clock = timeBits[0] || "";
      const ampm = (timeBits[1] || "").toLowerCase();

      const [hStr, mStr, sStr] = clock.split(":");
      let h = parseInt(hStr || "0", 10);
      const m = parseInt(mStr || "0", 10);
      const s = parseInt(sStr || "0", 10);

      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;

      return new Date(yyyy, mm - 1, dd, h, isNaN(m) ? 0 : m, isNaN(s) ? 0 : s).getTime();
    }

    const t = new Date(val as any).getTime();
    return isNaN(t) ? 0 : t;
  };

  return (
    <div className="px-4 sm:px-2 lg:px-1 py-4">
      <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className='flex flex-col justify-around items-start w-full ml-10'>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Tracker</h2>
          <p className="text-gray-600 ">Track your job applications and manage your career pipeline</p>
        </div>
        {/* {userDetails.planType === 'Free Trial' && (
  <div className="rounded-2xl p-2 m-4 border-2 absolute w-1/3 top-[10%] left-[35%] border-yellow-400 border-dashed bg-yellow-50 shadow-md">
    <h1 className="text-lg font-semibold text-yellow-800 mb-2">
      You’re on the <span className="underline">Free Plan</span>. Upgrade to a <span className="font-bold">Paid Plan</span> to automate your entire job search!
    </h1>
    <p className="text-sm text-gray-700">
      <span className="font-medium">Job Applications Remaining:</span>{" "}
      {
        userJobs.filter(
          (item) =>
            item.currentStatus !== "saved" &&
            item.currentStatus !== "deleted"
        ).length
      }
    </p>
  </div>
)} */}
        <div className="mt-4 sm:mt-0 flex items-center justify-center gap-4 w-full">
          {/* Search Input */}
<div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {/* Suggestion Box */}
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

          {/* Add Job Button */}
          <button
            onClick={() => setShowJobForm(true)}
            className="whitespace-nowrap bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
          >
            Add Jobs
          </button>
        </div>

      </div>

      {/* Kanban Board */}
      <div className="flex gap-2 justify-evenly w-full ">
        {/* Main Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 m-4 w-full">
          {statusColumns.map(({ status, label, color }) => {
            const columnJobs = userJobs?.filter(
              (job) =>
                job?.status === status &&
                (job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  job?.company?.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            return (
              <div
                key={status}
                className={`rounded-lg border-2 border-dashed ${color} p-1 min-h-[600px]`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                    {userJobs.filter((items)=>items.currentStatus==status).length}
                  </span>
                </div>

                <div className=" space-y-2">
                  <Suspense fallback={<LoadingScreen />}>
                    {userJobs
                      ?.filter((items) => items.currentStatus == status)
                      .sort((a, b) => tsFromUpdatedAt(b.updatedAt) - tsFromUpdatedAt(a.updatedAt)) // NEWEST FIRST
                      .map((job) => (
                        <JobCard
                          showJobModal={showJobModal}
                          setShowJobModal={setShowJobModal}
                          setSelectedJob={setSelectedJob}
                          key={job.jobID}
                          job={job}
                          onDragStart={handleDragStart}
                          onEdit={() => setEditingJob(job)}
                          onDelete={() => onDeleteJob(job.jobID)}
                        />
                      ))}
                  </Suspense>
                  {userJobs.filter((items)=>items.currentStatus==status).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No jobs in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
      {showJobModal && <Suspense fallback={<LoadingScreen />}>
        <JobModal
      setShowJobModal={setShowJobModal}
      showJobModal={showJobModal}
      jobDetails={selectedJob}
      initialSection={
        pendingMove && selectedJob && pendingMove.jobID === selectedJob.jobID
          ? "attachments"
          : undefined
      }
      onAutoCheckDone={(exists) => {
        // If local check says "resume exists", allow the move immediately
        if (exists && pendingMove && selectedJob && pendingMove.jobID === selectedJob.jobID) {
          onUpdateJobStatus(pendingMove.jobID, pendingMove.status, userDetails);
          setPendingMove(null);
          setShowJobModal(false);
        }
      }}
      onResumeUploaded={() => {
        // If the user uploads now, allow the move
        if (pendingMove && selectedJob && pendingMove.jobID === selectedJob.jobID) {
          onUpdateJobStatus(pendingMove.jobID, pendingMove.status, userDetails);
          setPendingMove(null);
          setShowJobModal(false);
        }
      }}
    />
      </Suspense>}
      {/* Job Form Modal */}
      {(showJobForm || editingJob) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Suspense fallback={<LoadingScreen />}>
              <JobForm
                setUserJobs={setUserJobs}
                job={editingJob}
                onSubmit={editingJob ? handleEditJob : handleAddJob}
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
