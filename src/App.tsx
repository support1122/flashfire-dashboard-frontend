import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Login from './components/Login';
import Register from './components/Register';
import MainContent from './components/MainContent.tsx';

import { UserJobsProvider } from './state_management/UserJobs.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProfileProvider } from './state_management/ProfileContext.tsx';
import ProfilePage from './components/Profile.tsx';
import Navigation from './components/Navigation.tsx';
import NewUserModal from './components/NewUserModal.tsx';

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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<UserProfileProvider><Login /></UserProfileProvider>} />
          <Route path="/abcdef123" element={<UserProfileProvider><Register /></UserProfileProvider>} />

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
          <Route path='/profile' element={
                                           <UserJobsProvider>
                                            <UserProfileProvider>
                                              <ProfileWithNavigation />
                                            </UserProfileProvider>                
                                          </UserJobsProvider>
                                          } />

        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
