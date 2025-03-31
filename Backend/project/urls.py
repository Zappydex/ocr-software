from django.urls import path, include
from . import views
from .ocr_proxy_views import (
    ProjectOCRView, ProjectOCRStatusView, ProjectOCRCheckTaskView,
    ProjectOCRCancelView, ProjectOCRDownloadView, ProjectOCRValidationView,
    ProjectOCRAnomaliesView, ProjectOCRResultsView, OCRHealthView
)

app_name = 'project'

urlpatterns = [
    # Project endpoints
    path('api/projects/', views.ProjectListCreateView.as_view(), name='project-list'),
    path('api/projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('api/projects/<int:pk>/files/', views.ProjectFilesView.as_view(), name='project-files'),
    path('api/projects/<int:pk>/anomalies/', views.ProjectAnomaliesView.as_view(), name='project-anomalies'),
    path('api/projects/<int:pk>/toggle-active/', views.ProjectToggleActiveView.as_view(), name='project-toggle-active'),
    path('api/projects/<int:pk>/search/', views.ProjectSearchView.as_view(), name='project-search'),
    path('api/projects/<int:pk>/files/<int:file_id>/download/', views.ProjectFileDownloadView.as_view(), name='project-file-download'),
    
    # Anomaly endpoints
    path('api/anomalies/', views.AnomalyListView.as_view(), name='anomaly-list'),
    path('api/anomalies/<int:pk>/', views.AnomalyDetailView.as_view(), name='anomaly-detail'),
    
    # OCR integration endpoints
    path('api/projects/<int:pk>/process-invoices/', ProjectOCRView.as_view(), name='project-ocr-process'),
    path('api/projects/<int:pk>/ocr-status/<str:task_id>/', ProjectOCRStatusView.as_view(), name='project-ocr-status'),
    path('api/projects/<int:pk>/ocr-check-task/<str:task_id>/', ProjectOCRCheckTaskView.as_view(), name='project-ocr-check-task'),
    path('api/projects/<int:pk>/ocr-cancel/<str:task_id>/', ProjectOCRCancelView.as_view(), name='project-ocr-cancel'),
    path('api/projects/<int:pk>/ocr-download/<str:task_id>/', ProjectOCRDownloadView.as_view(), name='project-ocr-download'),
    path('api/projects/<int:pk>/ocr-validation/<str:task_id>/', ProjectOCRValidationView.as_view(), name='project-ocr-validation'),
    path('api/projects/<int:pk>/ocr-anomalies/<str:task_id>/', ProjectOCRAnomaliesView.as_view(), name='project-ocr-anomalies'),
    path('api/projects/<int:pk>/ocr-results/<str:task_id>/', ProjectOCRResultsView.as_view(), name='project-ocr-results'),
    path('api/ocr-health/', OCRHealthView.as_view(), name='ocr-health'),
]
