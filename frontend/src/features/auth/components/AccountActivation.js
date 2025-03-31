import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { checkActivationToken, confirmAccountActivation, resendActivationEmail } from '../../../services/auth/api';

const ActivationContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ActivationContent = styled.div`
  background-color: white;
  padding: 40px;
  border-radius: 16px;
  width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
`;

const Message = styled.p`
  color: ${props => props.success ? '#28a745' : '#dc3545'};
  text-align: center;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Input = styled.input`
  margin-bottom: 14px;
  padding: 14px;
  border: 2px solid #cdcdcd;
  border-radius: 16px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #0056b3;
  }
`;

const Button = styled.button`
  padding: 14px;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  margin: 10px 0;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
  &:hover {
    background-color: #004494;
  }
`;

const Link = styled.a`
  color: #0056b3;
  text-decoration: none;
  margin: 10px 0;
  cursor: pointer;
  font-size: 14px;
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

const AccountActivation = () => {
  const [activationStatus, setActivationStatus] = useState(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await checkActivationToken(uidb64, token);
        setIsValidToken(true);
        setActivationStatus({ success: true, message: response.message });
        if (response.message === 'Account is already active') {
          toast.info('Your account is already active. Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (error) {
        setActivationStatus({ success: false, message: error.response?.data?.error || 'Invalid activation link' });
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, [uidb64, token, navigate]);

  const handleActivation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await confirmAccountActivation(uidb64, token);
      setActivationStatus({ success: true, message: response.message });
      toast.success('Your account has been successfully activated. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setActivationStatus({ success: false, message: error.response?.data?.error || 'Activation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendActivation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await resendActivationEmail({ email });
      setResendStatus({ success: true, message: response.message });
      if (response.message === 'Account is already active') {
        toast.info('Your account is already active. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.success('Activation email has been resent. Please check your inbox.');
      }
    } catch (error) {
      setResendStatus({ success: false, message: error.response?.data?.error || 'Failed to resend activation email' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && activationStatus === null) {
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

  return (
    <ActivationContainer>
      <ActivationContent>
        <Title>Account Activation</Title>
        {activationStatus && (
          <Message success={activationStatus.success}>{activationStatus.message}</Message>
        )}
        {isValidToken && activationStatus?.message === 'Token is valid. Please confirm activation.' && (
          <Form onSubmit={handleActivation}>
            <Button type="submit">Activate Account</Button>
          </Form>
        )}
        {!isValidToken && (
          <Form onSubmit={handleResendActivation}>
            <Input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <Button type="submit">Resend Activation Email</Button>
          </Form>
        )}
        {resendStatus && (
          <Message success={resendStatus.success}>{resendStatus.message}</Message>
        )}
        <Link onClick={() => navigate('/login')}>Back to Login</Link>
      </ActivationContent>
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
    </ActivationContainer>
  );
};

export default AccountActivation;
