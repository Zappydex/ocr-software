from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from project.models import Project, ProcessedFile, Anomaly, ProjectHistory

from project.serializers import ProjectSerializer, ProcessedFileSerializer, AnomalySerializer
from .models import SearchHistory
from .serializers import SearchHistorySerializer

class SearchView(APIView):
    """
    Unified search endpoint for projects, files, and anomalies
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Search across projects, files, and anomalies
        """
        # Get search parameters
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'all')  # all, projects, files, anomalies
        
        # Get filter parameters
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        vendor = request.query_params.get('vendor', None)
        file_type = request.query_params.get('file_type', None)
        file_size_min = request.query_params.get('file_size_min', None)
        file_size_max = request.query_params.get('file_size_max', None)
        
        # Convert date strings to datetime objects if provided
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {'error': 'Invalid date_from format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d')
                # Add one day to include the end date
                date_to = date_to + timedelta(days=1)
            except ValueError:
                return Response(
                    {'error': 'Invalid date_to format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Initialize results
        results = {
            'projects': [],
            'files': [],
            'anomalies': []
        }
        
        # Search projects
        if search_type in ['all', 'projects'] and query:
            projects = Project.objects.filter(
                user=request.user,
                Q(company_name__icontains=query) |
                Q(id__icontains=query) |
                Q(business_reg_no__icontains=query) |
                Q(vat_reg_no__icontains=query) |
                Q(tax_id__icontains=query)
            )
            
            # Apply date filters if provided
            if date_from:
                projects = projects.filter(created_at__gte=date_from)
            if date_to:
                projects = projects.filter(created_at__lte=date_to)
                
            results['projects'] = ProjectSerializer(projects, many=True).data
        
        # Search files
        if search_type in ['all', 'files']:
            files_query = ProcessedFile.objects.filter(project__user=request.user)
            
            # Apply search query if provided
            if query:
                files_query = files_query.filter(
                    Q(file_name__icontains=query) |
                    Q(id__icontains=query) |
                    Q(invoice_number__icontains=query) |
                    Q(vendor_name__icontains=query)
                )
            
            # Apply filters
            if date_from:
                files_query = files_query.filter(processed_date__gte=date_from)
            if date_to:
                files_query = files_query.filter(processed_date__lte=date_to)
            if vendor:
                files_query = files_query.filter(vendor_name__icontains=vendor)
            if file_type:
                files_query = files_query.filter(file_type=file_type)
            if file_size_min:
                files_query = files_query.filter(file_size__gte=int(file_size_min))
            if file_size_max:
                files_query = files_query.filter(file_size__lte=int(file_size_max))
                
            results['files'] = ProcessedFileSerializer(files_query, many=True, context={'request': request}).data
        
        # Search anomalies
        if search_type in ['all', 'anomalies'] and query:
            anomalies = Anomaly.objects.filter(
                project__user=request.user,
                Q(anomaly_type__icontains=query) |
                Q(description__icontains=query)
            )
            
            # Apply date filters if provided
            if date_from:
                anomalies = anomalies.filter(detected_at__gte=date_from)
            if date_to:
                anomalies = anomalies.filter(detected_at__lte=date_to)
                
            results['anomalies'] = AnomalySerializer(anomalies, many=True, context={'request': request}).data
        
        # Save search history if it's a text search
        if query:
            total_results = len(results['projects']) + len(results['files']) + len(results['anomalies'])
            SearchHistory.objects.create(
                user=request.user,
                query=query,
                results_count=total_results
            )
        
        return Response(results)


class FilterOptionsView(APIView):
    """
    Provides available filter options based on user's data
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get available filter options for the current user
        """
        # Get all file types used by this user
        file_types = ProcessedFile.objects.filter(
            project__user=request.user
        ).values_list('file_type', flat=True).distinct()
        
        # Get all vendors for this user
        vendors = ProcessedFile.objects.filter(
            project__user=request.user
        ).values_list('vendor_name', flat=True).distinct()
        
        # Get all projects for this user
        projects = Project.objects.filter(
            user=request.user
        ).values('id', 'company_name')
        
        # Get date range for this user's data
        earliest_date = ProcessedFile.objects.filter(
            project__user=request.user
        ).order_by('processed_date').values_list('processed_date', flat=True).first()
        
        latest_date = ProcessedFile.objects.filter(
            project__user=request.user
        ).order_by('-processed_date').values_list('processed_date', flat=True).first()
        
        # Get file size range
        min_size = ProcessedFile.objects.filter(
            project__user=request.user
        ).order_by('file_size').values_list('file_size', flat=True).first() or 0
        
        max_size = ProcessedFile.objects.filter(
            project__user=request.user
        ).order_by('-file_size').values_list('file_size', flat=True).first() or 0
        
        return Response({
            'file_types': list(file_types),
            'vendors': list(vendors),
            'projects': list(projects),
            'date_range': {
                'earliest': earliest_date,
                'latest': latest_date
            },
            'file_size_range': {
                'min': min_size,
                'max': max_size
            }
        })


class RetrieveFilesView(APIView):
    """
    Endpoint for retrieving saved files and invoices
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retrieve files based on criteria
        """
        # Get filter parameters
        project_id = request.query_params.get('project_id', None)
        file_type = request.query_params.get('file_type', None)
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        
        # Start with all files for this user
        files = ProcessedFile.objects.filter(project__user=request.user)
        
        # Apply filters
        if project_id:
            files = files.filter(project_id=project_id)
        
        if file_type:
            files = files.filter(file_type=file_type)
            
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d')
                files = files.filter(processed_date__gte=date_from)
            except ValueError:
                return Response(
                    {'error': 'Invalid date_from format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d')
                # Add one day to include the end date
                date_to = date_to + timedelta(days=1)
                files = files.filter(processed_date__lte=date_to)
            except ValueError:
                return Response(
                    {'error': 'Invalid date_to format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Order by most recent first
        files = files.order_by('-processed_date')
        
        serializer = ProcessedFileSerializer(files, many=True, context={'request': request})
        return Response(serializer.data)

class FileDownloadView(APIView):
    """
    API endpoint for downloading a file found through global search
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, file_id):
        """Generate a download URL for a specific file"""
        # Get the file and verify user has access to it
        file = get_object_or_404(
            ProcessedFile, 
            pk=file_id, 
            project__user=request.user
        )
        
        download_url = file.get_file_url()
        
        # Create project history entry for the download
        ProjectHistory.objects.create(
            project=file.project,
            action='export' if file.file_type == 'excel' else 'process',
            description=f"File '{file.file_name}' downloaded via global search",
            performed_by=request.user,
            related_file=file
        )
        
        # Track search history
        SearchHistory.objects.create(
            user=request.user,
            query=f"download:{file.file_name}",
            results_count=1
        )
        
        return Response({
            'download_url': download_url, 
            'file_name': file.file_name,
            'project_name': file.project.company_name,
            'project_id': file.project.id
        })

class SearchHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View and manage search history
    """
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear all search history for the current user"""
        SearchHistory.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
