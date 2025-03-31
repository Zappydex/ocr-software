import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// Keyframe Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideIn = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const progressFill = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const typewriter = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

// Styled Components
const AnimationContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
`;

const InvoiceProcessingFrame = styled.div`
  position: absolute;
  top: 50%;
  right: 5%;
  transform: translateY(-50%);
  width: 400px;
  height: 500px;
  background-color: rgba(245, 247, 250, 0.85);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  padding: 20px;
  opacity: ${props => props.visible ? 0.9 : 0};
  transition: opacity 0.8s ease;
  
  @media (max-width: 768px) {
    right: 50%;
    transform: translate(50%, -50%);
    width: 320px;
    height: 420px;
  }
`;

const FrameHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const FrameTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const InvoiceImage = styled.div`
  width: 100%;
  height: 180px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  padding: 10px;
  position: relative;
  background-image: url('/assets/invoice-template.svg');
  background-size: cover;
  background-position: center;
  display: ${props => props.visible ? 'block' : 'none'};
  animation: ${props => props.visible ? fadeIn : fadeOut} 0.5s ease forwards;
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: rgba(0, 150, 255, 0.5);
  box-shadow: 0 0 10px 5px rgba(0, 150, 255, 0.2);
  transform: translateY(${props => props.position}px);
  transition: transform 0.05s linear;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const ExtractionContainer = styled.div`
  width: 100%;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible ? 'translateY(0)' : 'translateY(10px)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

const ExtractionItem = styled.div`
  display: flex;
  margin-bottom: 8px;
  font-size: 12px;
`;

const ExtractionLabel = styled.div`
  width: 100px;
  color: #666;
  font-weight: 500;
`;

const ExtractionValue = styled.div`
  flex: 1;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  
  animation: ${props => props.typing ? typewriter : 'none'} 0.8s steps(${props => props.length || 20}) forwards;
`;

const ExcelPreview = styled.div`
  width: 100%;
  height: 150px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  display: ${props => props.visible ? 'flex' : 'none'};
  flex-direction: column;
  overflow: hidden;
  animation: ${fadeIn} 0.5s ease forwards;
`;

const ExcelHeader = styled.div`
  display: flex;
  background-color: #217346; /* Excel green */
  padding: 5px;
`;

const ExcelTab = styled.div`
  background-color: #fff;
  color: #333;
  padding: 3px 12px;
  border-radius: 4px 4px 0 0;
  font-size: 12px;
  font-weight: 500;
`;

const ExcelContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 5px;
  overflow: hidden;
`;

const ExcelRow = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  height: 20px;
  animation: ${props => props.animate ? slideIn : 'none'} 0.3s ease forwards;
  animation-delay: ${props => props.delay || 0}s;
  opacity: ${props => props.animate ? 0 : 1};
`;

const ExcelCell = styled.div`
  flex: 1;
  padding: 2px 5px;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-right: 1px solid #e0e0e0;
  color: ${props => props.header ? '#217346' : '#333'};
  font-weight: ${props => props.header ? 600 : 400};
