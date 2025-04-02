import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthToken } from '../redux/authSlice'; // Adjust path as needed
import axios from 'axios';

const API_BASE_URL = 'https://ocr-software-62gw.onrender.com';
const API_PATH = '/api/accounts/';

const GoogleAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('Processing Google authentication...');
  const [registrationData, setRegistrationData] = useState(null);
  const [otpData, setOtpData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password1: '',
    password2: '',
    organization: '',
    role: 'user',
  });
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    handleGoogleAuthCallback();
  }, []);

  const handleGoogleAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idToken = urlParams.get('id_token');
    
    if (!idToken) {
      setStatus('No authentication token found. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {
      setStatus('Verifying your Google account...');
      const response = await axios.post(`${API_BASE_URL}${API_PATH}google/login/`, {
        token: idToken
      });

      const data = response.data;
      
      // If user needs to complete registration
      if (data.needs_additional_info) {
        setStatus('Please complete your registration');
        setRegistrationData({
          email: data.email,
          suggested_username: data.suggested_username || data.email.split('@')[0]
        });
        setFormData(prev => ({
          ...prev,
          username: data.suggested_username || data.email.split('@')[0]
        }));
      } 
      // If OTP verification is needed
      else if (data.requires_otp) {
        setStatus('OTP verification required');
        setOtpData({
          email: data.email
        });
      } 
      // If authentication is complete
      else if (data.token) {
        setStatus('Authentication successful! Redirecting...');
        dispatch(setAuthToken(data.token));
        localStorage.setItem('authToken', data.token);
        setTimeout(() => navigate('/workspace'), 1000);
      } 
      // Unexpected response
      else {
        setStatus('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setStatus(`Authentication error: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password1 !== formData.password2) {
      setStatus('Passwords do not match');
      return;
    }

    try {
      setStatus('Creating your account...');
      const response = await axios.post(`${API_BASE_URL}${API_PATH}register/`, {
        ...formData,
        email: registrationData.email,
        google_id: registrationData.google_id
      });

      if (response.data.requires_otp) {
        setStatus('OTP verification required');
        setRegistrationData(null);
        setOtpData({
          email: registrationData.email
        });
      } else {
        setStatus('Registration successful! Please check your email for activation.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      setStatus(`Registration error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setStatus('Verifying OTP...');
      const response = await axios.post(`${API_BASE_URL}${API_PATH}verify-otp/`, {
        otp: otpCode
      });

      if (response.data.token) {
        setStatus('OTP verified! Redirecting...');
        dispatch(setAuthToken(response.data.token));
        localStorage.setItem('authToken', response.data.token);
        setTimeout(() => navigate('/workspace'), 1000);
      } else {
        setStatus('OTP verification failed. Please try again.');
      }
    } catch (error) {
      setStatus(`OTP error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleResendOtp = async () => {
    try {
      setStatus('Resending OTP...');
      await axios.post(`${API_BASE_URL}${API_PATH}resend-otp/`, {
        email: otpData.email
      });
      setStatus('OTP has been resent to your email');
    } catch (error) {
      setStatus(`Error resending OTP: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-center">Google Authentication</h3>
            </div>
            <div className="card-body">
              {!registrationData && !otpData && (
                <div className="text-center">
                  <p>{status}</p>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {registrationData && (
                <div>
                  <h4>Complete Your Registration</h4>
                  <p>Please provide additional information to complete your account setup.</p>
                  <form onSubmit={handleRegistrationSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={registrationData.email} 
                        disabled 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="username"
                        value={formData.username} 
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        name="password1"
                        value={formData.password1} 
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        name="password2"
                        value={formData.password2} 
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Organization</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="organization"
                        value={formData.organization} 
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select 
                        className="form-select" 
                        name="role"
                        value={formData.role} 
                        onChange={handleInputChange}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary">Complete Registration</button>
                    </div>
                    {status && <div className="alert alert-info mt-3">{status}</div>}
                  </form>
                </div>
              )}

              {otpData && (
                <div>
                  <h4>OTP Verification</h4>
                  <p>Please enter the verification code sent to your email.</p>
                  <form onSubmit={handleOtpSubmit}>
                    <div className="mb-3">
                      <label className="form-label">OTP Code</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={otpCode} 
                        onChange={(e) => setOtpCode(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary">Verify OTP</button>
                      <button type="button" className="btn btn-secondary" onClick={handleResendOtp}>
                        Resend OTP
                      </button>
                    </div>
                    {status && <div className="alert alert-info mt-3">{status}</div>}
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuth;


import GoogleAuth from './path/to/google-auth';

// In your Routes component
<Routes>
  {/* Your existing routes */}
  <Route path="/google-auth" element={<GoogleAuth />} />
</Routes>

