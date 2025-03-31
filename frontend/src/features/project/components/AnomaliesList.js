import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spinner, Alert, Form } from 'react-bootstrap';
import AnomalyItem from './AnomalyItem';
import { fetchProjectAnomalies, fetchAllAnomalies } from '../../../services/project/api';
import '../styles/AnomaliesList.css';

const AnomaliesList = ({ projectId, isProjectSpecific = false }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'resolved', 'unresolved'
  const { id } = useParams();
  
  // Use the projectId prop if provided, otherwise use the id from URL params
  const activeProjectId = projectId || id;

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        setLoading(true);
        // Determine which API endpoint to use based on whether we're in project-specific view
        let params = {};
        if (filter === 'resolved') params.resolved = true;
        if (filter === 'unresolved') params.resolved = false;
        
        let response;
        if (activeProjectId && isProjectSpecific) {
          response = await fetchProjectAnomalies(activeProjectId, params);
        } else {
          response = await fetchAllAnomalies();
        }
        
        setAnomalies(response);
        setLoading(false);
      } catch (err) {
        setError('Failed to load anomalies. Please try again later.');
        setLoading(false);
        console.error('Error fetching anomalies:', err);
      }
    };

    fetchAnomalies();
  }, [activeProjectId, filter, isProjectSpecific]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleAnomalyResolved = (resolvedAnomalyId) => {
    // Update the local state to reflect the resolved anomaly
    setAnomalies(anomalies.map(anomaly => 
      anomaly.id === resolvedAnomalyId 
        ? { ...anomaly, resolved: true, resolved_at: new Date().toISOString() } 
        : anomaly
    ));
  };

  if (loading) {
    return (
      <div className="anomalies-loading">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading anomalies...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Card className="anomalies-list-container">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          {isProjectSpecific ? 'Project Anomalies' : 'All Anomalies'}
        </h5>
        <Form.Select 
          className="anomaly-filter" 
          value={filter} 
          onChange={handleFilterChange}
          aria-label="Filter anomalies"
        >
          <option value="all">All Anomalies</option>
          <option value="unresolved">Unresolved Only</option>
          <option value="resolved">Resolved Only</option>
        </Form.Select>
      </Card.Header>
      <Card.Body>
        {anomalies.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">No anomalies found.</p>
          </div>
        ) : (
          <div className="anomalies-list">
            {anomalies.map(anomaly => (
              <AnomalyItem 
                key={anomaly.id} 
                anomaly={anomaly} 
                onResolved={handleAnomalyResolved}
                isProjectSpecific={isProjectSpecific}
              />
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AnomaliesList;
