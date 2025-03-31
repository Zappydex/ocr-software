from django import forms
from django.core.validators import RegexValidator, EmailValidator, URLValidator
from .models import Project, Anomaly

class ProjectForm(forms.ModelForm):
    """
    Form for creating and updating projects.
    """
    # Custom validators
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    email_validator = EmailValidator(message="Enter a valid email address.")
    url_validator = URLValidator(message="Enter a valid URL.")
    
    # Form fields with validators
    project_type = forms.ChoiceField(
        choices=Project.TYPE_CHOICES,
        widget=forms.RadioSelect,
        initial='company'
    )
    company_name = forms.CharField(max_length=255, required=True)
    phone = forms.CharField(validators=[phone_regex], max_length=17, required=False)
    email = forms.EmailField(validators=[email_validator], required=False)
    website = forms.URLField(validators=[url_validator], required=False)
    
    # Business information
    business_reg_no = forms.CharField(max_length=100, required=False)
    vat_reg_no = forms.CharField(max_length=100, required=False)
    tax_id = forms.CharField(max_length=100, required=False)
    
    # Address information
    address = forms.CharField(required=False, widget=forms.Textarea(attrs={'rows': 3}))
    state = forms.CharField(max_length=100, required=False)
    city = forms.CharField(max_length=100, required=False)
    street_1 = forms.CharField(max_length=255, required=False)
    street_2 = forms.CharField(max_length=255, required=False)
    zip_code = forms.CharField(max_length=20, required=False)
    
    class Meta:
        model = Project
        fields = [
            'project_type', 'company_name', 'phone', 'email', 'website',
            'business_reg_no', 'vat_reg_no', 'tax_id',
            'address', 'state', 'city', 'street_1', 'street_2', 'zip_code'
        ]
    
    def clean(self):
        """
        Custom validation to ensure required fields based on project_type.
        """
        cleaned_data = super().clean()
        project_type = cleaned_data.get('project_type')
        company_name = cleaned_data.get('company_name')
        
        if not company_name:
            if project_type == 'company':
                self.add_error('company_name', 'Company name is required for company projects.')
            else:
                self.add_error('company_name', 'Name is required for individual projects.')
        
        return cleaned_data
    
    def save(self, commit=True):
        """
        Ensure project is saved correctly with all fields.
        """
        project = super().save(commit=False)
        
        # Make sure all fields are properly set
        project.project_type = self.cleaned_data.get('project_type')
        project.company_name = self.cleaned_data.get('company_name')
        project.phone = self.cleaned_data.get('phone', '')
        project.email = self.cleaned_data.get('email', '')
        project.website = self.cleaned_data.get('website', '')
        project.business_reg_no = self.cleaned_data.get('business_reg_no', '')
        project.vat_reg_no = self.cleaned_data.get('vat_reg_no', '')
        project.tax_id = self.cleaned_data.get('tax_id', '')
        project.address = self.cleaned_data.get('address', '')
        project.state = self.cleaned_data.get('state', '')
        project.city = self.cleaned_data.get('city', '')
        project.street_1 = self.cleaned_data.get('street_1', '')
        project.street_2 = self.cleaned_data.get('street_2', '')
        project.zip_code = self.cleaned_data.get('zip_code', '')
        
        if commit:
            project.save()
        
        return project


class AnomalyReviewForm(forms.ModelForm):
    """
    Form for reviewing and resolving anomalies.
    """
    resolution_notes = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3}),
        required=False,
        help_text="Optional notes about how this anomaly was resolved"
    )
    
    class Meta:
        model = Anomaly
        fields = ['resolved', 'resolution_notes']
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super(AnomalyReviewForm, self).__init__(*args, **kwargs)
    
    def save(self, commit=True):
        anomaly = super().save(commit=False)
        
        if anomaly.resolved and not anomaly.resolved_at:
            from django.utils import timezone
            anomaly.resolved_at = timezone.now()
            anomaly.resolved_by = self.user
        
        if commit:
            anomaly.save()
        
        return anomaly
