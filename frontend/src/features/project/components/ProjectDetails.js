// src/features/project/components/ProjectDetails.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { fetchProject, updateProject, toggleProjectActive } from '../../../services/project/api';
import ProjectSelector from './ProjectSelector';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  margin: 0;
  color: #343a40;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  background-color: ${props => props.active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.active ? '#155724' : '#721c24'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const EditButton = styled(Button)`
  background-color: #0056b3;
  border: none;
  color: #ffffff;
  
  &:hover:not(:disabled) {
    background-color: #004494;
  }
`;

const ToggleButton = styled(Button)`
  background-color: ${props => props.active ? '#dc3545' : '#28a745'};
  border: none;
  color: #ffffff;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#c82333' : '#218838'};
  }
`;

const BackButton = styled(Button)`
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  color: #495057;
  
  &:hover:not(:disabled) {
    background-color: #e9ecef;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 16px;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 12px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const DetailLabel = styled.div`
  flex: 0 0 200px;
  font-weight: 500;
  color: #495057;
  
  @media (max-width: 768px) {
    margin-bottom: 4px;
  }
`;

const DetailValue = styled.div`
  flex: 1;
  color: #212529;
`;

const SelectProjectContainer = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
`;

const SelectButton = styled(Button)`
  background-color: #0056b3;
  border: none;
  color: #ffffff;
  margin-top: 12px;
  
  &:hover:not(:disabled) {
    background-color: #004494;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #dc3545;
  background-color: #f8d7da;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const ProjectDetails = ({ project: propProject }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('id');
  
  // State
  const [project, setProject] = useState(propProject || null);
  const [isLoading, setIsLoading] = useState(!propProject);
  const [error, setError] = useState(null);
  const [showProjectSelector, setShowProjectSelector] = useState(!propProject && !projectId && !queryProjectId);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load project data if not provided as prop
  useEffect(() => {
    const loadProject = async (id) => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchProject(id);
        setProject(data);
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (propProject) {
      setProject(propProject);
    } else if (projectId) {
      loadProject(projectId);
    } else if (queryProjectId) {
      loadProject(queryProjectId);
    }
  }, [propProject, projectId, queryProjectId]);
  
  // Handle project selection from selector
  const handleProjectSelect = (selectedProject) => {
    setProject(selectedProject);
    setShowProjectSelector(false);
    // Update URL to include project ID
    navigate(`/workspace/project-details?id=${selectedProject.id}`, { replace: true });
  };
  
  // Handle toggle active status
  const handleToggleActive = async () => {
    try {
      setIsLoading(true);
      const updatedProject = await toggleProjectActive(project.id);
      setProject(updatedProject);
    } catch (err) {
      console.error('Error toggling project status:', err);
      setError('Failed to update project status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle edit button click
  const handleEdit = () => {
    setIsEditing(true);
    // Navigate to edit form (this would be implemented separately)
    navigate(`/workspace/edit-project/${project.id}`);
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate('/workspace');
  };
  
  // Show project selector if no project is selected
  if (showProjectSelector) {
    return (
      <Container>
        <SelectProjectContainer>
          <Title>Project Details</Title>
          <p>Please select a project to view its details</p>
          <SelectButton onClick={() => setShowProjectSelector(true)}>
            Select Project
          </SelectButton>
          {showProjectSelector && (
            <ProjectSelector 
              onProjectSelect={handleProjectSelect}
              onClose={() => setShowProjectSelector(false)}
            />
          )}
        </SelectProjectContainer>
      </Container>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <Container>
        <LoadingMessage>Loading project details...</LoadingMessage>
      </Container>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
        <BackButton onClick={handleBack}>Back to Workspace</BackButton>
      </Container>
    );
  }
  
  // Show no project state
  if (!project) {
    return (
      <Container>
        <SelectProjectContainer>
          <Title>No Project Selected</Title>
          <p>Please select a project to view its details</p>
          <SelectButton onClick={() => setShowProjectSelector(true)}>
            Select Project
          </SelectButton>
        </SelectProjectContainer>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <div>
          <Title>{project.company_name}</Title>
          <StatusBadge active={project.is_active}>
            {project.is_active ? 'Active' : 'Inactive'}
          </StatusBadge>
        </div>
        <ActionButtons>
          <BackButton onClick={handleBack}>
            Back
          </BackButton>
          <EditButton onClick={handleEdit}>
            Edit
          </EditButton>
          <ToggleButton 
            active={project.is_active}
            onClick={handleToggleActive}
          >
            {project.is_active ? 'Deactivate' : 'Activate'}
          </ToggleButton>
        </ActionButtons>
      </Header>
      
      <Section>
        <SectionTitle>Entity Information</SectionTitle>
        <DetailRow>
          <DetailLabel>Entity Type</DetailLabel>
          <DetailValue>
            {project.entity_type === 'company' ? 'Company' : 'Individual'}
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>
            {project.entity_type === 'company' ? 'Company Name' : 'Full Name'}
          </DetailLabel>
          <DetailValue>{project.company_name}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Business Registration Number</DetailLabel>
          <DetailValue>{project.business_reg_no || 'N/A'}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>VAT Registration Number</DetailLabel>
          <DetailValue>{project.vat_reg_no || 'N/A'}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Tax ID</DetailLabel>
          <DetailValue>{project.tax_id || 'N/A'}</DetailValue>
        </DetailRow>
      </Section>
      
      <Section>
        <SectionTitle>Contact Information</SectionTitle>
        <DetailRow>
          <DetailLabel>Contact Person</DetailLabel>
          <DetailValue>{project.contact_person}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Contact Email</DetailLabel>
          <DetailValue>{project.contact_email}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Contact Phone</DetailLabel>
          <DetailValue>{project.contact_phone}</DetailValue>
        </DetailRow>
      </Section>
      
      <Section>
        <SectionTitle>Address</SectionTitle>
        <DetailRow>
          <DetailLabel>Address Line 1</DetailLabel>
          <DetailValue>{project.address_line1}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Address Line 2</DetailLabel>
          <DetailValue>{project.address_line2 || 'N/A'}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>City</DetailLabel>
          <DetailValue>{project.city}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>State/Province</DetailLabel>
          <DetailValue>{project.state_province || 'N/A'}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Postal Code</DetailLabel>
          <DetailValue>{project.postal_code || 'N/A'}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Country</DetailLabel>
          <DetailValue>{project.country}</DetailValue>
        </DetailRow>
      </Section>
      
      <Section>
        <SectionTitle>Additional Information</SectionTitle>
        <DetailRow>
          <DetailLabel>Notes</DetailLabel>
          <DetailValue>{project.notes || 'No additional notes'}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Created Date</DetailLabel>
          <DetailValue>
            {new Date(project.created_at).toLocaleString()}
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Last Updated</DetailLabel>
          <DetailValue>
            {new Date(project.updated_at).toLocaleString()}
          </DetailValue>
        </DetailRow>
      </Section>
    </Container>
  );
};

export default ProjectDetails;
