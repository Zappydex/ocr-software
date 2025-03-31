from django.contrib import admin
from .models import SearchHistory

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'query', 'timestamp', 'results_count']
    list_filter = ['timestamp', 'user']
    search_fields = ['query', 'user__username']
    readonly_fields = ['user', 'query', 'timestamp', 'results_count']
