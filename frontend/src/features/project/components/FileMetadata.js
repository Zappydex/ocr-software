// src/features/project/components/FileMetadata.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { downloadProjectFile } from '../../../services/project/api';

const MetadataContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  overflow: hidden;
`;

const MetadataHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #343a40;
  display: flex;
  align-items: center;
`;

const FileIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.fileType) {
      case 'pdf': return '#dc3545';
      case 'excel': return '#28a745';
      case 'image': return '#0056b3';
      default: return '#6c757d';
    }
  }};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background-color: ${props => props.primary ? '#0056b3' : '#f8f9fa'};
  color: ${props => props.primary ? '#ffffff' : '#495057'};
  border: ${props => props.primary ? 'none' : '1px solid #ced4da'};
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: ${props => props.primary ? '#004494' : '#e9ecef'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  i {
    margin-right: 6px;
  }
`;

const MetadataContent = styled.div`
  padding: 20px;
`;

const MetadataSection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  margin: 0 0 12px 0;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const MetadataItem = styled.div`
  margin-bottom: 12px;
`;

const MetadataLabel = styled.div`
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 4px;
`;

const MetadataValue = styled.div`
  font-size: 15px;
  color: #212529;
  word-break: break-word;
`;

const PreviewContainer = styled.div`
  margin-top: 20px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  max-height: 300px;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  height: auto;
  display: block;
`;

const PDFPreview = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #6c757d;
`;

const NoPreviewMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #6c757d;
  background-color: #f8f9fa;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 20px;
`;

const Tab = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#0056b3' : '#495057'};
  border-bottom: ${props => props.active ? '2px solid #0056b3' : 'none'};
  
  &:hover {
    color: #0056b3;
  }
`;

const FileMetadata = ({ file }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  if (!file) {
    return (
      <MetadataContainer>
        <MetadataHeader>
          <HeaderTitle>File Details</HeaderTitle>
        </MetadataHeader>
        <MetadataContent>
          <NoPreviewMessage>Select a file to view its details</NoPreviewMessage>
        </MetadataContent>
      </MetadataContainer>
    );
  }
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get file icon
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return 'fas fa-file-pdf';
      case 'excel': return 'fas fa-file-excel';
      case 'image': return 'fas fa-file-image';
      default: return 'fas fa-file';
    }
  };
  
  // Handle download
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await downloadProjectFile(file.project_id, file.id);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = response.download_url;
      link.setAttribute('download', response.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Handle view
  const handleView = () => {
    // Open file in new tab if it has a direct URL
    if (file.file_url) {
      window.open(file.file_url, '_blank');
    }
  };
  
  // Render file preview based on type
  const renderPreview = () => {
    if (!file.file_url) {
      return <NoPreviewMessage>No preview available</NoPreviewMessage>;
    }
    
    switch (file.file_type) {
      case 'image':
        return <ImagePreview src={file.file_url} alt={file.file_name} />;
      case 'pdf':
        return (
          <PDFPreview>
            <ActionButton onClick={handleView}>
              <i className="fas fa-external-link-alt"></i> Open PDF
            </ActionButton>
          </PDFPreview>
        );
      default:
        return <NoPreviewMessage>Preview not available for this file type</NoPreviewMessage>;
    }
  };
  
  return (
    <MetadataContainer>
      <MetadataHeader>
        <HeaderTitle>
          <FileIcon fileType={file.file_type}>
            <i className={getFileIcon(file.file_type)}></i>
          </FileIcon>
          {file.file_name}
        </HeaderTitle>
        <HeaderActions>
          <ActionButton onClick={handleView} disabled={!file.file_url}>
            <i className="fas fa-eye"></i> View
          </ActionButton>
          <ActionButton primary onClick={handleDownload} disabled={isDownloading}>
            <i className={isDownloading ? "fas fa-spinner fa-spin" : "fas fa-download"}></i>
            {isDownloading ? 'Downloading...' : 'Download'}
          </ActionButton>
        </HeaderActions>
      </MetadataHeader>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'details'} 
          onClick={() => setActiveTab('details')}
        >
          Details
        </Tab>
        <Tab 
          active={activeTab === 'preview'} 
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </Tab>
        {file.has_anomalies && (
          <Tab 
            active={activeTab === 'anomalies'} 
            onClick={() => setActiveTab('anomalies')}
          >
            Anomalies
          </Tab>
        )}
      </TabsContainer>
      
      <MetadataContent>
        {activeTab === 'details' && (
          <>
            <MetadataSection>
              <SectionTitle>File Information</SectionTitle>
              <MetadataGrid>
                <MetadataItem>
                  <MetadataLabel>File Name</MetadataLabel>
                  <MetadataValue>{file.file_name}</MetadataValue>
                </MetadataItem>
                <MetadataItem>
                  <MetadataLabel>File Type</MetadataLabel>
                  <MetadataValue>{file.file_type.toUpperCase()}</MetadataValue>
                </MetadataItem>
                <MetadataItem>
                  <MetadataLabel>File Size</MetadataLabel>
                  <MetadataValue>{formatFileSize(file.file_size)}</MetadataValue>
                </MetadataItem>
                <MetadataItem>
                  <MetadataLabel>Processed Date</MetadataLabel>
                  <MetadataValue>{formatDate(file.processed_date)}</MetadataValue>
                </MetadataItem>
              </MetadataGrid>
            </MetadataSection>
            
            {(file.invoice_number || file.vendor_name || file.invoice_date || file.invoice_amount) && (
              <MetadataSection>
                <SectionTitle>Invoice Information</SectionTitle>
                <MetadataGrid>
                  {file.invoice_number && (
                    <MetadataItem>
                      <MetadataLabel>Invoice Number</MetadataLabel>
                      <MetadataValue>{file.invoice_number}</MetadataValue>
                    </MetadataItem>
                  )}
                  {file.vendor_name && (
                    <MetadataItem>
                      <MetadataLabel>Vendor</MetadataLabel>
                      <MetadataValue>{file.vendor_name}</MetadataValue>
                    </MetadataItem>
                  )}
                  {file.invoice_date && (
                    <MetadataItem>
                      <MetadataLabel>Invoice Date</MetadataLabel>
                      <MetadataValue>{formatDate(file.invoice_date)}</MetadataValue>
                    </MetadataItem>
                  )}
                  {file.invoice_amount && (
                    <MetadataItem>
                      <MetadataLabel>Amount</MetadataLabel>
                      <MetadataValue>
                        {typeof file.invoice_amount === 'number' 
                          ? file.invoice_amount.toLocaleString('en-US', {
                              style: 'currency',
                              currency: file.currency || 'USD'
                            })
                          : file.invoice_amount
                        }
                      </MetadataValue>
                    </MetadataItem>
                  )}
                  {file.currency && (
                    <MetadataItem>
                      <MetadataLabel>Currency</MetadataLabel>
                      <MetadataValue>{file.currency}</MetadataValue>
                    </MetadataItem>
                  )}
                </MetadataGrid>
              </MetadataSection>
            )}
            
            {file.ocr_confidence && (
              <MetadataSection>
                <SectionTitle>OCR Information</SectionTitle>
                <MetadataGrid>
                  <MetadataItem>
                    <MetadataLabel>OCR Confidence</MetadataLabel>
                    <MetadataValue>{(file.ocr_confidence * 100).toFixed(2)}%</MetadataValue>
                  </MetadataItem>
                  {file.processing_time && (
                    <MetadataItem>
                      <MetadataLabel>Processing Time</MetadataLabel>
                      <MetadataValue>{file.processing_time.toFixed(2)} seconds</MetadataValue>
                    </MetadataItem>
                  )}
                  {file.has_anomalies && (
                    <MetadataItem>
                      <MetadataLabel>Anomalies</MetadataLabel>
                      <MetadataValue>
                        <span style={{ color: '#dc3545' }}>Yes</span> - 
                        <span 
                          style={{ color: '#0056b3', cursor: 'pointer', marginLeft: '5px' }}
                          onClick={() => setActiveTab('anomalies')}
                        >
                          View Anomalies
                        </span>
                      </MetadataValue>
                    </MetadataItem>
                  )}
                </MetadataGrid>
              </MetadataSection>
            )}
          </>
        )}
        
        {activeTab === 'preview' && (
          <PreviewContainer>
            {renderPreview()}
          </PreviewContainer>
        )}
        
        {activeTab === 'anomalies' && file.has_anomalies && (
          <MetadataSection>
            <SectionTitle>Detected Anomalies</SectionTitle>
            {file.anomalies && file.anomalies.length > 0 ? (
              file.anomalies.map((anomaly, index) => (
                <div key={index} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{anomaly.anomaly_type}</div>
                  <div style={{ fontSize: '14px', color: '#495057' }}>{anomaly.description}</div>
                </div>
              ))
            ) : (
              <NoPreviewMessage>Anomaly details not available</NoPreviewMessage>
            )}
          </MetadataSection>
        )}
      </MetadataContent>
    </MetadataContainer>
  );
};

export default FileMetadata;
