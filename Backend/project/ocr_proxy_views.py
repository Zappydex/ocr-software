import os
import uuid
import tempfile
import asyncio
import io
import threading
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Project, ProcessedFile, Anomaly, ProjectHistory

# Import OCR Engine components directly
from app.utils.ocr_engine import ocr_engine
from app.utils.file_handler import FileHandler
from app.utils.validator import invoice_validator, flag_anomalies
from app.utils.exporter import export_invoices
from app.utils.data_extractor import DataExtractor
from app.models import ProcessingStatus, ProcessingRequest, Invoice

# Access the global dictionaries from the OCR Engine
from app.main import processing_tasks, direct_results

# Initialize file handler
file_handler = FileHandler()

class ProjectOCRView(APIView):
    """
    API endpoint for processing invoices within a project
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Process invoices for a specific project"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        # Check if files were uploaded
        if 'files' not in request.FILES:
            return Response(
                {'error': 'No files uploaded'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate a task ID
        task_id = str(uuid.uuid4())
        
        # Create a temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        file_paths = []
        
        try:
            # Save uploaded files to temp directory
            for file_obj in request.FILES.getlist('files'):
                file_path = os.path.join(temp_dir, file_obj.name)
                with open(file_path, 'wb') as f:
                    for chunk in file_obj.chunks():
                        f.write(chunk)
                file_paths.append(file_path)
            
            # Initialize task status with project_id
            status_info = ProcessingStatus(status="Queued", progress=0, message="Task queued")
            status_info.project_id = pk
            processing_tasks[task_id] = status_info
            
            # Start processing in background using threading
            if len(file_paths) == 1:
                threading.Thread(
                    target=self._run_async_task,
                    args=(self.process_file_directly, task_id, file_paths[0], temp_dir, pk)
                ).start()
            else:
                threading.Thread(
                    target=self._run_async_task,
                    args=(self.process_multiple_files_directly, task_id, file_paths, temp_dir, pk)
                ).start()
            
            # Create a processing record in the project
            ProjectHistory.objects.create(
                project=project,
                action='process',
                description=f"Started invoice processing task {task_id}",
                performed_by=request.user
            )
            
            return Response({
                'task_id': task_id,
                'message': 'Processing started'
            })
                
        except Exception as e:
            return Response(
                {'error': f"Failed to process files: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _run_async_task(self, async_func, *args):
        """Run an async function in a new event loop"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(async_func(*args))
        finally:
            loop.close()
    
    async def process_file_directly(self, task_id, file_path, temp_dir, project_id):
        """Process a single file directly using OCR Engine functions"""
        from app.main import process_file_directly
        try:
            await process_file_directly(task_id, file_path, temp_dir, project_id)
        except Exception as e:
            processing_tasks[task_id] = ProcessingStatus(
                status="Failed", 
                progress=100, 
                message=f"Error: {str(e)}",
                project_id=project_id
            )
    
    async def process_multiple_files_directly(self, task_id, file_paths, temp_dir, project_id):
        """Process multiple files directly using OCR Engine functions"""
        from app.main import process_multiple_files_directly
        try:
            await process_multiple_files_directly(task_id, file_paths, temp_dir, project_id)
        except Exception as e:
            processing_tasks[task_id] = ProcessingStatus(
                status="Failed", 
                progress=100, 
                message=f"Error: {str(e)}",
                project_id=project_id
            )

class ProjectOCRStatusView(APIView):
    """
    API endpoint for checking OCR processing status
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        """Check status of an OCR processing task"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        if task_id not in processing_tasks:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        status_info = processing_tasks[task_id]
        
        # Verify this task belongs to this project
        if hasattr(status_info, 'project_id') and status_info.project_id != pk:
            return Response(
                {'error': 'This task does not belong to this project'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'task_id': task_id,
            'status': status_info
        })

class ProjectOCRCheckTaskView(APIView):
    """
    API endpoint for checking detailed OCR task status
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        """Check detailed status of an OCR processing task"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        if task_id not in processing_tasks:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        status_info = processing_tasks[task_id]
        
        return Response({
            'task_id': task_id,
            'status': status_info.status,
            'progress': status_info.progress,
            'message': status_info.message
        })

class ProjectOCRCancelView(APIView):
    """
    API endpoint for cancelling OCR processing
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk, task_id):
        """Cancel an OCR processing task"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        if task_id not in processing_tasks:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        status_info = processing_tasks[task_id]
        
        if status_info.status in ['Queued', 'Processing']:
            # Update status to cancelled
            status_info = ProcessingStatus(
                status="Cancelled", 
                progress=0, 
                message="Task cancelled by user"
            )
            if hasattr(status_info, 'project_id'):
                status_info.project_id = pk
            processing_tasks[task_id] = status_info
            
            # Create a cancellation record in the project history
            ProjectHistory.objects.create(
                project=project,
                action='cancel',
                description=f"Cancelled invoice processing task {task_id}",
                performed_by=request.user
            )
            
            return Response({"status": "Task cancelled successfully"})
        elif status_info.status in ['Completed', 'Failed']:
            return Response({"status": "Task already completed or failed, cannot cancel"})
        else:
            return Response({"status": "Unable to cancel task, unknown state"})

