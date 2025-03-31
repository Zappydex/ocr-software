// src/features/workspace/components/WorkspaceHeader.js
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { WorkspaceContext } from '../../../context/WorkspaceContext';
import { AuthContext } from '../../../context/AuthContext';
import GlobalSearch from '../../search_filter/components/GlobalSearch';
import GlobalFilter from '../../search_filter/components/GlobalFilter';
import ProfileMenu from '../../user/components/ProfileMenu';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 64px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 20px;
  font-weight: 700;
  color: #0056b3;
  text-decoration: none;
  display: flex;
  align-items: center;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  margin-right: 16px;
  cursor: pointer;
  color: #495057;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #0056b3;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 20px;
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
`;

const FilterButton = styled.button`
  background: none;
  border: none;
  margin-right: 16px;
  cursor: pointer;
  color: #495057;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #0056b3;
  }
`;

const ProjectTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #343a40;
  margin-left: 16px;
`;

const WorkspaceHeader = ({ toggleSidebar, activeProject }) => {
  const { handleSearch, handleFilterChange } = useContext(WorkspaceContext);
  const { user } = useContext(AuthContext);
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <HeaderContainer>
      <LogoContainer>
        <MenuButton onClick={toggleSidebar} aria-label="Toggle sidebar">
          <i className="fas fa-bars"></i>
        </MenuButton>
        <Logo to="/workspace">InvoiceOCR</Logo>
        {activeProject && (
          <ProjectTitle>{activeProject.company_name}</ProjectTitle>
        )}
      </LogoContainer>

      <SearchContainer>
        <GlobalSearch onSearch={handleSearch} />
      </SearchContainer>

      <RightContainer>
        <FilterButton onClick={toggleFilters} aria-label="Toggle filters">
          <i className="fas fa-filter"></i>
        </FilterButton>
        <ProfileMenu user={user} />
      </RightContainer>

      {showFilters && (
        <GlobalFilter 
          onFilterChange={handleFilterChange}
          onClose={toggleFilters}
        />
      )}
    </HeaderContainer>
  );
};

export default WorkspaceHeader;
