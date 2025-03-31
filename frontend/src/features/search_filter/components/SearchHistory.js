// src/features/search_filter/components/SearchHistory.js
import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Spinner, Badge } from 'react-bootstrap';
import { FaSearch, FaTimes, FaHistory, FaTrashAlt } from 'react-icons/fa';
import { getSearchHistory, clearSearchHistory } from '../../../services/search/api';
import '../styles/SearchHistory.css';

const SearchHistory = ({ onSelectSearch, maxItems = 10 }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      setLoading(true);
      const response = await getSearchHistory();
      setHistory(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching search history:', err);
      setError('Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      setLoading(true);
      await clearSearchHistory();
      setHistory([]);
      setError(null);
    } catch (err) {
      console.error('Error clearing search history:', err);
      setError('Failed to clear search history');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearch = (query, filters) => {
    if (onSelectSearch) {
      onSelectSearch(query, filters);
    }
  };

  // Format the timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Get badge variant based on result type
  const getBadgeVariant = (type) => {
    switch (type) {
      case 'project':
        return 'primary';
      case 'file':
        return 'success';
      case 'anomaly':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="search-history-container">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FaHistory className="me-2" />
          <h5 className="mb-0">Recent Searches</h5>
        </div>
        {history.length > 0 && (
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleClearHistory}
            disabled={loading}
            className="clear-history-btn"
          >
            <FaTrashAlt className="me-1" />
            Clear History
          </Button>
        )}
      </Card.Header>
      
      <Card.Body className="p-0">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status" size="sm">
              <span className="visually-hidden">Loading search history...</span>
            </Spinner>
            <span className="ms-2">Loading...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-danger">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p>No recent searches</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {history.slice(0, maxItems).map((item) => (
              <ListGroup.Item 
                key={item.id} 
                action 
                className="search-history-item"
                onClick={() => handleSelectSearch(item.query, item.filters)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="search-query">
                      <FaSearch className="me-2 search-icon" />
                      <span className="query-text">{item.query}</span>
                    </div>
                    
                    <div className="search-meta">
                      <span className="search-timestamp">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      
                      {item.result_count !== undefined && (
                        <span className="search-result-count ms-2">
                          {item.result_count} results
                        </span>
                      )}
                      
                      {item.filters && Object.keys(item.filters).some(key => item.filters[key]) && (
                        <span className="search-filters ms-2">
                          <Badge bg="light" text="dark">Filtered</Badge>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="search-type-badges">
                    {item.result_types && item.result_types.map((type, index) => (
                      <Badge 
                        key={index} 
                        bg={getBadgeVariant(type)} 
                        className="me-1"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
            
            {history.length > maxItems && (
              <ListGroup.Item className="text-center view-more">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => {/* Navigate to full history page */}}
                >
                  View all searches
                </Button>
              </ListGroup.Item>
            )}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default SearchHistory;
