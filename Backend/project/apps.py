from django.apps import AppConfig


class ProjectConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'project'
    verbose_name = 'Project Management'
    
    def ready(self):
        """
        Perform initialization tasks when the app is ready.
        This is a good place to register signal handlers.
        """
        
