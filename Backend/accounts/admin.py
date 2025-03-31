from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from .models import CustomUser, UserPreference
from .models import OTP
from .forms import CustomUserCreationForm, CustomUserChangeForm
from django.http import HttpResponseRedirect

class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ('email', 'username', 'organization', 'role', 'is_staff', 'is_active', 'activate_button')
    list_filter = ('is_staff', 'is_active', 'role', 'organization')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('phone_number', 'organization', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'organization', 'role', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email', 'username', 'organization')
    ordering = ('email',)

    def activate_button(self, obj):
        if obj.is_active:
            return "Already Active"
        else:
            return format_html(
                '<a class="button" href="{}">Activate</a>',
                reverse('admin:activate_user', args=[obj.pk])
            )
    activate_button.short_description = 'Activate'

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:user_id>/activate/', self.admin_site.admin_view(self.activate_user), name='activate_user'),
        ]
        return custom_urls + urls

    def activate_user(self, request, user_id):
        user = CustomUser.objects.get(pk=user_id)
        user.is_active = True
        user.save()
        self.message_user(request, f"User {user.email} has been activated successfully.")
        return HttpResponseRedirect("../")

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(OTP)
admin.site.register(UserPreference)
