from django.urls import path
from . import views

urlpatterns = [

    path('google/', views.google_auth_view, name='google-auth'),

]
