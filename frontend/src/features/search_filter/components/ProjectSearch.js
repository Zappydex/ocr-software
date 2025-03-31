// src/features/search_filter/components/ProjectSearch.js
import React, { useState, useRef, useEffect } from 'react';
import { Form, InputGroup, Button, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { searchWithinProject } from '../../../services/project/api';
import '../styles/ProjectSearch.css';

const ProjectSearch = ({ projectId, onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ files: [], anomalies: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!query.trim()) {
      setResults({ files: [], anomalies: [] });
      setSearchPerformed(false);
      return;
    }

    try {
      setLoading(true);
      setShowResults(true);
      setSearchPerformed(true);
      
      const searchResults = await searchWithinProject(projectId, { q: query });
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching within project:', error);
      setResults({ files: [], anomalies: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults({ files: [], anomalies: [] });
    setSearchPerformed(false);
    inputRef.current.focus();
  };

  const handleResultClick = (item, type) => {
    if (onResultSelect) {
      onResultSelect(item, type);
    }
    setShowResults(false);
  };

  // Highlight matching text in search results
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={index} className="search-result-highlight">{part}</span> 
        : part
    );
  };

  const totalResults = results.files.length + results.anomalies.length;

  return (
    <div className="project-search-container" ref={searchRef}>
      <Form onSubmit={handleSearch}>
        <InputGroup>
          <InputGroup.Text className="search-icon-wrapper">
            <FaSearch className="search-icon" />
          </InputGroup.Text>
          
          <Form.Control
            ref={inputRef}
            type="text"
            placeholder="Search within this project..."
            value={query}
            onChange={handleInputChange}
            onClick={() => query && setShowResults(true)}
            className="project-search-input"
            aria-label="Search within project"
          />
          
          {query && (
            <Button 
              variant="link" 
              className="search-clear-button"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <FaTimes />
            </Button>
          )}
          
          <Button 
            variant="primary" 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="search-button"
          >
            {loading ? (
              <Spinner 
                as="span" 
                animation="border" 
                size="sm" 
                role="status" 
                aria-hidden="true" 
              />
            ) : (
              'Search'
            )}
          </Button>
        </InputGroup>
      </Form>
      
      {showResults && searchPerformed && (
        <div className="project-search-results">
          <div className="search-results-header">
            <span>Search Results</span>
            <span className="search-results-count">{totalResults} found</span>
          </div>
          
          {loading ? (
            <div className="search-loading">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Searching...</span>
              </Spinner>
            </div>
          ) : totalResults === 0 ? (
            <div className="search-no-results">
              No results found for "{query}"
            </div>
          ) : (
            <ListGroup variant="flush">
              {results.files.length > 0 && (
                <>
                  <ListGroup.Item className="search-category-header">
                    Files ({results.files.length})
                  </ListGroup.Item>
                  
                  {results.files.map((file) => (
                    <ListGroup.Item 
                      key={`file-${file.id}`}
                      action
                      onClick={() => handleResultClick(file, 'file')}
                      className="search-result-item"
                    >
                      <div className="d-flex align-items-start">
                        <Badge bg="success" className="search-result-badge me-2">
                          File
                        </Badge>
                        <div>
                          <div className="search-result-title">
                            {highlightMatch(file.file_name, query)}
                          </div>
                          <div className="search-result-subtitle">
                            {file.vendor_name && (
                              <span className="me-2">
                                Vendor: {highlightMatch(file.vendor_name, query)}
                              </span>
                            )}
                            {file.invoice_number && (
                              <span>
                                Invoice: {highlightMatch(file.invoice_number, query)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </>
              )}
              
              {results.anomalies.length > 0 && (
                <>
                  <ListGroup.Item className="search-category-header">
                    Anomalies ({results.anomalies.length})
                  </ListGroup.Item>
                  
                  {results.anomalies.map((anomaly) => (
                    <ListGroup.Item 
                      key={`anomaly-${anomaly.id}`}
                      action
                      onClick={() => handleResultClick(anomaly, 'anomaly')}
                      className="search-result-item"
                    >
                      <div className="d-flex align-items-start">
                        <Badge bg="warning" text="dark" className="search-result-badge me-2">
                          Anomaly
                        </Badge>
                        <div>
                          <div className="search-result-title">
                            {highlightMatch(anomaly.anomaly_type, query)}
                          </div>
                          <div className="search-result-subtitle">
                            {highlightMatch(anomaly.description, query)}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </>
              )}
            </ListGroup>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSearch;

