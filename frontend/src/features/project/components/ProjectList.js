// src/features/project/components/ProjectList.js
import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { WorkspaceContext } from '../../../context/WorkspaceContext';
import ProjectCard from './ProjectCard';
import { fetchProjects } from '../../../services/project/api';

const ListContainer = styled.div`
  padding: 20px 0;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 24px;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const LoadMoreButton = styled.button`
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  
  &:hover {
    background-color: #e9ecef;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 18px;
  color: #495057;
  margin-bottom: 12px;
`;

const EmptyStateText = styled.p`
  color: #6c757d;
  margin-bottom: 20px;
`;

const CreateButton = styled.button`
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background-color: #004494;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
`;

const FilterLabel = styled.label`
  margin-right: 8px;
  font-size: 14px;
  color: #495057;
`;

const FilterSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  margin-right: 16px;
`;

const SearchInput = styled.input`
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  width: 240px;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 24px;
`;

const ProjectList = ({ onProjectSelect }) => {
  const { searchQuery } = useContext(WorkspaceContext);
  const [projects, setProjects] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name
  const [localSearch, setLocalSearch] = useState('');
  
  const projectsPerPage = 12;
  
  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);
  
  // Apply filters and search when projects, filter, sortBy, or search changes
  useEffect(() => {
    if (projects.length > 0) {
      applyFiltersAndSearch();
    }
  }, [projects, filter, sortBy, localSearch, searchQuery]);
  
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const projectsData = await fetchProjects();
      setProjects(projectsData);
      
      // Set recent projects (newest 12)
      const sorted = [...projectsData].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentProjects(sorted.slice(0, 12));
      
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFiltersAndSearch = () => {
    let result = [...projects];
    
    // Apply active/inactive filter
    if (filter === 'active') {
      result = result.filter(project => project.is_active);
    } else if (filter === 'inactive') {
      result = result.filter(project => !project.is_active);
    }
    
    // Apply search (from context or local)
    const search = searchQuery || localSearch;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(project => 
        project.company_name.toLowerCase().includes(searchLower) ||
        (project.business_reg_no && project.business_reg_no.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.company_name.localeCompare(b.company_name));
    }
    
    setFilteredProjects(result);
    setHasMore(result.length > page * projectsPerPage);
  };
  
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(1); // Reset pagination when filter changes
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1); // Reset pagination when sort changes
  };
  
  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
    setPage(1); // Reset pagination when search changes
  };
  
  const handleCreateProject = () => {
    window.location.href = '/workspace/create-project';
  };
  
  // Display loading state
  if (isLoading && projects.length === 0) {
    return <LoadingIndicator>Loading projects...</LoadingIndicator>;
  }
  
  // Display error state
  if (error) {
    return (
      <ListContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <EmptyState>
          <EmptyStateTitle>Unable to load projects</EmptyStateTitle>
          <CreateButton onClick={() => loadProjects()}>Try Again</CreateButton>
        </EmptyState>
      </ListContainer>
    );
  }
  
  // Display empty state
  if (projects.length === 0) {
    return (
      <ListContainer>
        <SectionTitle>Projects</SectionTitle>
        <EmptyState>
          <EmptyStateTitle>No projects found</EmptyStateTitle>
          <EmptyStateText>Create your first project to get started</EmptyStateText>
          <CreateButton onClick={handleCreateProject}>Create Project</CreateButton>
        </EmptyState>
      </ListContainer>
    );
  }
  
  // Display filtered empty state
  if (filteredProjects.length === 0) {
    return (
      <ListContainer>
        <SectionTitle>Projects</SectionTitle>
        <FilterContainer>
          <FilterGroup>
            <FilterLabel>Show:</FilterLabel>
            <FilterSelect value={filter} onChange={handleFilterChange}>
              <option value="all">All Projects</option>
              <option value="active">Active Projects</option>
              <option value="inactive">Inactive Projects</option>
            </FilterSelect>
            
            <FilterLabel>Sort by:</FilterLabel>
            <FilterSelect value={sortBy} onChange={handleSortChange}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Company Name</option>
            </FilterSelect>
          </FilterGroup>
          
          <SearchInput
            type="text"
            placeholder="Search projects..."
            value={localSearch}
            onChange={handleSearchChange}
          />
        </FilterContainer>
        
        <EmptyState>
          <EmptyStateTitle>No matching projects found</EmptyStateTitle>
          <EmptyStateText>Try adjusting your search or filters</EmptyStateText>
          <CreateButton onClick={() => {
            setFilter('all');
            setSortBy('newest');
            setLocalSearch('');
          }}>Clear Filters</CreateButton>
        </EmptyState>
      </ListContainer>
    );
  }
  
  // Determine which projects to show based on current page
  const displayedProjects = filteredProjects.slice(0, page * projectsPerPage);
  
  return (
    <ListContainer>
      <SectionTitle>Recent Projects</SectionTitle>
      
      <FilterContainer>
        <FilterGroup>
          <FilterLabel>Show:</FilterLabel>
          <FilterSelect value={filter} onChange={handleFilterChange}>
            <option value="all">All Projects</option>
            <option value="active">Active Projects</option>
            <option value="inactive">Inactive Projects</option>
          </FilterSelect>
          
          <FilterLabel>Sort by:</FilterLabel>
          <FilterSelect value={sortBy} onChange={handleSortChange}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Company Name</option>
          </FilterSelect>
        </FilterGroup>
        
        <SearchInput
          type="text"
          placeholder="Search projects..."
          value={localSearch}
          onChange={handleSearchChange}
        />
      </FilterContainer>
      
      <GridContainer>
        {displayedProjects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onSelect={onProjectSelect}
          />
        ))}
      </GridContainer>
      
      {hasMore && (
        <LoadMoreButton onClick={handleLoadMore}>
          Load More Projects
        </LoadMoreButton>
      )}
    </ListContainer>
  );
};

export default ProjectList;

