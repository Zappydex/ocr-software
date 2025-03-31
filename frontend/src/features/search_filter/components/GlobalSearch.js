import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Button, Dropdown, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaHistory, FaFolder, FaFile, FaExclamationTriangle } from 'react-icons/fa';
import { globalSearch, getSearchHistory, clearSearchHistory } from '../../../services/search/api';
import '../styles/GlobalSearch.css';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Types of search with their icons and labels
  const searchTypes = [
    { value: 'all', label: 'All', icon: <FaSearch /> },
    { value: 'projects', label: 'Projects', icon: <FaFolder /> },
    { value: 'files', label: 'Files', icon: <FaFile /> },
    { value: 'anomalies', label: 'Anomalies', icon: <FaExclamationTriangle /> }
  ];

  // Fetch search history on component mount
  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        const history = await getSearchHistory();
        setSearchHistory(history);
      } catch (error) {
        console.error('Error fetching search history:', error);
      }
    };

    fetchSearchHistory();
  }, []);

  // Handle clicks outside the search component to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setShowHistory(false);
    setShowResults(true);
    
    try {
      const searchParams = {
        q: query,
        type: searchType !== 'all' ? searchType : undefined
      };
      
      const data = await globalSearch(searchParams);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ error: 'Failed to perform search. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
  };

  const handleHistoryItemClick = (historyItem) => {
    setQuery(historyItem.query);
    setSearchType(historyItem.type || 'all');
    setShowHistory(false);
    
    // Trigger search with the history item
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  const handleClearHistory = async () => {
    try {
      await clearSearchHistory();
      setSearchHistory([]);
      setShowHistory(false);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    
    // Navigate based on result type
    if (result.type === 'project') {
      navigate(`/workspace/projects/${result.id}/dashboard`);
    } else if (result.type === 'file') {
      navigate(`/workspace/projects/${result.project_id}/dashboard`, { 
        state: { selectedFile: result.id } 
      });
    } else if (result.type === 'anomaly') {
      navigate(`/workspace/projects/${result.project_id}/dashboard`, { 
        state: { selectedAnomaly: result.id } 
      });
    }
  };

  const renderSearchResults = () => {
    if (!results) return null;
    
    if (results.error) {
      return (
        <div className="search-error p-3 text-danger">
          <p>{results.error}</p>
        </div>
      );
    }
    
    const { projects = [], files = [], anomalies = [] } = results;
    const totalResults = projects.length + files.length + anomalies.length;
    
    if (totalResults === 0) {
      return (
        <div className="no-results p-3 text-center">
          <p className="text-muted">No results found for "{query}"</p>
        </div>
      );
    }
    
    return (
      <div className="search-results-container">
        {projects.length > 0 && (
          <div className="result-section">
            <h6 className="result-section-title">
              <FaFolder className="me-2" /> Projects
            </h6>
            <div className="result-items">
              {projects.map(project => (
                <div 
                  key={`project-${project.id}`} 
                  className="result-item"
                  onClick={() => handleResultClick(project)}
                >
                  <div className="result-icon">
                    <FaFolder />
                  </div>
                  <div className="result-content">
                    <div className="result-title">{project.company_name}</div>
                    <div className="result-subtitle">
                      {project.is_active ? (
                        <Badge bg="success" pill>Active</Badge>
                      ) : (
                        <Badge bg="secondary" pill>Inactive</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {files.length > 0 && (
          <div className="result-section">
            <h6 className="result-section-title">
              <FaFile className="me-2" /> Files
            </h6>
            <div className="result-items">
              {files.map(file => (
                <div 
                  key={`file-${file.id}`} 
                  className="result-item"
                  onClick={() => handleResultClick(file)}
                >
                  <div className="result-icon">
                    <FaFile />
                  </div>
                  <div className="result-content">
                    <div className="result-title">{file.file_name}</div>
                    <div className="result-subtitle">
                      {file.project_name} • {new Date(file.processed_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {anomalies.length > 0 && (
          <div className="result-section">
            <h6 className="result-section-title">
              <FaExclamationTriangle className="me-2" /> Anomalies
            </h6>
            <div className="result-items">
              {anomalies.map(anomaly => (
                <div 
                  key={`anomaly-${anomaly.id}`} 
                  className="result-item"
                  onClick={() => handleResultClick(anomaly)}
                >
                  <div className="result-icon">
                    <FaExclamationTriangle />
                  </div>
                  <div className="result-content">
                    <div className="result-title">{anomaly.anomaly_type}</div>
                    <div className="result-subtitle">
                      {anomaly.project_name} • {anomaly.description.substring(0, 30)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSearchHistory = () => {
    if (searchHistory.length === 0) {
      return (
        <div className="no-history p-3 text-center">
          <p className="text-muted">No search history</p>
        </div>
      );
    }
    
    return (
      <div className="search-history-container">
        <div className="history-header d-flex justify-content-between align-items-center p-2">
          <h6 className="mb-0">Recent Searches</h6>
          <Button 
            variant="link" 
            size="sm" 
            className="text-muted p-0" 
            onClick={handleClearHistory}
          >
            Clear All
          </Button>
        </div>
        <div className="history-items">
          {searchHistory.map((item, index) => (
            <div 
              key={`history-${index}`} 
              className="history-item"
              onClick={() => handleHistoryItemClick(item)}
            >
              <div className="history-icon">
                <FaHistory />
              </div>
              <div className="history-content">
                <div className="history-query">{item.query}</div>
                <div className="history-type">
                  {searchTypes.find(type => type.value === (item.type || 'all'))?.label || 'All'}
                </div>
              </div>
              <div className="history-time">
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="global-search-container" ref={searchRef}>
      <Form onSubmit={handleSearch}>
        <InputGroup>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" id="search-type-dropdown">
              {searchTypes.find(type => type.value === searchType)?.icon}
              <span className="ms-2 d-none d-md-inline">
                {searchTypes.find(type => type.value === searchType)?.label}
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {searchTypes.map(type => (
                <Dropdown.Item 
                  key={type.value} 
                  onClick={() => setSearchType(type.value)}
                  active={searchType === type.value}
                >
                  {type.icon} <span className="ms-2">{type.label}</span>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          
          <Form.Control
            placeholder="Search projects, files, anomalies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim() === '' && searchHistory.length > 0) {
                setShowHistory(true);
              } else if (results) {
                setShowResults(true);
              }
            }}
          />
          
          {query && (
            <Button 
              variant="outline-secondary" 
              onClick={handleClearSearch}
              className="clear-search-btn"
            >
              <FaTimes />
            </Button>
          )}
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || !query.trim()}
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
              <FaSearch />
            )}
          </Button>
        </InputGroup>
      </Form>
      
      {showHistory && !showResults && (
        <div className="search-dropdown">
          {renderSearchHistory()}
        </div>
      )}
      
      {showResults && (
        <div className="search-dropdown">
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Searching...</p>
            </div>
          ) : (
            renderSearchResults()
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
