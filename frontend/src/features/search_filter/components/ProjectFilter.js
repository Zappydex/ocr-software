// src/features/search_filter/components/ProjectFilter.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { searchWithinProject } from '../../../services/project/api';
import '../styles/ProjectFilter.css';

const ProjectFilter = ({ projectId, onApplyFilters }) => {
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    vendors: [],
    fileTypes: []
  });
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    vendor: '',
    fileType: '',
    fileSizeMin: '',
    fileSizeMax: ''
  });

  // Fetch filter options from the project data
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        // Get initial data to extract filter options
        const initialResults = await searchWithinProject(projectId, {});
        
        // Extract unique vendors and file types from the results
        const vendors = new Set();
        const fileTypes = new Set();
        
        initialResults.files.forEach(file => {
          if (file.vendor_name) vendors.add(file.vendor_name);
          if (file.file_type) fileTypes.add(file.file_type);
        });
        
        setFilterOptions({
          vendors: Array.from(vendors),
          fileTypes: Array.from(fileTypes)
        });
      } catch (error) {
        console.error('Error fetching project filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, [projectId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleApplyFilters = () => {
    // Convert empty strings to null for backend API
    const processedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      acc[key] = value === '' ? null : value;
      return acc;
    }, {});
    
    if (onApplyFilters) {
      onApplyFilters(processedFilters);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      vendor: '',
      fileType: '',
      fileSizeMin: '',
      fileSizeMax: ''
    });
    
    if (onApplyFilters) {
      onApplyFilters({});
    }
  };

  return (
    <Card className="project-filter-container">
      <Card.Header>
        <h5 className="mb-0">Filter Project Data</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" role="status" size="sm">
              <span className="visually-hidden">Loading filter options...</span>
            </Spinner>
            <span className="ms-2">Loading filter options...</span>
          </div>
        ) : (
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="projectDateFrom">
                  <Form.Label>Date From</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateFrom"
                    value={filters.dateFrom}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="projectDateTo">
                  <Form.Label>Date To</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateTo"
                    value={filters.dateTo}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="projectVendor">
                  <Form.Label>Vendor</Form.Label>
                  <Form.Select
                    name="vendor"
                    value={filters.vendor}
                    onChange={handleInputChange}
                  >
                    <option value="">All Vendors</option>
                    {filterOptions.vendors.map((vendor, index) => (
                      <option key={index} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="projectFileType">
                  <Form.Label>File Type</Form.Label>
                  <Form.Select
                    name="fileType"
                    value={filters.fileType}
                    onChange={handleInputChange}
                  >
                    <option value="">All File Types</option>
                    {filterOptions.fileTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group controlId="projectFileSizeMin">
                  <Form.Label>Min File Size (KB)</Form.Label>
                  <Form.Control
                    type="number"
                    name="fileSizeMin"
                    value={filters.fileSizeMin}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="projectFileSizeMax">
                  <Form.Label>Max File Size (KB)</Form.Label>
                  <Form.Control
                    type="number"
                    name="fileSizeMax"
                    value={filters.fileSizeMax}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleResetFilters}
                size="sm"
              >
                Reset
              </Button>
              <Button 
                variant="primary" 
                onClick={handleApplyFilters}
                size="sm"
              >
                Apply Filters
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProjectFilter;
