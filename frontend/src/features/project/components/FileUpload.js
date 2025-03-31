// src/features/project/components/FileUpload.js
import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const UploadContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 24px;
`;

const UploadTitle = styled.h3`
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #343a40;
`;

const UploadArea = styled.div`
  border: 2px dashed #ced4da;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s;
  background-color: ${props => props.isDragging ? '#e9f5ff' : '#f8f9fa'};
  border-color: ${props => props.isDragging ? '#0056b3' : '#ced4da'};
  
  &:hover {
    border-color: #0056b3;
    background-color: #e9f5ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 48px;
  color: #6c757d;
  margin-bottom: 16px;
`;

const UploadText = styled.div`
  font-size: 16px;
  color: #495057;
  margin-bottom: 16px;
`;

const UploadSubtext = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 16px;
`;

const BrowseButton = styled.button`
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #004494;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const SelectedFilesContainer = styled.div`
  margin-top: 24px;
  border-top: 1px solid #e9ecef;
  padding-top: 16px;
`;

const SelectedFilesTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #343a40;
`;

const FilesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FileItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #f8f9fa;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
`;

const FileIcon = styled.div`
  font-size: 16px;
  margin-right: 12px;
  color: #0056b3;
`;

const FileName = styled.div`
  font-size: 14px;
  color: #212529;
`;

const FileSize = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-left: 8px;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    color: #bd2130;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 12px;
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

const UploadButton = styled.button`
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #004494;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f8d7da;
  border-radius: 4px;
`;

const FileUpload = ({ onUpload, isProcessing, disabled }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    validateAndAddFiles(files);
  };
  
  // Validate and add files
  const validateAndAddFiles = (files) => {
    setError(null);
    
    // Check file types
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Only PDF, JPEG, PNG, and TIFF files are supported.`);
      return;
    }
    
    // Check file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum file size is 10MB.`);
      return;
    }
    
    // Add files to selected files
    setSelectedFiles(prev => [...prev, ...files]);
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle remove file
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle clear all
  const handleClearAll = () => {
    setSelectedFiles([]);
    setError(null);
  };
  
  // Handle upload
  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }
    
    onUpload(selectedFiles);
  };
  
  return (
    <UploadContainer>
      <UploadTitle>Upload Invoices</UploadTitle>
      
      <UploadArea 
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadIcon>
          <i className="fas fa-cloud-upload-alt"></i>
        </UploadIcon>
        <UploadText>Drag and drop files here</UploadText>
        <UploadSubtext>Supported formats: PDF, JPEG, PNG, TIFF (Max 10MB)</UploadSubtext>
        <BrowseButton 
          onClick={handleBrowseClick}
          disabled={isProcessing || disabled}
        >
          Browse Files
        </BrowseButton>
        <FileInput 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff"
          disabled={isProcessing || disabled}
        />
      </UploadArea>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {selectedFiles.length > 0 && (
        <SelectedFilesContainer>
          <SelectedFilesTitle>Selected Files ({selectedFiles.length})</SelectedFilesTitle>
          <FilesList>
            {selectedFiles.map((file, index) => (
              <FileItem key={index}>
                <FileInfo>
                  <FileIcon>
                    <i className={
                      file.type.includes('pdf') ? 'fas fa-file-pdf' :
                      file.type.includes('image') ? 'fas fa-file-image' :
                      'fas fa-file'
                    }></i>
                  </FileIcon>
                  <FileName>{file.name}</FileName>
                  <FileSize>({formatFileSize(file.size)})</FileSize>
                </FileInfo>
                <RemoveButton 
                  onClick={() => handleRemoveFile(index)}
                  disabled={isProcessing || disabled}
                >
                  <i className="fas fa-times"></i>
                </RemoveButton>
              </FileItem>
            ))}
          </FilesList>
          
          <ButtonsContainer>
            <CancelButton 
              onClick={handleClearAll}
              disabled={isProcessing || disabled}
            >
              Clear All
            </CancelButton>
            <UploadButton 
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isProcessing || disabled}
            >
              {isProcessing ? 'Processing...' : 'Process Invoices'}
            </UploadButton>
          </ButtonsContainer>
        </SelectedFilesContainer>
      )}
    </UploadContainer>
  );
};

export default FileUpload;

