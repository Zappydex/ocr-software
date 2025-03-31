// src/features/user/components/ProfileMenu.js
import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { FaUser, FaSignOutAlt, FaCog, FaCircle, FaUserCircle, FaQuestionCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import '../styles/ProfileMenu.css';

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const [show, setShow] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSettingsClick = () => {
    navigate('/workspace/settings');
    setShow(false);
  };

  const handleProfileClick = () => {
    navigate('/workspace/profile');
    setShow(false);
  };

  const handleHelpClick = () => {
    navigate('/workspace/help');
    setShow(false);
  };

  const toggleMenu = () => {
    setShow(!show);
  };

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <Button 
        variant="light" 
        className="profile-button"
        onClick={toggleMenu}
        aria-expanded={show}
        aria-label="User menu"
      >
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user?.username || 'User'} 
            className="profile-avatar" 
          />
        ) : (
          <FaUserCircle className="profile-icon" />
        )}
      </Button>

      <div className={`profile-dropdown ${show ? 'show' : ''}`}>
        <div className="profile-header">
          <div className="profile-status">
            <FaCircle className="status-indicator active" />
            <span>Active</span>
          </div>
          <div className="profile-name">{user?.username || 'User'}</div>
          <div className="profile-email">{user?.email || 'user@example.com'}</div>
        </div>
        
        <div className="profile-menu-items">
          <button 
            className="profile-menu-item" 
            onClick={handleProfileClick}
          >
            <FaUser className="item-icon" />
            <span>My Profile</span>
          </button>
          
          <button 
            className="profile-menu-item" 
            onClick={handleSettingsClick}
          >
            <FaCog className="item-icon" />
            <span>Settings</span>
          </button>
          
          <button 
            className="profile-menu-item" 
            onClick={handleHelpClick}
          >
            <FaQuestionCircle className="item-icon" />
            <span>Help & Support</span>
          </button>
          
          <div className="menu-divider"></div>
          
          <button 
            className="profile-menu-item logout" 
            onClick={handleLogout}
          >
            <FaSignOutAlt className="item-icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileMenu;

