import React, { useState } from 'react';
import styled from 'styled-components';
import { GoogleLogin } from '@react-oauth/google';
import { registerUser, registerWithGoogle } from '../../../services/auth/api';
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ModalBackground = styled.div`
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

const ModalContent = styled.div`
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
`;

const Link = styled.a`
  color: #0056b3;
  text-decoration: none;
  margin: 8px 0;
  cursor: pointer;
  font-size: 12px;
  &:hover {
    text-decoration: underline;
  }
`;

const Text = styled.p`
  font-size: 10px;
  color: #767676;
  text-align: center;
  margin: 8px 0;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 15px 0;
  width: 100%;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #cdcdcd;
  }
  
  span {
    padding: 0 8px;
    color: #767676;
    font-size: 12px;
  }
`;

const GoogleButton = styled(Button)`
  background-color: white;
  color: #0056b3;
  border: 2px solid #0056b3;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    background-color: #f0f0f0;
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

const Register = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password1 !== password2) {
      toast.error("Passwords don't match");
      return;
    }
    setIsLoading(true);
    try {
      await registerUser({ email, username, password1, password2 });
      toast.success('Registration successful! Please check your email to activate your account.');
      setTimeout(() => {
        setIsLoading(false);
        if (onClose) onClose();
      }, 1000);
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await registerWithGoogle(credentialResponse.credential);
      toast.success('Google registration successful!');
      setTimeout(() => {
        setIsLoading(false);
        if (onClose) onClose();
        navigate('/dashboard', { state: { user: response.data } });
      }, 1000);
    } catch (error) {
      console.error('Google registration failed:', error);
      toast.error('Google registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    setIsLoginOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
  };

  // For direct rendering (not as a modal)
  return (
    <Container>
      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <Input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <Input 
            type="password" 
            placeholder="Create a password" 
            value={password1} 
            onChange={(e) => setPassword1(e.target.value)} 
            required 
          />
          <Input 
            type="password" 
            placeholder="Confirm password" 
            value={password2} 
            onChange={(e) => setPassword2(e.target.value)} 
            required 
          />
          <Button type="submit">Continue</Button>
        </Form>
        <Divider><span>OR</span></Divider>
        <GoogleLogin
          onSuccess={handleGoogleRegister}
          onError={() => toast.error('Google Registration Failed')}
          render={renderProps => (
            <GoogleButton onClick={renderProps.onClick} disabled={renderProps.disabled}>
              Continue with Google
            </GoogleButton>
          )}
        />
        <Text>
          Have an account? <Link onClick={handleLoginClick}>Log in</Link>
        </Text>
      </FormContainer>
      {isLoginOpen && <Login isOpen={isLoginOpen} onClose={handleCloseLogin} />}
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

export default Register;
