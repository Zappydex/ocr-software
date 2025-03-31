import React, { useState } from 'react';
import { Card, Badge, Button, Collapse } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ResolveAnomaly from './ResolveAnomaly';
import '../styles/AnomalyItem.css';

const AnomalyItem = ({ anomaly, onResolved, isProjectSpecific }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleResolveClick = () => {
    setShowResolveModal(true);
  };

  const handleResolveClose = () => {
    setShowResolveModal(false);
  };

  const handleResolveSuccess = (resolvedAnomalyId) => {
    setShowResolveModal(false);
    if (onResolved) {
      onResolved(resolvedAnomalyId);
    }
  };

  // Determine badge color based on anomaly type
  const getBadgeVariant = (type) => {
    switch (type.toLowerCase()) {
      case 'missing data':
        return 'warning';
      case 'invalid format':
        return 'info';
      case 'duplicate entry':
        return 'secondary';
      case 'calculation error':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <Card className="anomaly-item mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Badge 
            bg={getBadgeVariant(anomaly.anomaly_type)} 
            className="me-2 anomaly-badge"
          >
            {anomaly.anomaly_type}
          </Badge>
          <span className="anomaly-title">{anomaly.description}</span>
        </div>
        <div className="anomaly-actions">
          {!isProjectSpecific && (
            <Link 
              to={`/workspace/projects/${anomaly.project.id}/dashboard`} 
              className="btn btn-sm btn-outline-secondary me-2"
            >
              View Project
            </Link>
          )}
          <Button 
            variant="link" 
            size="sm" 
            onClick={toggleDetails} 
            className="details-toggle"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </Card.Header>
      
      <Collapse in={showDetails}>
        <div>
          <Card.Body>
            <div className="anomaly-details">
              <div className="detail-row">
                <span className="detail-label">Detected:</span>
                <span className="detail-value">
                  {formatDistanceToNow(new Date(anomaly.detected_at), { addSuffix: true })}
                </span>
              </div>
              
              {anomaly.processed_file && (
                <div className="detail-row">
                  <span className="detail-label">File:</span>
                  <span className="detail-value">{anomaly.processed_file.file_name}</span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {anomaly.resolved ? (
                    <Badge bg="success">Resolved</Badge>
                  ) : (
                    <Badge bg="danger">Unresolved</Badge>
                  )}
                </span>
              </div>
              
              {anomaly.resolved && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Resolved:</span>
                    <span className="detail-value">
                      {formatDistanceToNow(new Date(anomaly.resolved_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Resolved by:</span>
                    <span className="detail-value">{anomaly.resolved_by?.username || 'Unknown'}</span>
                  </div>
                  {anomaly.resolution_notes && (
                    <div className="detail-row">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{anomaly.resolution_notes}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {!anomaly.resolved && (
              <div className="text-end mt-3">
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleResolveClick}
                >
                  Resolve Anomaly
                </Button>
              </div>
            )}
          </Card.Body>
        </div>
      </Collapse>
      
      <ResolveAnomaly 
        show={showResolveModal} 
        onHide={handleResolveClose} 
        anomaly={anomaly}
        onResolved={handleResolveSuccess}
      />
    </Card>
  );
};

export default AnomalyItem;
