// src/features/workspace/components/DashboardHeader.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ProjectSearch from '../../search_filter/components/ProjectSearch';
import ProjectFilter from '../../search_filter/components/ProjectFilter';
import { toggleProjectActive } from '../../../services/project/api';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  color: #495057;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-right: 16px;
  
  &:hover {
    color: #0056b3;
  }
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProjectTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #343a40;
  display: flex;
  align-items: center;
`;

const ProjectStatus = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#28a745' : '#6c757d'};
  margin-left: 8px;
`;

const ProjectId = styled.div`
  font-size: 12px;
  color: #6c757d;
`;

const LastAccessed = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
`;

const SearchFilterContainer = styled.div`
  display: flex;
  margin-right: 16px;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 6px 12px;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  
  &:hover {
    background-color: #f1f3f5;
  }
`;

const ActionIcon = styled.i`
  margin-right: 6px;
`;

const DashboardHeader = ({ project, onSearch, onFilterChange }) => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [isActive, setIsActive] = useState(project?.is_active || false);

  const handleBack = () => {
    navigate('/workspace');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleToggleActive = async () => {
    try {
      if (project) {
        const updatedProject = await toggleProjectActive(project.id);
        setIsActive(updatedProject.is_active);
      }
    } catch (error) {
      console.error('Failed to toggle project active status:', error);
    }
  };

  const formatLastAccessed = (date) => {
    if (!date) return 'Never accessed';
    return new Date(date).toLocaleString();
  };

  if (!project) {
    return <div>Loading project information...</div>;
  }

  return (
    <HeaderContainer>
      <LeftSection>
        <BackButton onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </BackButton>
        
        <ProjectInfo>
          <ProjectTitle>
            {project.company_name}
            <ProjectStatus active={isActive} />
          </ProjectTitle>
          <ProjectId>Project ID: {project.id}</ProjectId>
          <LastAccessed>
            Last accessed: {formatLastAccessed(project.last_accessed)}
          </LastAccessed>
        </ProjectInfo>
      </LeftSection>
      
      <RightSection>
        <SearchFilterContainer>
          <ProjectSearch 
            projectId={project.id}
            onSearch={onSearch}
          />
          
          <ActionButton onClick={toggleFilters}>
            <ActionIcon className="fas fa-filter" />
            Filter
          </ActionButton>
        </SearchFilterContainer>
        
        <ActionButton onClick={handleToggleActive}>
          <ActionIcon className={`fas fa-${isActive ? 'toggle-on' : 'toggle-off'}`} />
          {isActive ? 'Active' : 'Inactive'}
        </ActionButton>
      </RightSection>
      
      {showFilters && (
        <ProjectFilter 
          projectId={project.id}
          onFilterChange={onFilterChange}
          onClose={toggleFilters}
        />
      )}
    </HeaderContainer>
  );
};

export default DashboardHeader;
