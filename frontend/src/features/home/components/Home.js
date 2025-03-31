// frontend/src/features/home/components/Home.js

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import InvoiceProcessingAnimation from './InvoiceProcessingAnimation';

// Styled components
const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: white;
  font-family: 'Arial', sans-serif;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 300px;
    height: 300px;
    background: url('/assets/floating-documents-1.svg') no-repeat;
    background-size: contain;
    opacity: 0.15;
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: url('/assets/floating-documents-2.svg') no-repeat;
    background-size: contain;
    opacity: 0.15;
    z-index: 0;
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 15px 30px;
  box-sizing: border-box;
  position: relative;
  z-index: 10;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
`;

const LogoMainText = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
  
  span:first-child {
    color: black;
  }
  
  span:last-child {
    color: #0056b3;
  }
`;

const LogoSubText = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-top: 4px;
`;

const HamburgerIcon = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  z-index: 1000;
  
  span {
    display: block;
    width: 25px;
    height: 3px;
    background-color: black;
    margin-bottom: 4px;
    border-radius: 3px;
    transition: all 0.3s ease;
  }
`;

const MenuOverlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 250px;
  height: 100vh;
  background-color: white;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 900;
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(100%)'};
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  padding: 80px 20px 20px;
`;

const MenuItem = styled.a`
  color: #333;
  text-decoration: none;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  
  &:hover {
    color: #0056b3;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 800;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  width: 90%;
  margin: 60px auto;
  text-align: center;
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -100px;
    right: -150px;
    width: 250px;
    height: 250px;
    background: url('/assets/floating-documents-3.svg') no-repeat;
    background-size: contain;
    opacity: 0.1;
    z-index: -1;
  }
`;

const Headline = styled.h1`
  font-size: 2.2rem;
  line-height: 1.3;
  margin-bottom: 24px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.9rem;
  }
`;

const HighlightText = styled.span`
  color: #0056b3;
  font-weight: bold;
`;

const Subtext = styled.p`
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const CTASection = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`;

const PrimaryButton = styled.button`
  padding: 12px 28px;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #004494;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SecondaryButton = styled.button`
  padding: 12px 28px;
  background-color: white;
  color: #0056b3;
  border: 2px solid #0056b3;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const TrustedBySection = styled.div`
  font-weight: bold;
  color: black;
  font-size: 1.1rem;
`;

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && menuOpen) {
        closeMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <HomeContainer>
    <InvoiceProcessingAnimation />
      <Header>
        <Logo>
          <LogoMainText>
            <span>INVO</span><span>TEX</span>
          </LogoMainText>
          <LogoSubText>Invoice AI</LogoSubText>
        </Logo>
        <HamburgerIcon onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </HamburgerIcon>
      </Header>
      
      <Backdrop isOpen={menuOpen} onClick={closeMenu} />
      <MenuOverlay isOpen={menuOpen} ref={menuRef}>
        <MenuItem href="#" onClick={closeMenu}>Home</MenuItem>
        <MenuItem href="#" onClick={closeMenu}>Features</MenuItem>
        <MenuItem href="#" onClick={closeMenu}>Pricing</MenuItem>
        <MenuItem href="#" onClick={closeMenu}>About Us</MenuItem>
        <MenuItem href="#" onClick={closeMenu}>Contact</MenuItem>
      </MenuOverlay>
      
      <MainContent>
        <Headline>
          The Only <HighlightText>OCR Software</HighlightText> that Automates Document Workflows in Seconds
        </Headline>
        <Subtext>
          Move beyond manual data entry errors to drive 10x faster document processing. Discover the top optical character recognition (OCR) software to consider in 2025.
        </Subtext>
        <CTASection>
          <PrimaryButton onClick={handleRegisterClick}>Register</PrimaryButton>
          <SecondaryButton onClick={handleLoginClick}>Login</SecondaryButton>
        </CTASection>
        <TrustedBySection>
          Trusted by 10,000+ companies.
        </TrustedBySection>
      </MainContent>
    </HomeContainer>
  );
};

export default Home;


