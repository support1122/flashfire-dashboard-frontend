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
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import { UserProvider } from './state_management/UserContext.tsx';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      {/* <RouterProvider router={router} /> */}
      <App />
    </UserProvider>
  </StrictMode>
);
