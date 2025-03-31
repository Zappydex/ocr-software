
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
from django.http import HttpResponse
from rest_framework.authtoken import views as token_views
from django.views.generic import TemplateView

def health_check(request):
    return HttpResponse("OK")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('api.urls')),
    path('activate/<str:uidb64>/<str:token>/<int:user_id>/', views.activate_account, name='activate_account'),
    path('api/notifications/', include('Notifications.urls')),
    path('health/', health_check, name='health_check'),
    
    # Include other app URLs that should be handled before the catch-all
    path('', include('search_filter.urls')),
    path('', include('project.urls')),
    
    # Serve React app for all other routes
    re_path(r'^(?!api/|admin/|activate/|health/).*$', TemplateView.as_view(template_name='index.html')),
]

# Static and media files
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, add static files handling
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
        re_path(r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    ]
