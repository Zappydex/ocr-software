import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../../../context/AuthContext';
import { WorkspaceContext } from '../../../context/WorkspaceContext';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceSidebar from './WorkspaceSidebar';
import Dashboard from './Dashboard';
import ProjectList from '../../project/components/ProjectList';
import FilesList from '../../project/components/FilesList';
import AnomaliesList from '../../project/components/AnomaliesList';
import CreateProject from '../../project/components/CreateProject';
import ProjectDetails from '../../project/components/ProjectDetails';
import Settings from '../../user/components/Settings';
import GlobalSearch from '../../search_filter/components/GlobalSearch';
import GlobalFilter from '../../search_filter/components/GlobalFilter';
import { fetchProject } from '../../../services/project/api';
import '../styles/workspace.css';

// Styled components
const WorkspaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
`;

const WorkspaceContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const Workspace = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [activeProject, setActiveProject] = useState(null);
  const [activeView, setActiveView] = useState('recent-projects'); // Default view
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Parse the current location to determine active view and project
  useEffect(() => {
    const path = location.pathname;
    
    // Extract view from path
    if (path.includes('/dashboard/')) {
      setActiveView('dashboard');
      const projectId = path.split('/dashboard/')[1];
      if (projectId && (!activeProject || activeProject.id.toString() !== projectId)) {
        loadProject(projectId);
      }
    } else if (path.includes('/files')) {
      setActiveView('files');
    } else if (path.includes('/anomalies')) {
      setActiveView('anomalies');
    } else if (path.includes('/create-project')) {
      setActiveView('create-project');
    } else if (path.includes('/project-details')) {
      setActiveView('project-details');
      const projectId = new URLSearchParams(location.search).get('id');
      if (projectId) {
        loadProject(projectId);
      }
    } else if (path.includes('/settings')) {
      setActiveView('settings');
    } else {
      setActiveView('recent-projects');
    }
  }, [location, activeProject]);

  // Load project data
  const loadProject = async (projectId) => {
    try {
      setIsLoading(true);
      setError(null);
      const projectData = await fetchProject(projectId);
      setActiveProject(projectData);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle project selection
  const handleProjectSelect = (project) => {
    setActiveProject(project);
    navigate(`/workspace/dashboard/${project.id}`);
  };

  // Handle view changes
  const handleViewChange = (view, projectId = null) => {
    setActiveView(view);
    
    if (view === 'dashboard' && projectId) {
      navigate(`/workspace/dashboard/${projectId}`);
    } else if (view === 'files') {
      navigate('/workspace/files');
    } else if (view === 'anomalies') {
      navigate('/workspace/anomalies');
    } else if (view === 'create-project') {
      navigate('/workspace/create-project');
    } else if (view === 'project-details' && projectId) {
      navigate(`/workspace/project-details?id=${projectId}`);
    } else if (view === 'settings') {
      navigate('/workspace/settings');
    } else {
      navigate('/workspace');
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    // We'll implement actual search logic in the GlobalSearch component
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setFilterOptions(filters);
    // We'll implement actual filtering logic in the GlobalFilter component
  };

  // Render the appropriate content based on active view
  const renderContent = () => {
    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    switch (activeView) {
      case 'dashboard':
        return activeProject ? (
          <Dashboard project={activeProject} />
        ) : (
          <div>Select a project to view dashboard</div>
        );
      
      case 'files':
        return <FilesList />;
      
      case 'anomalies':
        return <AnomaliesList />;
      
      case 'create-project':
        return <CreateProject onProjectCreated={handleProjectSelect} />;
      
      case 'project-details':
        return activeProject ? (
          <ProjectDetails project={activeProject} />
        ) : (
          <div>Select a project to view details</div>
        );
      
      case 'settings':
        return <Settings />;
      
      case 'recent-projects':
      default:
        return <ProjectList onProjectSelect={handleProjectSelect} />;
    }
  };

  // Provide context values for child components
  const workspaceContextValue = {
    activeProject,
    activeView,
    searchQuery,
    filterOptions,
    handleProjectSelect,
    handleViewChange,
    handleSearch,
    handleFilterChange
  };

  return (
    <WorkspaceContext.Provider value={workspaceContextValue}>
      <WorkspaceContainer>
        <WorkspaceHeader 
          toggleSidebar={toggleSidebar}
          onSearch={handleSearch}
          activeProject={activeProject}
        />
        
        <WorkspaceContent>
          <WorkspaceSidebar 
            collapsed={sidebarCollapsed}
            activeView={activeView}
            onViewChange={handleViewChange}
            activeProject={activeProject}
          />
          
          <MainContent>
            {renderContent()}
          </MainContent>
        </WorkspaceContent>
      </WorkspaceContainer>
    </WorkspaceContext.Provider>
  );
};

export default Workspace;
