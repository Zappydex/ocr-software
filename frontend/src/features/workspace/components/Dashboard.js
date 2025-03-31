// src/features/workspace/components/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { WorkspaceContext } from '../../../context/WorkspaceContext';
import { AuthContext } from '../../../context/AuthContext';
import DashboardHeader from './DashboardHeader';
import FileUpload from '../../project/components/FileUpload';
import ProcessingProgress from '../../project/components/ProcessingProgress';
import FileMetadata from '../../project/components/FileMetadata';
import FilesList from '../../project/components/FilesList';
import AnomaliesList from '../../project/components/AnomaliesList';
import ProjectSearch from '../../search_filter/components/ProjectSearch';
import ProjectFilter from '../../search_filter/components/ProjectFilter';
import { 
  fetchProject, 
  fetchProjectFiles, 
  fetchProjectAnomalies,
  processInvoices,
  checkOCRStatus,
  cancelOCRProcess
} from '../../../services/project/api';
import '../styles/dashboard.css';

// Styled components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const DashboardContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const MainPanel = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const SidePanel = styled.div`
  width: 320px;
  background-color: #f8f9fa;
  border-left: 1px solid #e9ecef;
  padding: 20px;
  overflow-y: auto;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 20px;
`;

const Tab = styled.div`
  padding: 12px 20px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#0056b3' : '#495057'};
  border-bottom: ${props => props.active ? '2px solid #0056b3' : 'none'};
  
  &:hover {
    color: #0056b3;
  }
`;

const RecentActivitiesContainer = styled.div`
  margin-bottom: 24px;
`;

const RecentActivitiesTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 12px;
  color: #343a40;
`;

const ActivityItem = styled.div`
  padding: 12px;
  border-radius: 6px;
  background-color: #f8f9fa;
  margin-bottom: 8px;
  
  &:hover {
    background-color: #e9ecef;
  }
`;

const ActivityFileName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const ActivityExportFile = styled.div`
  font-size: 13px;
  color: #0056b3;
  margin-left: 16px;
  cursor: pointer;
`;

const ActivityTimestamp = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
`;

const DownloadSection = styled.div`
  margin-top: 24px;
`;

const DownloadTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 12px;
  color: #343a40;
`;

const DownloadItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  background-color: #f8f9fa;
  margin-bottom: 8px;
  cursor: pointer;
  
  &:hover {
    background-color: #e9ecef;
  }
`;

const FileIcon = styled.div`
  width: 32px;
  height: 32px;
  background-color: #28a745;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  margin-right: 12px;
`;

const FileDetails = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-weight: 500;
  font-size: 14px;
`;

const FileDate = styled.div`
  font-size: 12px;
  color: #6c757d;
`;

const NoDataMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #6c757d;
`;

const Dashboard = ({ project: propProject }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { activeProject, setActiveProject } = useContext(WorkspaceContext);
  
  // Local state
  const [project, setProject] = useState(propProject || activeProject);
  const [activeTab, setActiveTab] = useState('files');
  const [files, setFiles] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTask, setProcessingTask] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({});

  // Check authentication and load project data
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // If no project is provided, load from URL parameter
    if (!project && projectId) {
      loadProject(projectId);
    } else if (project && project.id.toString() !== projectId) {
      // If project ID in URL doesn't match current project, load the correct one
      loadProject(projectId);
    } else if (project) {
      // If project is already loaded, fetch its files and anomalies
      loadProjectData(project.id);
    }
  }, [isAuthenticated, project, projectId, navigate]);

  // Load project data
  const loadProject = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const projectData = await fetchProject(id);
      setProject(projectData);
      setActiveProject(projectData);
      await loadProjectData(id);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load project files and anomalies
  const loadProjectData = async (projectId) => {
    try {
      setIsLoading(true);
      
      // Fetch files
      const filesData = await fetchProjectFiles(projectId);
      setFiles(filesData);
      
      // Extract downloadable files (Excel exports)
      const excelFiles = filesData.filter(file => file.file_type === 'excel');
      setDownloadableFiles(excelFiles);
      
      // Create recent activities from files
      const activities = filesData.slice(0, 5).map(file => ({
        id: file.id,
        originalFile: file.file_name,
        exportedFile: file.file_type === 'excel' ? file.file_name : null,
        timestamp: file.processed_date,
        projectId: projectId
      }));
      setRecentActivities(activities);
      
      // Fetch anomalies
      const anomaliesData = await fetchProjectAnomalies(projectId);
      setAnomalies(anomaliesData);
      
    } catch (err) {
      console.error('Error loading project data:', err);
      setError('Failed to load project data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload and processing
  const handleFileUpload = async (files) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStatus('Starting processing...');
      
      // Start OCR processing
      const response = await processInvoices(project.id, files);
      const { task_id } = response;
      
      if (task_id) {
        setProcessingTask(task_id);
        // Start polling for status updates
        startStatusPolling(task_id);
      } else {
        throw new Error('No task ID returned from processing request');
      }
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Failed to process files. Please try again.');
      setIsProcessing(false);
    }
  };

  // Poll for OCR processing status
  const startStatusPolling = (taskId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusData = await checkOCRStatus(project.id, taskId);
        
        setProcessingProgress(statusData.progress || 0);
        setProcessingStatus(statusData.status || 'Processing');
        
        // If processing is complete or failed
        if (statusData.status === 'Completed' || statusData.status === 'Failed') {
          clearInterval(pollInterval);
          setIsProcessing(false);
          
          if (statusData.status === 'Completed') {
            // Reload project data to show new files
            loadProjectData(project.id);
          }
        }
      } catch (err) {
        console.error('Error checking OCR status:', err);
        clearInterval(pollInterval);
        setIsProcessing(false);
        setError('Failed to check processing status. Please refresh the page.');
      }
    }, 2000); // Poll every 2 seconds
    
    // Store interval ID for cleanup
    return () => clearInterval(pollInterval);
  };

  // Cancel OCR processing
  const handleCancelProcessing = async () => {
    if (processingTask) {
      try {
        await cancelOCRProcess(project.id, processingTask);
        setIsProcessing(false);
        setProcessingTask(null);
      } catch (err) {
        console.error('Error canceling OCR process:', err);
        setError('Failed to cancel processing. Please try again.');
      }
    }
  };

  // Handle file selection for metadata display
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  // Handle file download
  const handleFileDownload = async (file) => {
    try {
      // File download logic will be implemented in FilesList component
      // This is just a placeholder for any dashboard-level logic
      console.log('Downloading file:', file.id);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  // Handle search within project
  const handleSearch = (query) => {
    setSearchQuery(query);
    // Search logic will be implemented in ProjectSearch component
  };

  // Handle filtering within project
  const handleFilterChange = (filters) => {
    setFilterOptions(filters);
    // Filter logic will be implemented in ProjectFilter component
  };

  // Render loading state
  if (isLoading && !project) {
    return <div>Loading project dashboard...</div>;
  }

  // Render error state
  if (error && !project) {
    return <div className="error-message">{error}</div>;
  }

  // Render no project state
  if (!project) {
    return <div>No project selected. Please select a project from the workspace.</div>;
  }

  return (
    <DashboardContainer>
      <DashboardHeader 
        project={project}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />
      
      <DashboardContent>
        <MainPanel>
          {/* File Upload and Processing Section */}
          <FileUpload 
            onUpload={handleFileUpload}
            isProcessing={isProcessing}
            disabled={isProcessing}
          />
          
          {isProcessing && (
            <ProcessingProgress 
              progress={processingProgress}
              status={processingStatus}
              onCancel={handleCancelProcessing}
            />
          )}
          
          {selectedFile && (
            <FileMetadata file={selectedFile} />
          )}
          
          {/* Tabs for Files and Anomalies */}
          <TabContainer>
            <Tab 
              active={activeTab === 'files'} 
              onClick={() => setActiveTab('files')}
            >
              Files
            </Tab>
            <Tab 
              active={activeTab === 'anomalies'} 
              onClick={() => setActiveTab('anomalies')}
            >
              Anomalies
            </Tab>
          </TabContainer>
          
          {/* Tab Content */}
          {activeTab === 'files' ? (
            <FilesList 
              files={files}
              projectId={project.id}
              onFileSelect={handleFileSelect}
              searchQuery={searchQuery}
              filterOptions={filterOptions}
            />
          ) : (
            <AnomaliesList 
              anomalies={anomalies}
              projectId={project.id}
              searchQuery={searchQuery}
              filterOptions={filterOptions}
            />
          )}
        </MainPanel>
        
        <SidePanel>
          {/* Recent Activities Section */}
          <RecentActivitiesContainer>
            <RecentActivitiesTitle>Recent Activities</RecentActivitiesTitle>
            
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <ActivityItem key={activity.id}>
                  <ActivityFileName>{activity.originalFile}</ActivityFileName>
                  {activity.exportedFile && (
                    <ActivityExportFile 
                      onClick={() => handleFileDownload({ id: activity.id, file_name: activity.exportedFile })}
                    >
                      {activity.exportedFile}
                    </ActivityExportFile>
                  )}
                  <ActivityTimestamp>
                    {new Date(activity.timestamp).toLocaleString()}
                  </ActivityTimestamp>
                </ActivityItem>
              ))
            ) : (
              <NoDataMessage>No recent activities</NoDataMessage>
            )}
          </RecentActivitiesContainer>
          
          {/* Download Section */}
          <DownloadSection>
            <DownloadTitle>Download</DownloadTitle>
            
            {downloadableFiles.length > 0 ? (
              downloadableFiles.map(file => (
                <DownloadItem 
                  key={file.id}
                  onClick={() => handleFileDownload(file)}
                >
                  <FileIcon>XLS</FileIcon>
                  <FileDetails>
                    <FileName>{file.file_name}</FileName>
                    <FileDate>
                      {new Date(file.processed_date).toLocaleDateString()}
                    </FileDate>
                  </FileDetails>
                </DownloadItem>
              ))
            ) : (
              <NoDataMessage>No files available for download</NoDataMessage>
            )}
          </DownloadSection>
        </SidePanel>
      </DashboardContent>
    </DashboardContainer>
  );
};

export default Dashboard;
