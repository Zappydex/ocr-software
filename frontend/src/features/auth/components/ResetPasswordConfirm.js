import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { resetPassword } from '../../../services/auth/api';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
`;

const FormContainer = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 16px;
  width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Input = styled.input`
  margin-bottom: 10px;
  padding: 10px;
  border: 2px solid #cdcdcd;
  border-radius: 12px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #0056b3;
  }
`;

const Button = styled.button`
  padding: 10px;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin: 8px 0;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.3s;
  &:hover {
    background-color: #004494;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
`;

const Message = styled.p`
  color: ${props => props.error ? '#dc3545' : '#28a745'};
  text-align: center;
  margin: 10px 0;
`;

const StyledLink = styled(Link)`
  color: #0056b3;
  text-decoration: none;
  margin: 8px 0;
  font-size: 12px;
  &:hover {
    text-decoration: underline;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
`;

const SlidingSquares = styled.div`
  width: 50px;
  height: 50px;
  position: relative;
  
  .square {
    background-color: #0056b3;
    width: 13px;
    height: 13px;
    position: absolute;
    top: 0;
    left: 0;
    animation: slide 1s infinite;
  }
  
  .square:nth-child(1) { animation-delay: 0s; }
  .square:nth-child(2) { animation-delay: 0.1s; }
  .square:nth-child(3) { animation-delay: 0.2s; }
  .square:nth-child(4) { animation-delay: 0.3s; }
  
  @keyframes slide {
    0% { transform: translate(0, 0); }
    25% { transform: translate(37px, 0); }
    50% { transform: translate(37px, 37px); }
    75% { transform: translate(0, 37px); }
    100% { transform: translate(0, 0); }
  }
`;

const PasswordResetConfirm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // We'll just check if the token and uidb64 are present
        if (token && uidb64) {
          setIsTokenValid(true);
        } else {
          setIsError(true);
          setMessage('Invalid password reset link');
        }
      } catch (error) {
        setIsError(true);
        setMessage('Invalid or expired link');
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, [uidb64, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setIsError(true);
      setMessage('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await resetPassword(uidb64, token, { 
        password, 
        password_confirm: confirmPassword 
      });
      
      setMessage(response.message || 'Password has been reset successfully');
      toast.success('Password reset successful! You can now log in with your new password.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setIsError(true);
      const errorMsg = error.response?.data?.error || 'An error occurred. Please try again.';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isTokenValid && !isError) {
    return (
      <LoadingOverlay>
        <SlidingSquares>
          <div className="square"></div>
          <div className="square"></div>
          <div className="square"></div>
          <div className="square"></div>
        </SlidingSquares>
      </LoadingOverlay>
    );
  }

  if (isError && !isTokenValid) {
    return (
      <Container>
        <FormContainer>
          <Title>Password Reset Failed</Title>
          <Message error>{message}</Message>
          <StyledLink to="/password-reset">Try Again</StyledLink>
          <StyledLink to="/login">Back to Login</StyledLink>
        </FormContainer>
      </Container>
    );
  }

  return (
    <Container>
      <FormContainer>
        <Title>Set New Password</Title>
        {message && <Message error={isError}>{message}</Message>}
        <Form onSubmit={handleSubmit}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Set New Password'}
          </Button>
        </Form>
        <StyledLink to="/login">Back to Login</StyledLink>
      </FormContainer>
      {isLoading && (
        <LoadingOverlay>
          <SlidingSquares>
            <div className="square"></div>
            <div className="square"></div>
            <div className="square"></div>
            <div className="square"></div>
          </SlidingSquares>
        </LoadingOverlay>
      )}
    </Container>
  );
};

export default PasswordResetConfirm;
