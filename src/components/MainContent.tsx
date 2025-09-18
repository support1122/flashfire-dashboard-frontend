import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
// import Navigation from './Navigation';
const Navigation = lazy(()=>import('./Navigation'))
// import Dashboard from './Dashboard';
const Dashboard = lazy(()=>import('./Dashboard'))
// import JobTracker from './JobTracker';
const JobTracker = lazy(()=>import('./JobTracker'))
// import ResumeOptimizer from './ResumeOptimizer';
const ResumeOptimizer = lazy(()=>import('./ResumeOptimizer1'))
import { UserContext } from '../state_management/UserContext';
import LoadingScreen from './LoadingScreen';
import NewUserModal from './NewUserModal';
import { useOperationsStore } from "../state_management/Operations";
// import {BaseResume} from '../types/index'


export default function MainContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [userProfileFormVisibility, setUserProfileFormVisibility] = useState(false);
  const [baseResume, setBaseResume] = useState(null);
  const {userDetails, token} = useContext(UserContext);
  const navigate = useNavigate();
  const { role } = useOperationsStore();
  useEffect(()=>{
  if ((!token || token.length == 0) && role != "operations") {
      console.log("navigating to login");
      navigate("/login");
  }
  },[])
  
  

  return (
    <div className="min-h-screen bg-gray-50">
       <Suspense fallback={<LoadingScreen />}>
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} setUserProfileFormVisibility={setUserProfileFormVisibility} />
        </Suspense> 
        <main>
          {userProfileFormVisibility && <NewUserModal setUserProfileFormVisibility={setUserProfileFormVisibility} />}
          {activeTab === 'dashboard' && <Suspense fallback={<LoadingScreen />}><Dashboard setUserProfileFormVisibility={setUserProfileFormVisibility}/></Suspense>}
          
          
          {activeTab === 'jobs' && (
          <Suspense fallback={<LoadingScreen />}>  
            <JobTracker
              // jobs={jobs}
              // baseResume={baseResume}
              // optimizedResumes={optimizedResumes}
              // onAddJob={addJob}
              // onUpdateJob={updateJob}
              // onDeleteJob={deleteJob}
              // onUpdateJobStatus={updateJobStatus}
              // onAddOptimizedResume={addOptimizedResume}
              // onShowPDFUploader={() => setShowPDFUploader(true)}
            />
          </Suspense>
          )}

          {activeTab === 'optimizer' && (
            <Suspense fallback={<LoadingScreen />}>
            <ResumeOptimizer
              baseResume={baseResume}
              onShowPDFUploader={() => setShowPDFUploader(true)}
            />
            </Suspense>
          )}
        </main>

        {/* PDF Uploader Modal */}
        {showPDFUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <PDFUploader
                onResumeUploaded={handleUploadPDFResume}
                onCancel={() => setShowPDFUploader(false)}
              />
            </div>
          </div>
        )}
      </div>
  )
}


