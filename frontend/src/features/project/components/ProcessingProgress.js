// src/features/project/components/ProcessingProgress.js
import React from 'react';
import styled from 'styled-components';

const ProgressContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 24px;
`;

const ProgressTitle = styled.h3`
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #343a40;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.status) {
      case 'Completed': return '#d4edda';
      case 'Failed': return '#f8d7da';
      case 'Queued': return '#e2e3e5';
      default: return '#cce5ff'; // Processing
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'Completed': return '#155724';
      case 'Failed': return '#721c24';
      case 'Queued': return '#383d41';
      default: return '#004085'; // Processing
    }
  }};
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background-color: ${props => {
    if (props.status === 'Failed') return '#dc3545';
    if (props.progress === 100) return '#28a745';
    return '#0056b3';
  }};
  transition: width 0.3s ease;
`;

const ProgressDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProgressPercentage = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #343a40;
`;

const ProgressMessage = styled.div`
  font-size: 14px;
  color: #6c757d;
`;

const CancelButton = styled.button`
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  
  &:hover {
    background-color: #e9ecef;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ProcessingProgress = ({ progress = 0, status = 'Processing', message = '', onCancel }) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Determine if processing is complete or failed
  const isComplete = status === 'Completed';
  const isFailed = status === 'Failed';
  const isProcessing = !isComplete && !isFailed;
  
  return (
    <ProgressContainer>
      <ProgressTitle>
        Processing Invoices
        <StatusBadge status={status}>{status}</StatusBadge>
      </ProgressTitle>
      
      <ProgressBarContainer>
        <ProgressBarFill 
          progress={normalizedProgress} 
          status={status}
        />
      </ProgressBarContainer>
      
      <ProgressDetails>
        <ProgressPercentage>{normalizedProgress}% Complete</ProgressPercentage>
        {isProcessing && onCancel && (
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
        )}
      </ProgressDetails>
      
      <ProgressMessage>
        {message || `${status}... Please wait.`}
      </ProgressMessage>
    </ProgressContainer>
  );
};

export default ProcessingProgress;

