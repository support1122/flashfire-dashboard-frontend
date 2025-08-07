import React, { useState, useEffect, useContext, createContext, Suspense, lazy } from 'react';
import { Plus, Search } from 'lucide-react';
import { Job, JobStatus } from '../types';
const JobForm =lazy(() => import('./JobForm'));
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


  const handleEditJob = async (jobData: Partial<Job>) => {
  if (!editingJob) return;

  try {
    const updatedJobDetails = {
      ...editingJob,
      ...jobData,
      userID: userDetails?.email,
    };

    const response = await fetch(`${API_BASE_URL}/api/jobs`, { //${API_BASE_URL}
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
  
      const saveJobsToDb = await fetch(`${API_BASE_URL}/api/jobs`, { //${API_BASE_URL}
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ jobDetails, userDetails, token }),
});

      const responseFromServer = await saveJobsToDb.json();
      console.log(responseFromServer);
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



  const handleDragStart = (e: React.DragEvent, job: Job) => {
    e.dataTransfer.setData('jobId', job.jobID);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('Drag over event triggered', e);
  };

  const onDeleteJob = async (jobID: string) => {
  try {
   
    const response = await fetch(`${API_BASE_URL}/api/jobs`, { //${API_BASE_URL}
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
  } catch (error) {
    console.error('Error deleting job:', error);
  }
};
  const onUpdateJobStatus = async (jobID, status, userDetails)=> {
      try {
       
        let reqToServer = await fetch(`${API_BASE_URL}/api/jobs`, {  //${API_BASE_URL}
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


  const handleDrop = (e: React.DragEvent, status: JobStatus) => {
    e.preventDefault();
    console.log(status)
    const jobID = e.dataTransfer.getData('jobID');
    console.log(jobID);
    if (jobID) {
      onUpdateJobStatus(jobID, status, userDetails);
      
    }
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
            {userJobs?.filter((items)=>items.currentStatus == status).map((job) => (         
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
                                <JobModal setShowJobModal={setShowJobModal} showJobModal={showJobModal} jobDetails={selectedJob}  />
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
