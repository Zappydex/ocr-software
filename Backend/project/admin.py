from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Project, ProcessedFile, ProjectHistory, Anomaly


class ProcessedFileInline(admin.TabularInline):
    """Inline admin for ProcessedFile model"""
    model = ProcessedFile
    extra = 0
    readonly_fields = ['id', 'file_name', 'file_type', 'file_size', 'upload_date', 'processed_date', 'file_preview']
    fields = ['id', 'file_name', 'file_type', 'file_size', 'upload_date', 'processed_date', 'file_preview']
    can_delete = False
    max_num = 0
    
    def file_preview(self, obj):
        """Generate a link to view/download the file"""
        return format_html('<a href="{}" target="_blank">View File</a>', obj.get_file_url())
    
    file_preview.short_description = 'File'


class ProjectHistoryInline(admin.TabularInline):
    """Inline admin for ProjectHistory model"""
    model = ProjectHistory
    extra = 0
    readonly_fields = ['action', 'timestamp', 'description', 'performed_by', 'related_file']
    fields = ['action', 'timestamp', 'description', 'performed_by', 'related_file']
    can_delete = False
    max_num = 0
    ordering = ['-timestamp']


class AnomalyInline(admin.TabularInline):
    """Inline admin for Anomaly model"""
    model = Anomaly
    extra = 0
    readonly_fields = ['anomaly_type', 'description', 'detected_at', 'resolved', 'resolved_at', 'resolved_by']
    fields = ['anomaly_type', 'description', 'detected_at', 'resolved', 'resolved_at', 'resolved_by']
    can_delete = False
    max_num = 0
    ordering = ['-detected_at']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin interface for Project model"""
    list_display = ['id', 'company_name', 'project_type', 'user', 'created_at', 'updated_at', 'is_active', 'files_count', 'anomalies_count']
    list_filter = ['project_type', 'is_active', 'created_at', 'updated_at']
    search_fields = ['id', 'company_name', 'user__username', 'user__email', 'business_reg_no', 'vat_reg_no', 'tax_id']
    readonly_fields = ['id', 'created_at', 'updated_at', 'files_count', 'anomalies_count']
    fieldsets = [
        ('Basic Information', {
            'fields': ['id', 'user', 'project_type', 'company_name', 'created_at', 'updated_at', 'is_active']
        }),
        ('Contact Information', {
            'fields': ['phone', 'email', 'website']
        }),
        ('Business Information', {
            'fields': ['business_reg_no', 'vat_reg_no', 'tax_id']
        }),
        ('Address Information', {
            'fields': ['address', 'state', 'city', 'street_1', 'street_2', 'zip_code']
        }),
        ('Statistics', {
            'fields': ['files_count', 'anomalies_count']
        })
    ]
    inlines = [ProcessedFileInline, AnomalyInline, ProjectHistoryInline]
    
    def files_count(self, obj):
        """Count of files associated with this project"""
        count = obj.files.count()
        if count > 0:
            url = reverse('admin:project_processedfile_changelist') + f'?project__id__exact={obj.id}'
            return format_html('<a href="{}">{} files</a>', url, count)
        return '0 files'
    
    def anomalies_count(self, obj):
        """Count of anomalies associated with this project"""
        total = obj.anomalies.count()
        unresolved = obj.anomalies.filter(resolved=False).count()
        if total > 0:
            url = reverse('admin:project_anomaly_changelist') + f'?project__id__exact={obj.id}'
            return format_html('<a href="{}">{} total / {} unresolved</a>', url, total, unresolved)
        return '0 anomalies'
    
    files_count.short_description = 'Files'
    anomalies_count.short_description = 'Anomalies'


@admin.register(ProcessedFile)
class ProcessedFileAdmin(admin.ModelAdmin):
    """Admin interface for ProcessedFile model"""
    list_display = ['id', 'file_name', 'file_type', 'project_link', 'upload_date', 'processed_date', 'file_size_display', 'file_preview']
    list_filter = ['file_type', 'upload_date', 'processed_date']
    search_fields = ['id', 'file_name', 'invoice_number', 'vendor_name', 'project__company_name']
    readonly_fields = ['id', 'upload_date', 'processed_date', 'file_preview']
    fieldsets = [
        ('File Information', {
            'fields': ['id', 'project', 'file_name', 'file_type', 'file_size', 'file_path', 'file_preview']
        }),
        ('Timestamps', {
            'fields': ['upload_date', 'processed_date']
        }),
        ('Invoice Details', {
            'fields': ['invoice_number', 'vendor_name']
        })
    ]
    
    def project_link(self, obj):
        """Generate a link to the project admin page"""
        url = reverse('admin:project_project_change', args=[obj.project.id])
        return format_html('<a href="{}">{}</a>', url, obj.project.company_name)
    
    def file_size_display(self, obj):
        """Display file size in human-readable format"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}"
            size /= 1024
    
    def file_preview(self, obj):
        """Generate a link to view/download the file"""
        return format_html('<a href="{}" target="_blank">View File</a>', obj.get_file_url())
    
    project_link.short_description = 'Project'
    file_size_display.short_description = 'File Size'
    file_preview.short_description = 'File'


