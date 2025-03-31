import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../../services/auth/api';
import { useAuth } from '../../../context/AuthContext';

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logoutUser();
        logout();
        navigate('/');
      } catch (error) {
        console.error('Logout failed', error);
        // Even if logout fails on the server, we should clear local state
        logout();
        navigate('/');
      }
    };

    performLogout();
  }, [navigate, logout]);

  // This component doesn't render anything
  return null;
};

export default Logout;
