from django.shortcuts import render

def google_auth_view(request):
    return render(request, 'pages/google_auth.html')