@admin.register(ProjectHistory)
class ProjectHistoryAdmin(admin.ModelAdmin):
    """Admin interface for ProjectHistory model"""
    list_display = ['id', 'project_link', 'action', 'timestamp', 'performed_by', 'description_short']
    list_filter = ['action', 'timestamp']
    search_fields = ['id', 'project__company_name', 'description', 'performed_by__username']
    readonly_fields = ['id', 'project', 'action', 'timestamp', 'description', 'performed_by', 'related_file']
    fieldsets = [
        ('History Information', {
            'fields': ['id', 'project', 'action', 'timestamp']
        }),
        ('Details', {
            'fields': ['description', 'performed_by', 'related_file']
        })
    ]
    
    def project_link(self, obj):
        """Generate a link to the project admin page"""
        url = reverse('admin:project_project_change', args=[obj.project.id])
        return format_html('<a href="{}">{}</a>', url, obj.project.company_name)
    
    def description_short(self, obj):
        """Truncate description for display in list view"""
        if len(obj.description) > 50:
            return obj.description[:50] + '...'
        return obj.description
    
    project_link.short_description = 'Project'
    description_short.short_description = 'Description'


@admin.register(Anomaly)
class AnomalyAdmin(admin.ModelAdmin):
    """Admin interface for Anomaly model"""
    list_display = ['id', 'project_link', 'anomaly_type', 'detected_at', 'resolved_status', 'resolved_by', 'file_link']
    list_filter = ['anomaly_type', 'resolved', 'detected_at', 'resolved_at']
    search_fields = ['id', 'project__company_name', 'anomaly_type', 'description', 'resolved_by__username']
    readonly_fields = ['id', 'project', 'processed_file', 'anomaly_type', 'description', 'detected_at']
    fieldsets = [
        ('Anomaly Information', {
            'fields': ['id', 'project', 'processed_file', 'anomaly_type', 'detected_at']
        }),
        ('Description', {
            'fields': ['description']
        }),
        ('Resolution', {
            'fields': ['resolved', 'resolved_at', 'resolved_by']
        })
    ]
    actions = ['mark_as_resolved']
    
    def project_link(self, obj):
        """Generate a link to the project admin page"""
        url = reverse('admin:project_project_change', args=[obj.project.id])
        return format_html('<a href="{}">{}</a>', url, obj.project.company_name)
    
    def file_link(self, obj):
        """Generate a link to the processed file admin page"""
        if obj.processed_file:
            url = reverse('admin:project_processedfile_change', args=[obj.processed_file.id])
            return format_html('<a href="{}">{}</a>', url, obj.processed_file.file_name)
        return '-'
    
    def resolved_status(self, obj):
        """Display resolved status with color coding"""
        if obj.resolved:
            return format_html('<span style="color: green;">✓ Resolved</span>')
        return format_html('<span style="color: red;">✗ Unresolved</span>')
    
    def mark_as_resolved(self, request, queryset):
        """Admin action to mark selected anomalies as resolved"""
        from django.utils import timezone
        updated = queryset.filter(resolved=False).update(
            resolved=True,
            resolved_at=timezone.now(),
            resolved_by=request.user
        )
        self.message_user(request, f"{updated} anomalies marked as resolved.")
    
    project_link.short_description = 'Project'
    file_link.short_description = 'File'
    resolved_status.short_description = 'Status'
    mark_as_resolved.short_description = "Mark selected anomalies as resolved"
