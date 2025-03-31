import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { resolveAnomaly } from '../../../services/project/api';
import '../styles/ResolveAnomaly.css';

const ResolveAnomaly = ({ show, onHide, anomaly, onResolved }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to resolve the anomaly
      await resolveAnomaly(anomaly.id, {
        resolved: true,
        resolution_notes: notes
      });
      
      // Notify parent component that resolution was successful
      if (onResolved) {
        onResolved(anomaly.id);
      }
      
      // Reset form
      setNotes('');
      setValidated(false);
      
    } catch (err) {
      setError('Failed to resolve anomaly. Please try again.');
      console.error('Error resolving anomaly:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      className="resolve-anomaly-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Resolve Anomaly</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="anomaly-summary mb-4">
          <h6>Anomaly Details</h6>
          <p><strong>Type:</strong> {anomaly?.anomaly_type}</p>
          <p><strong>Description:</strong> {anomaly?.description}</p>
          {anomaly?.processed_file && (
            <p><strong>File:</strong> {anomaly.processed_file.file_name}</p>
          )}
        </div>
        
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Resolution Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe how this anomaly was resolved..."
              value={notes}
              onChange={handleNotesChange}
              required
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              Please provide resolution notes.
            </Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Resolving...
            </>
          ) : (
            'Resolve Anomaly'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResolveAnomaly;
