"""
URL configuration for OCREngine project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from accounts import views
from django.http import HttpResponse, JsonResponse
from django.views.generic import RedirectView
from rest_framework.authtoken import views as token_views
from django.views.static import serve

def health_check(request):
    return HttpResponse("OK")

def django_health_check(request):
    """
    Enhanced health check endpoint that returns a JSON response.
    This helps monitoring systems verify the Django application is running.
    """
    return JsonResponse({
        "status": "ok",
        "message": "Django application is running"
    })
    
def api_root(request):
    """
    Root endpoint that provides basic API information
    """
    return JsonResponse({
        "name": "OCR Engine API",
        "version": "1.0",
        "description": "API for OCR document processing and management",
        "endpoints": {
            "accounts": "/api/accounts/",
            "search_filter": "/api/search/",  
            "projects": "/api/projects/",
            "documents": "/api/documents/"
        },
        "status": "online"
    })


urlpatterns = [
    path('', api_root, name='api_root'),  
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('api.urls')),
    path('activate/<str:uidb64>/<str:token>/<int:user_id>/', views.activate_account, name='activate_account'),
    path('health/', health_check, name='health_check'),
    path('django-health/', django_health_check, name='django_health_check'),
    path('api/search/', include('search_filter.urls')),
    path('api/projects/', include('project.urls')),
]

# Static and media files
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, add static files handling
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
