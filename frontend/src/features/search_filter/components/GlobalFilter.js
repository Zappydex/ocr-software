// src/features/search_filter/components/GlobalFilter.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { getFilterOptions } from '../../../services/search/api';
import '../styles/GlobalFilter.css';

const GlobalFilter = ({ onApplyFilters }) => {
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    vendors: [],
    fileTypes: [],
    dateRange: {
      min: null,
      max: null
    },
    fileSizeRange: {
      min: 0,
      max: 100000 // 100MB default max
    }
  });

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    vendor: '',
    fileType: '',
    fileSizeMin: '',
    fileSizeMax: ''
  });

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

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
    <Card className="global-filter-container">
      <Card.Header>
        <h5 className="mb-0">Advanced Filters</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading filter options...</span>
            </Spinner>
          </div>
        ) : (
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="dateFrom">
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
                <Form.Group controlId="dateTo">
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
                <Form.Group controlId="vendor">
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
                <Form.Group controlId="fileType">
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
                <Form.Group controlId="fileSizeMin">
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
                <Form.Group controlId="fileSizeMax">
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
              >
                Reset
              </Button>
              <Button 
                variant="primary" 
                onClick={handleApplyFilters}
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

export default GlobalFilter;
