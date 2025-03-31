// src/features/project/components/FileItem.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { downloadProjectFile } from '../../../services/project/api';

const TableRow = styled.tr`
  border-bottom: 1px solid #e9ecef;
  background-color: ${props => props.isSelected ? '#e9f5ff' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.isSelected ? '#e9f5ff' : '#f8f9fa'};
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #212529;
`;

const FileName = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
`;

const FileIcon = styled.div`
  width: 32px;
  height: 32px;
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
  font-size: 16px;
`;

const FileNameText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const FileDate = styled.div`
  white-space: nowrap;
`;

const VendorName = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
`;

const InvoiceNumber = styled.div`
  font-family: monospace;
`;

const FileSize = styled.div`
  white-space: nowrap;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #0056b3;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  
  &:hover {
    color: #004494;
  }
  
  &:disabled {
    color: #6c757d;
    cursor: not-allowed;
  }
`;

const FileItem = ({ file, projectId, onSelect, isSelected }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
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
  const handleDownload = async (e) => {
    // Prevent row selection when clicking download
    e.stopPropagation();
    
    try {
      setIsDownloading(true);
      const response = await downloadProjectFile(projectId, file.id);
      
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
  const handleView = (e) => {
    // Prevent row selection when clicking view
    e.stopPropagation();
    
    // Open file in new tab if it has a direct URL
    if (file.file_url) {
      window.open(file.file_url, '_blank');
    }
  };
  
  return (
    <TableRow isSelected={isSelected} onClick={onSelect}>
      <TableCell>
        <FileName>
          <FileIcon fileType={file.file_type}>
            <i className={getFileIcon(file.file_type)}></i>
          </FileIcon>
          <FileNameText title={file.file_name}>
            {file.file_name}
          </FileNameText>
        </FileName>
      </TableCell>
      <TableCell>
        <FileDate>{formatDate(file.processed_date)}</FileDate>
      </TableCell>
      <TableCell>
        <VendorName title={file.vendor_name || 'N/A'}>
          {file.vendor_name || 'N/A'}
        </VendorName>
      </TableCell>
      <TableCell>
        <InvoiceNumber>
          {file.invoice_number || 'N/A'}
        </InvoiceNumber>
      </TableCell>
      <TableCell>
        <FileSize>{formatFileSize(file.file_size)}</FileSize>
      </TableCell>
      <TableCell>
        <ActionsContainer>
          <ActionButton 
            onClick={handleView}
            disabled={!file.file_url}
            title={file.file_url ? 'View file' : 'Preview not available'}
          >
            <i className="fas fa-eye"></i>
          </ActionButton>
          <ActionButton 
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download file"
          >
            {isDownloading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-download"></i>
            )}
          </ActionButton>
        </ActionsContainer>
      </TableCell>
    </TableRow>
  );
};

export default FileItem;

      

   I'm sorry, I can't generate a response. Please try again. Error code: A9999
 

   I'm sorry, I can't generate a response. Please try again. Error code: A9999
 

