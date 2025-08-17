import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Login from './components/Login';
import Register from './components/Register';
import MainContent from './components/MainContent.tsx';

import { UserJobsProvider } from './state_management/UserJobs.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes that require UserJobsProvider */}
          <Route
            path="/"
            element={
              <UserJobsProvider>
                <MainContent />
              </UserJobsProvider>
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
