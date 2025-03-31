import React, { createContext, useState } from 'react';

// Create the context
export const WorkspaceContext = createContext();

// Create a provider component
export const WorkspaceProvider = ({ children }) => {
  // State for active project
  const [activeProject, setActiveProject] = useState(null);
  
  // State for active view in workspace
  const [activeView, setActiveView] = useState('recent-projects');
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    projects: [],
    files: [],
    anomalies: []
  });
  
  // State for filter functionality
  const [filterOptions, setFilterOptions] = useState({
    dateFrom: null,
    dateTo: null,
    vendor: null,
    fileType: null,
    fileSizeMin: null,
    fileSizeMax: null
  });
  
  // State for UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handler functions
  const handleProjectSelect = (project) => {
    setActiveProject(project);
    setActiveView('dashboard');
  };
  
  const handleViewChange = (view) => {
    setActiveView(view);
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const handleFilterChange = (filters) => {
    setFilterOptions(filters);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({
      projects: [],
      files: [],
      anomalies: []
    });
  };
  
  // Context value
  const contextValue = {
    // State
    activeProject,
    activeView,
    searchQuery,
    searchResults,
    filterOptions,
    isLoading,
    error,
    
    // Setters
    setActiveProject,
    setActiveView,
    setSearchResults,
    setIsLoading,
    setError,
    
    // Handlers
    handleProjectSelect,
    handleViewChange,
    handleSearch,
    handleFilterChange,
    clearSearch
  };
  
  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceProvider;