class ProjectOCRDownloadView(APIView):
    """
    API endpoint for downloading OCR results
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        """Download OCR results"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        # Get format parameter (default to excel)
        format_type = request.query_params.get('format', 'excel')
        
        if task_id not in direct_results:
            return Response(
                {'error': 'Results not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        result = direct_results[task_id]
        
        try:
            if format_type.lower() == "csv":
                file_path = result.get('csv_path')
                content_type = 'text/csv'
            elif format_type.lower() == "excel":
                file_path = result.get('excel_path')
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            else:
                return Response(
                    {'error': 'Invalid format specified'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not file_path or not os.path.exists(file_path):
                return Response(
                    {'error': 'Result file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Read the file content
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Create a file record in the project
            file_name = f"invoices_{task_id}.{format_type}"
            processed_file = ProcessedFile.objects.create(
                project=project,
                file_name=file_name,
                file_type=format_type,
                file_size=len(file_content),
                processed_date=timezone.now()
            )
            
            # Save the file content
            processed_file.save_file_content(file_content)
            
            # Create project history entry
            ProjectHistory.objects.create(
                project=project,
                action='export',
                description=f"Downloaded {format_type} results for task {task_id}",
                performed_by=request.user,
                related_file=processed_file
            )
            
            return Response({
                'download_url': processed_file.get_file_url(),
                'file_name': file_name,
                'file_id': processed_file.id
            })
                
        except Exception as e:
            return Response(
                {'error': f"Failed to download results: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProjectOCRValidationView(APIView):
    """
    API endpoint for retrieving validation results
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        """Get validation results for a task"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        if task_id not in direct_results:
            return Response(
                {'error': 'Results not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        result = direct_results[task_id]
        validation_results = result.get('validation_results', {})
        
        return Response(validation_results)

class ProjectOCRAnomaliesView(APIView):
    """
    API endpoint for retrieving anomalies
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        """Get anomalies for a task"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        if task_id not in direct_results:
            return Response(
                {'error': 'Results not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        result = direct_results[task_id]
        anomalies = result.get('anomalies', [])
        
        return Response(anomalies)

class ProjectOCRResultsView(APIView):
    """
    API endpoint for retrieving OCR results and saving to project
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        """Get results and save to project"""
        project = get_object_or_404(Project, pk=pk, user=request.user)
        
        # Check status first
        if task_id not in processing_tasks:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        status_info = processing_tasks[task_id]
        
        if status_info.status != 'Completed':
            return Response({
                'message': 'Processing not completed',
                'status': status_info
            })
        
        # Check if results are available
        if task_id not in direct_results:
            return Response(
                {'error': 'Results not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        result = direct_results[task_id]
        
        try:
            # Get anomalies
            anomalies = result.get('anomalies', [])
            
            # Get the Excel file path
            excel_path = result.get('excel_path')
            
            if not excel_path or not os.path.exists(excel_path):
                return Response(
                    {'error': 'Result file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Read the file content
            with open(excel_path, 'rb') as f:
                file_content = f.read()
            
            # Save the file to the project
            file_name = f"invoices_{task_id}.xlsx"
            processed_file = ProcessedFile.objects.create(
                project=project,
                file_name=file_name,
                file_type="excel",
                file_size=len(file_content),
                processed_date=timezone.now(),
                invoice_count=len(anomalies)
            )
            
            # Save the file content
            processed_file.save_file_content(file_content)
            
            # Create anomaly records
            for anomaly in anomalies:
                if anomaly.get('flags'):
                    Anomaly.objects.create(
                        project=project,
                        processed_file=processed_file,
                        anomaly_type="Invoice Anomaly",
                        description=f"Anomalies detected in invoice {anomaly.get('invoice_number')}",
                        detected_at=timezone.now()
                    )
            
            # Update project history
            ProjectHistory.objects.create(
                project=project,
                action='export',
                description=f"Completed invoice processing task {task_id}",
                performed_by=request.user,
                related_file=processed_file
            )
            
            return Response({
                'message': 'Processing completed and results saved',
                'file_id': processed_file.id,
                'anomalies_count': Anomaly.objects.filter(processed_file=processed_file).count()
            })
                
        except Exception as e:
            return Response(
                {'error': f"Failed to save results: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class OCRHealthView(APIView):
    """
    API endpoint for checking OCR Engine health
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check OCR Engine health"""
        try:
            # Check if OCR Engine is initialized
            if ocr_engine:
                return Response({
                    'status': 'healthy',
                    'message': 'OCR Engine is running'
                })
            else:
                return Response({
                    'status': 'unhealthy',
                    'message': 'OCR Engine is not initialized'
                })
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'error': f"OCR Engine error: {str(e)}"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
