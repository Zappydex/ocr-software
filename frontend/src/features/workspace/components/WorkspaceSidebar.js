// src/features/workspace/components/WorkspaceSidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { fetchProjects } from '../../../services/project/api';
import ProjectSelector from '../../project/components/ProjectSelector';

const SidebarContainer = styled.aside`
  width: ${props => props.collapsed ? '64px' : '240px'};
  background-color: #343a40;
  color: #f8f9fa;
  transition: width 0.3s ease;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #495057;
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const NavMenu = styled.nav`
  flex: 1;
  padding: 16px 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: ${props => props.collapsed ? '12px 0' : '12px 16px'};
  color: #adb5bd;
  text-decoration: none;
  transition: background-color 0.2s;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  
  &:hover {
    background-color: #495057;
    color: #ffffff;
  }
  
  &.active {
    background-color: #0056b3;
    color: #ffffff;
  }
`;

const NavIcon = styled.i`
  font-size: 18px;
  width: 24px;
  text-align: center;
  margin-right: ${props => props.collapsed ? '0' : '12px'};
`;

const NavText = styled.span`
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const NavDivider = styled.div`
  height: 1px;
  background-color: #495057;
  margin: 8px 16px;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const ProcessButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  width: 100%;
  padding: ${props => props.collapsed ? '12px 0' : '12px 16px'};
  background-color: #28a745;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #218838;
  }
`;

const ProcessIcon = styled.i`
  font-size: 18px;
  margin-right: ${props => props.collapsed ? '0' : '12px'};
`;

const ProcessText = styled.span`
  font-weight: 600;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const WorkspaceSidebar = ({ collapsed, onProjectSelect, activeView }) => {
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);
  const navigate = useNavigate();

  // Fetch recent projects on component mount
  useEffect(() => {
    const loadRecentProjects = async () => {
      try {
        const projects = await fetchProjects();
        setRecentProjects(projects.slice(0, 3)); // Get 3 most recent projects
      } catch (error) {
        console.error('Failed to load recent projects:', error);
      }
    };

    loadRecentProjects();
  }, []);

  const handleProcessClick = () => {
    setShowProjectSelector(true);
  };

  const handleProjectSelected = (project) => {
    setShowProjectSelector(false);
    onProjectSelect(project);
  };

  const handleProjectDetailsClick = () => {
    navigate('/workspace/project-details');
  };

  return (
    <SidebarContainer collapsed={collapsed}>
      <SidebarHeader collapsed={collapsed}>
        <SidebarTitle collapsed={collapsed}>Workspace</SidebarTitle>
      </SidebarHeader>

      <NavMenu>
        <NavItem 
          to="/workspace" 
          end 
          collapsed={collapsed}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <NavIcon className="fas fa-home" collapsed={collapsed} />
          <NavText collapsed={collapsed}>Dashboard</NavText>
        </NavItem>

        <NavItem 
          to="/workspace/files" 
          collapsed={collapsed}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <NavIcon className="fas fa-file-alt" collapsed={collapsed} />
          <NavText collapsed={collapsed}>Files</NavText>
        </NavItem>

        <NavItem 
          to="/workspace/anomalies" 
          collapsed={collapsed}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <NavIcon className="fas fa-exclamation-triangle" collapsed={collapsed} />
          <NavText collapsed={collapsed}>Anomalies</NavText>
        </NavItem>

        <NavDivider collapsed={collapsed} />

        <NavItem 
          to="/workspace/create-project" 
          collapsed={collapsed}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <NavIcon className="fas fa-plus-circle" collapsed={collapsed} />
          <NavText collapsed={collapsed}>Create Project</NavText>
        </NavItem>

        <NavItem 
          to="/workspace/project-details" 
          collapsed={collapsed}
          className={({ isActive }) => isActive ? 'active' : ''}
          onClick={handleProjectDetailsClick}
        >
          <NavIcon className="fas fa-info-circle" collapsed={collapsed} />
          <NavText collapsed={collapsed}>Project Details</NavText>
        </NavItem>

        <NavDivider collapsed={collapsed} />

        <NavItem 
          to="/workspace/settings" 
          collapsed={collapsed}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <NavIcon className="fas fa-cog" collapsed={collapsed} />
          <NavText collapsed={collapsed}>Settings</NavText>
        </NavItem>
      </NavMenu>

      <ProcessButton 
        collapsed={collapsed}
        onClick={handleProcessClick}
      >
        <ProcessIcon className="fas fa-play" collapsed={collapsed} />
        <ProcessText collapsed={collapsed}>Process</ProcessText>
      </ProcessButton>

      {showProjectSelector && (
        <ProjectSelector 
          onProjectSelect={handleProjectSelected}
          onClose={() => setShowProjectSelector(false)}
        />
      )}
    </SidebarContainer>
  );
};

export default WorkspaceSidebar;
