
// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, logout as logoutApi } from '../services/auth/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Fetch basic user data (email and username only)
          const userData = await getUserProfile();
          setUser(userData);
          setIsAuthenticated(true);
          setError(null);
        } catch (error) {
          // If token is invalid, clear it
          console.error('Auth token validation failed:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setError('Authentication failed. Please log in again.');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (userData) => {
    setUser(userData.user || userData);
    setIsAuthenticated(true);
    setError(null);
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
  };

  const logout = async () => {
    try {
      // Call the logout API endpoint
      await logoutApi();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUserProfile = (updatedData) => {
    setUser(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading,
      error, 
      login, 
      logout,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

