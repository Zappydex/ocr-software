// src/features/user/components/Settings.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaSun, FaMoon, FaUser, FaProjectDiagram } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { toggleProjectActive, fetchProjects } from '../../../services/project/api';
import '../styles/Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('light');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [projectDisplaySettings, setProjectDisplaySettings] = useState({
    showInactive: true,
    sortBy: 'date',
    displayMode: 'grid'
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const projectsData = await fetchProjects();
        setProjects(projectsData);
        setError(null);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
    
    // Get current theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    // Apply theme to the application
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    setSuccess('Theme settings saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleProjectDisplayChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newSettings = {
      ...projectDisplaySettings,
      [name]: type === 'checkbox' ? checked : value
    };
    
    setProjectDisplaySettings(newSettings);
    localStorage.setItem('projectDisplaySettings', JSON.stringify(newSettings));
    
    setSuccess('Project display settings saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleToggleProjectActive = async (projectId, currentStatus) => {
    try {
      setLoading(true);
      await toggleProjectActive(projectId);
      
      // Update local state
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, is_active: !currentStatus } 
          : project
      ));
      
      setSuccess(`Project ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error toggling project status:', err);
      setError('Failed to update project status. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="settings-container">
      <h2 className="settings-title">Settings</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Tabs defaultActiveKey="appearance" id="settings-tabs" className="mb-4">
        <Tab eventKey="appearance" title="Appearance" className="settings-tab">
          <Card className="settings-card">
            <Card.Header>
              <div className="d-flex align-items-center">
                {theme === 'dark' ? <FaMoon className="me-2" /> : <FaSun className="me-2" />}
                <h5 className="mb-0">Theme Settings</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Application Theme</Form.Label>
                  <Form.Select 
                    value={theme} 
                    onChange={handleThemeChange}
                    aria-label="Select theme"
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">System Default</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Choose how the application looks
                  </Form.Text>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="account" title="Account" className="settings-tab">
          <Card className="settings-card">
            <Card.Header>
              <div className="d-flex align-items-center">
                <FaUser className="me-2" />
                <h5 className="mb-0">Account Information</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={user?.username || ''} 
                        disabled 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={user?.email || ''} 
                        disabled 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="mt-3">
                  <Button variant="outline-primary" size="sm">
                    Change Password
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="projects" title="Projects" className="settings-tab">
          <Card className="settings-card">
            <Card.Header>
              <div className="d-flex align-items-center">
                <FaProjectDiagram className="me-2" />
                <h5 className="mb-0">Project Settings</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Form className="mb-4">
                <h6>Display Preferences</h6>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="switch"
                        id="show-inactive"
                        label="Show Inactive Projects"
                        name="showInactive"
                        checked={projectDisplaySettings.showInactive}
                        onChange={handleProjectDisplayChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sort Projects By</Form.Label>
                      <Form.Select 
                        name="sortBy"
                        value={projectDisplaySettings.sortBy}
                        onChange={handleProjectDisplayChange}
                      >
                        <option value="date">Date Created</option>
                        <option value="name">Company Name</option>
                        <option value="activity">Last Activity</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Display Mode</Form.Label>
                      <Form.Select 
                        name="displayMode"
                        value={projectDisplaySettings.displayMode}
                        onChange={handleProjectDisplayChange}
                      >
                        <option value="grid">Grid View</option>
                        <option value="list">List View</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
              
              <h6>Project Status Management</h6>
              {loading ? (
                <div className="text-center py-3">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-3">No projects found</div>
              ) : (
                <div className="project-status-list">
                  {projects.map(project => (
                    <div key={project.id} className="project-status-item">
                      <div className="project-info">
                        <div className="project-name">{project.company_name}</div>
                        <div className="project-id">ID: {project.id}</div>
                      </div>
                      <Form.Check 
                        type="switch"
                        id={`project-active-${project.id}`}
                        checked={project.is_active}
                        onChange={() => handleToggleProjectActive(project.id, project.is_active)}
                        label={project.is_active ? "Active" : "Inactive"}
                        className="project-status-toggle"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Settings;
