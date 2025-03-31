// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Auth Components
import Login from './features/auth/components/login';
import Register from './features/auth/components/register';
import AccountActivation from './features/auth/components/AccountActivation';
import PasswordReset from './features/auth/components/PasswordReset';
import PasswordResetConfirm from './features/auth/components/PasswordResetConfirm';
import Logout from './features/auth/components/logout';
import Home from './features/home/components/Home';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Home Route */}
            <Route path="/" element={<Home />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/activate/:uidb64/:token" element={<AccountActivation />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/password-reset/:uidb64/:token" element={<PasswordResetConfirm />} />
            <Route path="/logout" element={<Logout />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                {/* Your dashboard component will go here */}
                <div>Dashboard (Protected)</div>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={5000} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
