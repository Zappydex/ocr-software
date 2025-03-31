// src/features/project/components/ProjectSelector.js
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { fetchProjects } from '../../../services/project/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #343a40;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #6c757d;
  cursor: pointer;
  
  &:hover {
    color: #343a40;
  }
`;

const SearchContainer = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    border-color: #0056b3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.25);
  }
`;

const ProjectsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

const ProjectItem = styled.div`
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProjectName = styled.div`
  font-weight: 500;
  color: #212529;
  margin-bottom: 4px;
`;

const ProjectDetails = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6c757d;
`;

const ProjectId = styled.span``;

const ProjectDate = styled.span``;

const NoResults = styled.div`
  padding: 20px;
  text-align: center;
  color: #6c757d;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #dc3545;
  background-color: #f8d7da;
`;

const ProjectSelector = ({ onProjectSelect, onClose }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const modalRef = useRef(null);
  
  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchProjects();
        setProjects(data);
        setFilteredProjects(data);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, []);
  
  // Filter projects when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(project => 
        project.company_name.toLowerCase().includes(query) ||
        project.contact_person.toLowerCase().includes(query) ||
        project.id.toString().includes(query)
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);
  
  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle project selection
  const handleProjectClick = (project) => {
    onProjectSelect(project);
    onClose();
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <ModalOverlay>
      <ModalContent ref={modalRef}>
        <ModalHeader>
          <ModalTitle>Select Project</ModalTitle>
          <CloseButton onClick={onClose} aria-label="Close">
            &times;
          </CloseButton>
        </ModalHeader>
        
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search projects by name, contact, or ID"
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
          />
        </SearchContainer>
        
        <ProjectsList>
          {isLoading ? (
            <LoadingMessage>Loading projects...</LoadingMessage>
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : filteredProjects.length === 0 ? (
            <NoResults>
              {searchQuery ? 'No projects match your search' : 'No projects available'}
            </NoResults>
          ) : (
            filteredProjects.map(project => (
              <ProjectItem 
                key={project.id}
                onClick={() => handleProjectClick(project)}
              >
                <ProjectName>{project.company_name}</ProjectName>
                <ProjectDetails>
                  <ProjectId>ID: {project.id}</ProjectId>
                  <ProjectDate>Created: {formatDate(project.created_at)}</ProjectDate>
                </ProjectDetails>
              </ProjectItem>
            ))
          )}
        </ProjectsList>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ProjectSelector;
