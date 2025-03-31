// src/features/project/components/FilesList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import FileItem from './FileItem';
import { fetchProjectFiles } from '../../../services/project/api';
import Pagination from '../../../components/common/Pagination';

const FilesContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const FilesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
`;

const FilesTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #343a40;
`;

const FilesCount = styled.span`
  font-size: 14px;
  color: #6c757d;
  margin-left: 8px;
`;

const FilesActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #e9ecef;
  }
  
  i {
    margin-right: 6px;
  }
`;

const FilesList = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

const FilesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TableHeaderRow = styled.tr`
  border-bottom: 1px solid #e9ecef;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
`;

const TableBody = styled.tbody``;

const NoFilesMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #6c757d;
`;

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #dc3545;
  background-color: #f8d7da;
  border-radius: 4px;
  margin: 20px;
`;

const PaginationContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #e9ecef;
`;

const FilesList = ({ 
  projectId, 
  files: propFiles, 
  onFileSelect, 
  searchQuery = '', 
  filterOptions = {} 
}) => {
  const navigate = useNavigate();
  
  // State
  const [files, setFiles] = useState(propFiles || []);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(!propFiles);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('processed_date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Load files if not provided as props
  useEffect(() => {
    if (propFiles) {
      setFiles(propFiles);
      setIsLoading(false);
    } else if (projectId) {
      loadFiles();
    }
  }, [projectId, propFiles]);
  
  // Apply search and filters
  useEffect(() => {
    if (!files.length) return;
    
    let result = [...files];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file => 
        file.file_name.toLowerCase().includes(query) ||
        (file.invoice_number && file.invoice_number.toLowerCase().includes(query)) ||
        (file.vendor_name && file.vendor_name.toLowerCase().includes(query))
      );
    }
    
    // Apply filters
    if (filterOptions) {
      // Date range filter
      if (filterOptions.dateFrom) {
        const dateFrom = new Date(filterOptions.dateFrom);
        result = result.filter(file => new Date(file.processed_date) >= dateFrom);
      }
      
      if (filterOptions.dateTo) {
        const dateTo = new Date(filterOptions.dateTo);
        dateTo.setHours(23, 59, 59, 999); // End of day
        result = result.filter(file => new Date(file.processed_date) <= dateTo);
      }
      
      // Vendor filter
      if (filterOptions.vendor) {
        result = result.filter(file => 
          file.vendor_name && file.vendor_name.toLowerCase().includes(filterOptions.vendor.toLowerCase())
        );
      }
      
      // File type filter
      if (filterOptions.fileType) {
        result = result.filter(file => file.file_type === filterOptions.fileType);
      }
      
      // File size filter
      if (filterOptions.fileSizeMin) {
        result = result.filter(file => file.file_size >= parseInt(filterOptions.fileSizeMin));
      }
      
      if (filterOptions.fileSizeMax) {
        result = result.filter(file => file.file_size <= parseInt(filterOptions.fileSizeMax));
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      // Handle dates
      if (sortField === 'processed_date') {
        fieldA = new Date(fieldA);
        fieldB = new Date(fieldB);
      }
      
      // Handle nulls
      if (fieldA === null) return 1;
      if (fieldB === null) return -1;
      
      // Compare
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredFiles(result);
  }, [files, searchQuery, filterOptions, sortField, sortDirection]);
  
  // Load files from API
  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchProjectFiles(projectId);
      setFiles(data);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };
  
  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Handle export all
  const handleExportAll = () => {
    // This would be implemented to export all files
    console.log('Export all files');
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadFiles();
  };
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFiles.slice(indexOfFirstItem, indexOfLastItem);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Render loading state
  if (isLoading) {
    return (
      <FilesContainer>
        <FilesHeader>
          <FilesTitle>Files</FilesTitle>
        </FilesHeader>
        <LoadingMessage>Loading files...</LoadingMessage>
      </FilesContainer>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <FilesContainer>
        <FilesHeader>
          <FilesTitle>Files</FilesTitle>
          <FilesActions>
            <ActionButton onClick={handleRefresh}>
              <i className="fas fa-sync-alt"></i> Retry
            </ActionButton>
          </FilesActions>
        </FilesHeader>
        <ErrorMessage>{error}</ErrorMessage>
      </FilesContainer>
    );
  }
  
  return (
    <FilesContainer>
      <FilesHeader>
        <div>
          <FilesTitle>Files</FilesTitle>
          <FilesCount>({filteredFiles.length})</FilesCount>
        </div>
        <FilesActions>
          <ActionButton onClick={handleExportAll}>
            <i className="fas fa-file-export"></i> Export All
          </ActionButton>
          <ActionButton onClick={handleRefresh}>
            <i className="fas fa-sync-alt"></i> Refresh
          </ActionButton>
        </FilesActions>
      </FilesHeader>
      
      {filteredFiles.length === 0 ? (
        <NoFilesMessage>
          {searchQuery || Object.keys(filterOptions).length > 0 
            ? 'No files match your search criteria' 
            : 'No files available for this project'}
        </NoFilesMessage>
      ) : (
        <>
          <FilesList>
            <FilesTable>
              <TableHeader>
                <TableHeaderRow>
                  <TableHeaderCell 
                    onClick={() => handleSort('file_name')}
                    style={{ cursor: 'pointer' }}
                  >
                    File Name
                    {sortField === 'file_name' && (
                      <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </TableHeaderCell>
                  <TableHeaderCell 
                    onClick={() => handleSort('processed_date')}
                    style={{ cursor: 'pointer' }}
                  >
                    Date
                    {sortField === 'processed_date' && (
                      <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </TableHeaderCell>
                  <TableHeaderCell 
                    onClick={() => handleSort('vendor_name')}
                    style={{ cursor: 'pointer' }}
                  >
                    Vendor
                    {sortField === 'vendor_name' && (
                      <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </TableHeaderCell>
                  <TableHeaderCell 
                    onClick={() => handleSort('invoice_number')}
                    style={{ cursor: 'pointer' }}
                  >
                    Invoice #
                    {sortField === 'invoice_number' && (
                      <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </TableHeaderCell>
                  <TableHeaderCell 
                    onClick={() => handleSort('file_size')}
                    style={{ cursor: 'pointer' }}
                  >
                    Size
                    {sortField === 'file_size' && (
                      <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableHeaderRow>
              </TableHeader>
              <TableBody>
                {currentItems.map(file => (
                  <FileItem 
                    key={file.id}
                    file={file}
                    projectId={projectId}
                    onSelect={() => handleFileSelect(file)}
                    isSelected={selectedFile && selectedFile.id === file.id}
                  />
                ))}
              </TableBody>
            </FilesTable>
          </FilesList>
          
          <PaginationContainer>
            <Pagination 
              itemsPerPage={itemsPerPage}
              totalItems={filteredFiles.length}
              currentPage={currentPage}
              paginate={paginate}
            />
          </PaginationContainer>
        </>
      )}
    </FilesContainer>
  );
};

export default FilesList;
