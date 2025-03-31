// src/features/project/components/ProjectCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toggleProjectActive } from '../../../services/project/api';

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#28a745' : '#6c757d'};
`;

const CompanyName = styled.h3`
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #343a40;
  padding-right: 20px; /* Space for status indicator */
`;

const ProjectInfo = styled.div`
  margin-bottom: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  margin-bottom: 6px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  color: #6c757d;
  width: 100px;
  flex-shrink: 0;
`;

const InfoValue = styled.span`
  color: #343a40;
  font-weight: 500;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
`;

const CreatedDate = styled.div`
  font-size: 12px;
  color: #6c757d;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #0056b3;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: #e9ecef;
  }
`;

const ProjectCard = ({ project, onSelect }) => {
  const navigate = useNavigate();
  
  const handleCardClick = (e) => {
    // Prevent card click if clicking on the toggle button
    if (e.target.closest('button')) return;
    
    onSelect(project);
    navigate(`/workspace/dashboard/${project.id}`);
  };
  
  const handleToggleActive = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      await toggleProjectActive(project.id);
      // We don't update local state here as the parent component should refetch projects
    } catch (error) {
      console.error('Failed to toggle project active status:', error);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card onClick={handleCardClick}>
      <StatusIndicator active={project.is_active} />
      <CompanyName>{project.company_name}</CompanyName>
      
      <ProjectInfo>
        <InfoItem>
          <InfoLabel>Reg Number:</InfoLabel>
          <InfoValue>{project.business_reg_no || 'N/A'}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Files:</InfoLabel>
          <InfoValue>{project.files_count || 0}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Anomalies:</InfoLabel>
          <InfoValue>{project.anomalies_count || 0}</InfoValue>
        </InfoItem>
      </ProjectInfo>
      
      <CardFooter>
        <CreatedDate>Created: {formatDate(project.created_at)}</CreatedDate>
        <ActionButton onClick={handleToggleActive}>
          {project.is_active ? 'Deactivate' : 'Activate'}
        </ActionButton>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;

