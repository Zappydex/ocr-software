from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, timedelta

from .models import Project, ProjectHistory, ProcessedFile, Anomaly
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer, 
    ProcessedFileSerializer, AnomalySerializer
)

class ProjectListCreateView(APIView):
    """
    API endpoint for listing and creating projects
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List all projects for the current user"""
        projects = Project.objects.filter(user=request.user)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new project"""
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(user=request.user)
            
            # Create project history entry
            ProjectHistory.objects.create(
                project=project,
                action='create',
                description=f"Project '{project.company_name}' created",
                performed_by=request.user
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailView(APIView):
    """
    API endpoint for retrieving, updating and deleting a project
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        """Get project and verify ownership"""
        return get_object_or_404(Project, pk=pk, user=self.request.user)
    
    def get(self, request, pk):
        """Retrieve a project"""
        project = self.get_object(pk)
        serializer = ProjectDetailSerializer(project)
        return Response(serializer.data)
    
    def put(self, request, pk):
        """Update a project"""
        project = self.get_object(pk)
        serializer = ProjectSerializer(project, data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            
            # Create project history entry
            ProjectHistory.objects.create(
                project=project,
                action='update',
                description=f"Project '{project.company_name}' updated",
                performed_by=request.user
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete a project"""
        project = self.get_object(pk)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFilesView(APIView):
    """
    API endpoint for listing files in a project
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """List all files for a project"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        files = project.files.all().order_by('-processed_date')
        serializer = ProcessedFileSerializer(files, many=True, context={'request': request})
        return Response(serializer.data)


class ProjectAnomaliesView(APIView):
    """
    API endpoint for listing anomalies in a project
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """List all anomalies for a project"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        anomalies = project.anomalies.all().order_by('-detected_at')
        
        # Filter by resolved status if specified
        resolved = request.query_params.get('resolved', None)
        if resolved is not None:
            resolved = resolved.lower() == 'true'
            anomalies = anomalies.filter(resolved=resolved)
        
        serializer = AnomalySerializer(anomalies, many=True, context={'request': request})
        return Response(serializer.data)


class ProjectToggleActiveView(APIView):
    """
    API endpoint for toggling project active status
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Toggle the active status of a project"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        project.is_active = not project.is_active
        project.save()
        
        # Create project history entry
        status_text = "activated" if project.is_active else "deactivated"
        ProjectHistory.objects.create(
            project=project,
            action='update',
            description=f"Project '{project.company_name}' {status_text}",
            performed_by=request.user
        )
        
        serializer = ProjectSerializer(project)
        return Response(serializer.data)


class ProjectSearchView(APIView):
    """
    API endpoint for searching within a project
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Search within a specific project"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        # Get search parameters
        query = request.query_params.get('q', '')
        
        # Get filter parameters
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        vendor = request.query_params.get('vendor', None)
        file_type = request.query_params.get('file_type', None)
        file_size_min = request.query_params.get('file_size_min', None)
        file_size_max = request.query_params.get('file_size_max', None)
        
        # Initialize results
        results = {
            'files': [],
            'anomalies': []
        }
        
        # Search files
        files_query = project.files.all()
        
        # Apply search query if provided
        if query:
            files_query = files_query.filter(
                Q(file_name__icontains=query) |
                Q(invoice_number__icontains=query) |
                Q(vendor_name__icontains=query)
            )
        
        # Apply filters
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d')
                files_query = files_query.filter(processed_date__gte=date_from)
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
                files_query = files_query.filter(processed_date__lte=date_to)
            except ValueError:
                return Response(
                    {'error': 'Invalid date_to format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if vendor:
            files_query = files_query.filter(vendor_name__icontains=vendor)
        
        if file_type:
            files_query = files_query.filter(file_type=file_type)
        
        if file_size_min:
            try:
                files_query = files_query.filter(file_size__gte=int(file_size_min))
            except ValueError:
                return Response(
                    {'error': 'Invalid file_size_min format. Use integer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if file_size_max:
            try:
                files_query = files_query.filter(file_size__lte=int(file_size_max))
            except ValueError:
                return Response(
                    {'error': 'Invalid file_size_max format. Use integer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        results['files'] = ProcessedFileSerializer(files_query, many=True, context={'request': request}).data
        
        # Search anomalies
        anomalies_query = project.anomalies.all()
        
        if query:
            anomalies_query = anomalies_query.filter(
                Q(anomaly_type__icontains=query) |
                Q(description__icontains=query)
            )
        
        # Apply date filters if provided
        if date_from:
            anomalies_query = anomalies_query.filter(detected_at__gte=date_from)
        
        if date_to:
            anomalies_query = anomalies_query.filter(detected_at__lte=date_to)
        
        results['anomalies'] = AnomalySerializer(anomalies_query, many=True, context={'request': request}).data
        
        return Response(results)


class ProjectFileDownloadView(APIView):
    """
    API endpoint for downloading a file from a project
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, file_id):
        """Generate a download URL for a specific file"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        file = get_object_or_404(ProcessedFile, pk=file_id, project=project)
        download_url = file.get_file_url()
        
        # Create project history entry for the download
        ProjectHistory.objects.create(
            project=project,
            action='export' if file.file_type == 'excel' else 'process',
            description=f"File '{file.file_name}' downloaded",
            performed_by=request.user,
            related_file=file
        )
        
        return Response({'download_url': download_url, 'file_name': file.file_name})


class AnomalyListView(APIView):
    """
    API endpoint for listing all anomalies
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List all anomalies for the current user's projects"""
        anomalies = Anomaly.objects.filter(project__user=request.user).order_by('-detected_at')
        serializer = AnomalySerializer(anomalies, many=True, context={'request': request})
        return Response(serializer.data)


class AnomalyDetailView(APIView):
    """
    API endpoint for retrieving and updating an anomaly
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        """Get anomaly and verify access"""
        return get_object_or_404(Anomaly, pk=pk, project__user=self.request.user)
    
    def get(self, request, pk):
        """Retrieve an anomaly"""
        anomaly = self.get_object(pk)
        serializer = AnomalySerializer(anomaly, context={'request': request})
        return Response(serializer.data)
    
    def patch(self, request, pk):
        """Update an anomaly (partial)"""
        anomaly = self.get_object(pk)
        serializer = AnomalySerializer(anomaly, data=request.data, partial=True, context={'request': request})
        
        if serializer.is_valid():
            # If resolving the anomaly
            if 'resolved' in request.data and request.data['resolved']:
                anomaly.resolve(request.user)  # Using the model's resolve method
                
                # Create project history entry
                ProjectHistory.objects.create(
                    project=anomaly.project,
                    action='anomaly',
                    description=f"Anomaly '{anomaly.anomaly_type}' resolved",
                    performed_by=request.user,
                    related_file=anomaly.processed_file
                )
                
                # Re-serialize after resolving
                serializer = AnomalySerializer(anomaly, context={'request': request})
            else:
                serializer.save()
                
            return Response(serializer.data)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