`;

const ActionButton = styled.div`
  background-color: ${props => props.primary ? '#0056b3' : '#f0f0f0'};
  color: ${props => props.primary ? '#fff' : '#333'};
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  margin: 5px 0;
  width: fit-content;
  align-self: ${props => props.align || 'flex-start'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  animation: ${props => props.pulse ? pulse : 'none'} 0.6s ease;
  opacity: ${props => props.visible ? 1 : 0};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  margin: 8px 0;
  overflow: hidden;
  opacity: ${props => props.visible ? 1 : 0};
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #0056b3;
  width: ${props => props.progress}%;
  border-radius: 3px;
  transition: width 0.2s linear;
  animation: ${props => props.animate ? progressFill : 'none'} 2s linear forwards;
`;

const DownloadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible ? 'translateY(0)' : 'translateY(10px)'};
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

const ExcelIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #217346;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 5px;
  font-weight: bold;
  color: white;
  font-size: 14px;
`;

const InvoiceProcessingAnimation = () => {
  // Animation state
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [scanPosition, setScanPosition] = useState(0);
  const [extractionVisible, setExtractionVisible] = useState(false);
  const [typingFields, setTypingFields] = useState({});
  const [excelVisible, setExcelVisible] = useState(false);
  const [rowsAnimated, setRowsAnimated] = useState(false);
  const [exportButtonPulse, setExportButtonPulse] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [downloadButtonPulse, setDownloadButtonPulse] = useState(false);
  
  const scanRef = useRef(null);
  const animationTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  
  // Sample invoice data
  const invoiceData = {
    vendorName: "Acme Corporation",
    date: "March 28, 2025",
    invoiceNumber: "INV-2025-0329",
    address: "123 Business Ave, Suite 500",
    grandTotal: "$1,243.87",
    total: "$1,243.87"
  };
  
  // Reset the animation
  const resetAnimation = () => {
    setStep(0);
    setVisible(false);
    setScanPosition(0);
    setExtractionVisible(false);
    setTypingFields({});
    setExcelVisible(false);
    setRowsAnimated(false);
    setExportButtonPulse(false);
    setProgressVisible(false);
    setProgress(0);
    setDownloadVisible(false);
    setDownloadButtonPulse(false);
    
    // Clear any running timers
    if (scanRef.current) clearInterval(scanRef.current);
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };
  
  // Main animation controller
  useEffect(() => {
    // Start animation after a delay
    animationTimerRef.current = setTimeout(() => {
      setVisible(true);
      
      // Step 1: Scan the invoice
      animationTimerRef.current = setTimeout(() => {
        scanRef.current = setInterval(() => {
          setScanPosition(prev => {
            if (prev >= 170) {
              clearInterval(scanRef.current);
              setStep(1);
              return 0;
            }
            return prev + 5;
          });
        }, 50);
      }, 1000);
      
    }, 2000);
    
    // Cleanup on unmount
    return () => {
      resetAnimation();
    };
  }, []);
  
  // Handle step transitions
  useEffect(() => {
    if (step === 1) {
      // Show extraction
      setExtractionVisible(true);
      
      // Animate typing effect for each field with delays
      const fields = Object.keys(invoiceData);
      fields.forEach((field, index) => {
        setTimeout(() => {
          setTypingFields(prev => ({ ...prev, [field]: true }));
        }, 300 + index * 400);
      });
      
      // Move to next step after all fields are extracted
      animationTimerRef.current = setTimeout(() => {
        setStep(2);
      }, 300 + fields.length * 400 + 500);
    }
    
    if (step === 2) {
      // Show Excel
      setExcelVisible(true);
      
      // Animate rows appearing
      animationTimerRef.current = setTimeout(() => {
        setRowsAnimated(true);
        
        // Show export button with pulse
        animationTimerRef.current = setTimeout(() => {
          setExportButtonPulse(true);
          
          // Start progress after "clicking" export
          animationTimerRef.current = setTimeout(() => {
            setProgressVisible(true);
            
            // Animate progress bar
            let progressValue = 0;
            progressTimerRef.current = setInterval(() => {
              progressValue += 5;
              setProgress(progressValue);
              
              if (progressValue >= 100) {
                clearInterval(progressTimerRef.current);
                
                // Show download
                animationTimerRef.current = setTimeout(() => {
                  setDownloadVisible(true);
                  
                  // Pulse download button
                  animationTimerRef.current = setTimeout(() => {
                    setDownloadButtonPulse(true);
                    
                    // Complete the animation and reset after delay
                    animationTimerRef.current = setTimeout(() => {
                      resetAnimation();
                      
                      // Restart the animation after 5 seconds
                      animationTimerRef.current = setTimeout(() => {
                        setVisible(true);
                        setStep(0);
                        
                        // Restart from step 0
                        animationTimerRef.current = setTimeout(() => {
                          scanRef.current = setInterval(() => {
                            setScanPosition(prev => {
                              if (prev >= 170) {
                                clearInterval(scanRef.current);
                                setStep(1);
                                return 0;
                              }
                              return prev + 5;
                            });
                          }, 50);
                        }, 1000);
                      }, 5000);
                    }, 2000);
                  }, 500);
                }, 500);
              }
            }, 40);
          }, 800);
        }, 1000);
      }, 500);
    }
  }, [step]);
  
  return (
    <AnimationContainer>
      <InvoiceProcessingFrame visible={visible}>
        <FrameHeader>
          <FrameTitle>Invoice Processing</FrameTitle>
        </FrameHeader>
        
        <InvoiceImage visible={step < 2}>
          <ScanOverlay visible={step === 0} position={scanPosition} />
        </InvoiceImage>
        
        <ExtractionContainer visible={extractionVisible}>
          {Object.entries(invoiceData).map(([key, value]) => (
            <ExtractionItem key={key}>
              <ExtractionLabel>{key.replace(/([A-Z])/g, ' $1').trim()}:</ExtractionLabel>
              <ExtractionValue typing={typingFields[key]} length={value.length}>
                {typingFields[key] ? value : ''}
              </ExtractionValue>
            </ExtractionItem>
          ))}
        </ExtractionContainer>
        
        <ExcelPreview visible={excelVisible}>
          <ExcelHeader>
            <ExcelTab>Invoice-Data.xlsx</ExcelTab>
          </ExcelHeader>
          <ExcelContent>
            <ExcelRow>
              {['Vendor', 'Date', 'Invoice #', 'Address', 'Grand Total', 'Total'].map(header => (
                <ExcelCell key={header} header>{header}</ExcelCell>
              ))}
            </ExcelRow>
            <ExcelRow animate={rowsAnimated} delay={0.2}>
              {Object.values(invoiceData).map((value, index) => (
                <ExcelCell key={index}>{value}</ExcelCell>
              ))}
            </ExcelRow>
          </ExcelContent>
        </ExcelPreview>
        
        {excelVisible && (
          <ActionButton 
            primary 
            align="flex-end" 
            pulse={exportButtonPulse}
            visible={excelVisible}
          >
            Export to Excel
          </ActionButton>
        )}
        
        <ProgressBar visible={progressVisible}>
          <ProgressFill progress={progress} animate={progressVisible} />
        </ProgressBar>
        
        <DownloadContainer visible={downloadVisible}>
          <ExcelIcon>XLS</ExcelIcon>
          <ActionButton 
            primary 
            align="center"
            pulse={downloadButtonPulse}
            visible={downloadVisible}
          >
            Download Invoice_Data.xlsx
          </ActionButton>
        </DownloadContainer>
      </InvoiceProcessingFrame>
    </AnimationContainer>
  );
};

export default InvoiceProcessingAnimation;