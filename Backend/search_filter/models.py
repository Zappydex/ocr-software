from django.db import models
from django.conf import settings

class SearchHistory(models.Model):
    """Track user search history for analytics and quick access"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='search_history'
    )
    query = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    results_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Search histories"
    
    def __str__(self):
        return f"{self.user.username}: {self.query} ({self.timestamp})"
