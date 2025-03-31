from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'history', views.SearchHistoryViewSet, basename='search-history')

app_name = 'search_filter'

urlpatterns = [
    path('api/search/', views.SearchView.as_view(), name='search'),
    path('api/filter-options/', views.FilterOptionsView.as_view(), name='filter-options'),
    path('api/retrieve-files/', views.RetrieveFilesView.as_view(), name='retrieve-files'),
    path('api/files/<int:file_id>/download/', views.FileDownloadView.as_view(), name='file-download'),
    path('api/search/', include(router.urls)),
]
