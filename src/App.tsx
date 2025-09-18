import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Toaster } from 'react-hot-toast';

import Login from './components/Login';
import Register from './components/Register';
import MainContent from './components/MainContent.tsx';

import { UserJobsProvider } from './state_management/UserJobs.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProfileProvider } from './state_management/ProfileContext.tsx';
import ProfilePage from './components/Profile.tsx';
import Navigation from './components/Navigation.tsx';
import NewUserModal from './components/NewUserModal.tsx';
import ManagePage from './components/Operations/Manage.tsx';
import Optimizer from './components/AiOprimizer/Optimizer.tsx';

// Component to handle Profile page with proper navigation
function ProfileWithNavigation() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfileFormVisibility, setUserProfileFormVisibility] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        setUserProfileFormVisibility={setUserProfileFormVisibility} 
      />
      <ProfilePage />
      {userProfileFormVisibility && (
        <NewUserModal 
          setUserProfileFormVisibility={setUserProfileFormVisibility} 
        />
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (
      <GoogleOAuthProvider
          clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID}
      >
          <Toaster
            position="top-left"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: {
                style: {
                  background: '#10B981',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#EF4444',
                },
              },
              loading: {
                style: {
                  background: '#3B82F6',
                },
              },
            }}
          />
          <Router>
              <Routes>
                  {/* Public routes */}
                  <Route
                      path="/login"
                      element={
                          <UserProfileProvider>
                              <Login />
                          </UserProfileProvider>
                      }
                  />
                  <Route
                      path="/coreops"
                      element={
                          <UserProfileProvider>
                              <Register />
                          </UserProfileProvider>
                      }
                  />

                  {/* Routes that require UserJobsProvider */}
                  <Route
                      path="/"
                      element={
                          <UserJobsProvider>
                              <UserProfileProvider>
                                  <MainContent />
                              </UserProfileProvider>
                          </UserJobsProvider>
                      }
                  />
                  <Route
                      path="/manage"
                      element={
                          <UserProfileProvider>
                              <ManagePage />
                          </UserProfileProvider>
                      }
                  />
                  <Route
                      path="/operations/manage"
                      element={
                          <UserProfileProvider>
                              <ManagePage />
                          </UserProfileProvider>
                      }
                  />
                  <Route
                      path="/optimize/:jobId"
                      element={
                          <UserJobsProvider>
                              <UserProfileProvider>
                                  <Optimizer />
                              </UserProfileProvider>
                          </UserJobsProvider>
                      }
                  />
                  <Route
                      path="/profile"
                      element={
                          <UserJobsProvider>
                              <UserProfileProvider>
                                  <ProfileWithNavigation />
                              </UserProfileProvider>
                          </UserJobsProvider>
                      }
                  />
              </Routes>
          </Router>
      </GoogleOAuthProvider>
  );
}

export default App;
