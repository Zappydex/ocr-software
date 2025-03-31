import uuid
import os
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import RegexValidator, EmailValidator, URLValidator
from django.conf import settings
from google.cloud import storage
import datetime

class Project(models.Model):
    """
    Model for storing project information related to vendors/companies.
    """
    TYPE_CHOICES = (
        ('individual', 'Individual'),
        ('company', 'Company'),
    )
    
    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    project_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='company')
    company_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Contact information
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    email = models.EmailField(validators=[EmailValidator()], blank=True)
    website = models.URLField(validators=[URLValidator()], blank=True)
    
    # Business information
    business_reg_no = models.CharField(max_length=100, blank=True)
    vat_reg_no = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    
    # Address information
    address = models.TextField(blank=True)
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    street_1 = models.CharField(max_length=255, blank=True)
    street_2 = models.CharField(max_length=255, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['company_name']),
        ]
    
    def __str__(self):
        return f"{self.company_name} ({self.id})"

class ProcessedFile(models.Model):
    """
    Model for storing processed files within a project.
    """
    FILE_TYPES = (
        ('pdf', 'PDF Invoice'),
        ('png', 'PNG Invoice'),
        ('jpeg', 'JPEG Invoice'),
        ('zip', 'ZIP Archive'),
        ('excel', 'Exported Excel'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    file_path = models.CharField(max_length=512)  # Store path to file in storage system
    upload_date = models.DateTimeField(auto_now_add=True)
    processed_date = models.DateTimeField(default=timezone.now)
    
    # For invoice files
    invoice_number = models.CharField(max_length=100, blank=True)
    vendor_name = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['-processed_date']
        indexes = [
            models.Index(fields=['project', 'file_type']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['vendor_name']),
        ]
    
    def __str__(self):
        return f"{self.file_name} ({self.file_type})"
    
    def get_file_url(self):
        """Returns the URL to access the file from Google Cloud Storage"""                                       
        # Get the bucket name from settings
        bucket_name = getattr(settings, 'GCS_BUCKET_NAME', 'ocr-engine-storage')
        
        # Create a client
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(self.file_path)
        
        # Generate a signed URL that expires in 1 hour (3600 seconds)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(hours=1),
            method="GET"
        )
        
        return url

class ProjectHistory(models.Model):
    """
    Model for tracking project history and activities.
    """
    ACTION_TYPES = (
        ('create', 'Project Created'),
        ('update', 'Project Updated'),
        ('process', 'File Processed'),
        ('export', 'Data Exported'),
        ('anomaly', 'Anomaly Detected'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='project_actions'
    )
    
    # Optional reference to a processed file
    related_file = models.ForeignKey(
        ProcessedFile, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='history_entries'
    )
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['project', 'action']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.action} on {self.project.company_name} at {self.timestamp}"


class Anomaly(models.Model):
    """
    Model for storing anomalies detected during OCR processing.
    This model links to the anomalies detected by the FastAPI OCR Engine.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='anomalies')
    processed_file = models.ForeignKey(ProcessedFile, on_delete=models.CASCADE, related_name='anomalies')
    anomaly_type = models.CharField(max_length=100)
    description = models.TextField()
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='resolved_anomalies'
    )
    
    class Meta:
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['project', 'resolved']),
            models.Index(fields=['anomaly_type']),
        ]
        verbose_name_plural = "Anomalies"
    
    def __str__(self):
        return f"{self.anomaly_type} in {self.processed_file.file_name}"
    
    def resolve(self, user):
        """Mark an anomaly as resolved"""
        self.resolved = True
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.save()
