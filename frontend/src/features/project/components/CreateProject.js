// src/features/project/components/CreateProject.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { WorkspaceContext } from '../../../context/WorkspaceContext';
import { createProject } from '../../../services/project/api';

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const FormTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 24px;
  color: #343a40;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 16px;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
`;

const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -12px;
`;

const FormGroup = styled.div`
  flex: ${props => props.fullWidth ? '1 0 100%' : '1 0 50%'};
  padding: 0 12px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    flex: 1 0 100%;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    border-color: #0056b3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.25);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  background-color: #fff;
  
  &:focus {
    border-color: #0056b3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.25);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    border-color: #0056b3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.25);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  color: #495057;
  margin-right: 12px;
  
  &:hover:not(:disabled) {
    background-color: #e9ecef;
  }
`;

const SaveButton = styled(Button)`
  background-color: #0056b3;
  border: none;
  color: #ffffff;
  
  &:hover:not(:disabled) {
    background-color: #004494;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  margin-top: 4px;
`;

const CreateProject = ({ onProjectCreated }) => {
  const navigate = useNavigate();
  const { handleProjectSelect } = useContext(WorkspaceContext);
  
  // Form state
  const [formData, setFormData] = useState({
    entity_type: 'company', // Default to company
    company_name: '',
    business_reg_no: '',
    vat_reg_no: '',
    tax_id: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    notes: '',
    is_active: true
  });
  
  // Form validation and submission state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    
    if (formData.entity_type === 'company' && !formData.business_reg_no.trim()) {
      newErrors.business_reg_no = 'Business registration number is required for companies';
    }
    
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }
    
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }
    
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'Contact phone is required';
    }
    
    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const newProject = await createProject(formData);
      
      // Update context with new project
      if (handleProjectSelect) {
        handleProjectSelect(newProject);
      }
      
      // Call callback if provided
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      // Navigate to the dashboard for the new project
      navigate(`/workspace/dashboard/${newProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setSubmitError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/workspace');
  };
  
  return (
    <FormContainer>
      <FormTitle>Create New Project</FormTitle>
      
      <form onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>Entity Information</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="entity_type">Entity Type</Label>
              <Select
                id="entity_type"
                name="entity_type"
                value={formData.entity_type}
                onChange={handleChange}
              >
                <option value="company">Company</option>
                <option value="individual">Individual</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="company_name">
                {formData.entity_type === 'company' ? 'Company Name' : 'Full Name'}*
              </Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder={formData.entity_type === 'company' ? 'Enter company name' : 'Enter full name'}
              />
              {errors.company_name && <ErrorMessage>{errors.company_name}</ErrorMessage>}
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="business_reg_no">Business Registration Number</Label>
              <Input
                id="business_reg_no"
                name="business_reg_no"
                value={formData.business_reg_no}
                onChange={handleChange}
                placeholder="Enter business registration number"
              />
              {errors.business_reg_no && <ErrorMessage>{errors.business_reg_no}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="vat_reg_no">VAT Registration Number</Label>
              <Input
                id="vat_reg_no"
                name="vat_reg_no"
                value={formData.vat_reg_no}
                onChange={handleChange}
                placeholder="Enter VAT registration number"
              />
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                placeholder="Enter tax ID"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="is_active">Status</Label>
              <Select
                id="is_active"
                name="is_active"
                value={formData.is_active.toString()}
                onChange={(e) => handleChange({
                  target: {
                    name: 'is_active',
                    value: e.target.value === 'true',
                    type: 'checkbox',
                    checked: e.target.value === 'true'
                  }
                })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </FormGroup>
          </FormRow>
        </FormSection>
        
        <FormSection>
          <SectionTitle>Contact Information</SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="contact_person">Contact Person*</Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Enter contact person name"
              />
              {errors.contact_person && <ErrorMessage>{errors.contact_person}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="contact_email">Contact Email*</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="Enter contact email"
              />
              {errors.contact_email && <ErrorMessage>{errors.contact_email}</ErrorMessage>}
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="contact_phone">Contact Phone*</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="Enter contact phone number"
              />
              {errors.contact_phone && <ErrorMessage>{errors.contact_phone}</ErrorMessage>}
            </FormGroup>
          </FormRow>
        </FormSection>
        
        <FormSection>
          <SectionTitle>Address</SectionTitle>
          
          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="address_line1">Address Line 1*</Label>
              <Input
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleChange}
                placeholder="Enter street address"
              />
              {errors.address_line1 && <ErrorMessage>{errors.address_line1}</ErrorMessage>}
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleChange}
                placeholder="Enter apartment, suite, unit, etc."
              />
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="city">City*</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
              {errors.city && <ErrorMessage>{errors.city}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="state_province">State/Province</Label>
              <Input
                id="state_province"
                name="state_province"
                value={formData.state_province}
                onChange={handleChange}
                placeholder="Enter state or province"
              />
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="Enter postal code"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="country">Country*</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Enter country"
              />
              {errors.country && <ErrorMessage>{errors.country}</ErrorMessage>}
            </FormGroup>
          </FormRow>
        </FormSection>
        
        <FormSection>
          <SectionTitle>Additional Information</SectionTitle>
          
          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="notes">Notes</Label>
              <TextArea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any additional notes about this project"
              />
            </FormGroup>
          </FormRow>
        </FormSection>
        
        {submitError && (
          <ErrorMessage style={{ marginBottom: '16px' }}>{submitError}</ErrorMessage>
        )}
        
        <ButtonGroup>
          <CancelButton type="button" onClick={handleCancel}>
            Cancel
          </CancelButton>
          <SaveButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </SaveButton>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default CreateProject;
