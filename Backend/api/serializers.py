from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from accounts.tokens import account_activation_token
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'organization', 'role')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    organization = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, default='user')

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'organization', 'role')

    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                organization=validated_data.get('organization', ''),
                role=validated_data.get('role', 'user'),
                is_active=False  # Set user as inactive until email is verified
            )
            self.send_activation_email(user)
            logger.info(f"User created successfully: {user.email}")
            return user
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise

    def send_activation_email(self, user):
        try:
            subject = 'Activate your OCR Engine account'
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = account_activation_token.make_token(user)
            
            # Use settings from Django settings.py without hardcoded fallbacks
            base_url = settings.FRONTEND_URL
            activation_link = f"{base_url}/activate/{uidb64}/{token}/{user.id}/"
            
            message = f'Please use the following link to activate your account: {activation_link}'
            from_email = settings.DEFAULT_FROM_EMAIL
            
            send_mail(subject, message, from_email, [user.email])
            logger.info(f"Activation email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send activation email: {str(e)}")
            # Don't raise the exception to prevent registration failure
            # but log it for monitoring
