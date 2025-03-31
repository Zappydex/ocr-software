from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProcessedFile, ProjectHistory, Anomaly

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user information in project-related responses"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id', 'username', 'email']


class ProcessedFileSerializer(serializers.ModelSerializer):
    """Serializer for processed files within a project"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcessedFile
        fields = [
            'id', 'file_name', 'file_type', 'file_size', 
            'upload_date', 'processed_date', 'invoice_number', 
            'vendor_name', 'file_url'
        ]
        read_only_fields = ['id', 'upload_date', 'processed_date']
    
    def get_file_url(self, obj):
        """Get the URL for accessing the file"""
        return obj.get_file_url()


class AnomalySerializer(serializers.ModelSerializer):
    """Serializer for anomalies detected in processed files"""
    resolved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Anomaly
        fields = [
            'id', 'anomaly_type', 'description', 'detected_at',
            'resolved', 'resolved_at', 'resolved_by'
        ]
        read_only_fields = ['id', 'anomaly_type', 'description', 'detected_at']
    
    def update(self, instance, validated_data):
        """Handle resolving anomalies"""
        user = self.context['request'].user
        
        if validated_data.get('resolved', False) and not instance.resolved:
            from django.utils import timezone
            instance.resolved = True
            instance.resolved_at = timezone.now()
            instance.resolved_by = user
        
        instance.save()
        return instance


class ProjectHistorySerializer(serializers.ModelSerializer):
    """Serializer for project history entries"""
    performed_by = UserSerializer(read_only=True)
    related_file = ProcessedFileSerializer(read_only=True)
    
    class Meta:
        model = ProjectHistory
        fields = [
            'id', 'action', 'timestamp', 'description',
            'performed_by', 'related_file'
        ]
        read_only_fields = fields


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for project creation and management"""
    user = UserSerializer(read_only=True)
    files_count = serializers.SerializerMethodField()
    anomalies_count = serializers.SerializerMethodField()
    unresolved_anomalies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'user', 'project_type', 'company_name', 
            'created_at', 'updated_at', 'phone', 'email', 
            'website', 'business_reg_no', 'vat_reg_no', 
            'tax_id', 'address', 'state', 'city', 
            'street_1', 'street_2', 'zip_code', 
            'is_active', 'files_count', 'anomalies_count',
            'unresolved_anomalies_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create a new project and associate it with the current user"""
        user = self.context['request'].user
        project = Project.objects.create(user=user, **validated_data)
        
        # Create a project history entry for project creation
        ProjectHistory.objects.create(
            project=project,
            action='create',
            description=f"Project '{project.company_name}' created",
            performed_by=user
        )
        
        return project
    
    def update(self, instance, validated_data):
        """Update a project and record the change in project history"""
        user = self.context['request'].user
        
        # Update the project instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Create a project history entry for the update
        ProjectHistory.objects.create(
            project=instance,
            action='update',
            description=f"Project '{instance.company_name}' updated",
            performed_by=user
        )
        
        return instance
    
    def get_files_count(self, obj):
        """Get the count of files associated with this project"""
        return obj.files.count()
    
    def get_anomalies_count(self, obj):
        """Get the count of anomalies associated with this project"""
        return obj.anomalies.count()
    
    def get_unresolved_anomalies_count(self, obj):
        """Get the count of unresolved anomalies associated with this project"""
        return obj.anomalies.filter(resolved=False).count()


class ProjectDetailSerializer(ProjectSerializer):
    """Detailed serializer for project with related files, history and anomalies"""
    files = ProcessedFileSerializer(many=True, read_only=True)
    history = ProjectHistorySerializer(many=True, read_only=True)
    anomalies = AnomalySerializer(many=True, read_only=True)
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['files', 'history', 'anomalies']
