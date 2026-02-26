// import { StrictMode, useContext } from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App.tsx';
// import './index.css';
// import Register from './components/Register.tsx';
// import { UserProvider } from './state_management/UserContext.tsx';
// import {Link, useNavigate, Outlet, createBrowserRouter} from 'react-router-dom';
// import Login from './components/Login.tsx';
// import Register from './components/Register.tsx';

// const routes = createBrowserRouter([
//   {
//     path : '/login',
//     element: <Login />,
//   },
//   {
//     path : '/register',
//     element: <Register />,  
//   },
//   {
//     path : '/',
//     element: <App />
//   }
// ])

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//   <UserProvider>
//     <App />
//   </UserProvider>
//   </StrictMode>
// );




import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { UserProvider } from './state_management/UserContext.tsx';
import { PostHogProvider } from '@posthog/react';
import { posthogClient } from './lib/posthog.ts';
import './index.css';

// const router = createBrowserRouter([
//   // {
//   //   path: '/',
//   //   element: <App />
//   // },
//   {
//     path: '/login',
//     element: <Login />
//   },
//   {
//     path: '/register',
//     element: <Register />
//   }
// ]);

const root = createRoot(document.getElementById('root')!);
const app = (
  <StrictMode>
    <UserProvider>
      {posthogClient ? (
        <PostHogProvider client={posthogClient}>
          <App />
        </PostHogProvider>
      ) : (
        <App />
      )}
    </UserProvider>
  </StrictMode>
);
root.render(app);
