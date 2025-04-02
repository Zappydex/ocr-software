import logging
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.backends import ModelBackend
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, OTP
from django.db import transaction
from .forms import CustomUserCreationForm, LoginForm, PasswordResetRequestForm, SetPasswordForm, CustomUserChangeForm
from .tokens import account_activation_token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework.authtoken.models import Token
from django.db import IntegrityError
from .serializers import PasswordResetSerializer, SetNewPasswordSerializer, OTPVerificationSerializer
from .serializers import SetNewPasswordSerializer
from rest_framework import generics, status
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from django.conf import settings
from twilio.rest import Client
from django.utils import timezone
from .forms import OTPVerificationForm



logger = logging.getLogger(__name__)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        form = CustomUserCreationForm(request.data)
        if form.is_valid():
            try:
                with transaction.atomic():
                    user = form.save(commit=False)
                    user.is_active = False
                    user.save()
                    logger.info(f"User created and saved to database. ID: {user.id}, Email: {user.email}")

                    # Generate activation link with user ID
                    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                    token = account_activation_token.make_token(user)
                    activation_link = f"{settings.FRONTEND_URL}/api/accounts/activate/{uidb64}/{token}/{user.id}/"

                    # Send activation email
                    subject = 'Activate your ocrengine account'
                    message = f'Please use the following link to activate your account: {activation_link}'
                    send_mail(subject, message, 'noreply@ocrengine.com', [user.email])
                    logger.info(f"Activation email sent to {user.email}. Activation link: {activation_link}")

                return Response({
                    'message': 'Please check your email to activate your account',
                    'user_id': user.id,
                    'email': user.email
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error during user registration: {str(e)}")
                return Response({'error': 'An error occurred during registration'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.warning(f"Invalid registration form: {form.errors}")
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

        
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        form = LoginForm(request.data)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            logger.info(f"Login attempt for email: {email}")
            user = authenticate(request, email=email, password=password)

            if user is not None:
                if user.is_active:
                    otp = OTP.generate_otp()
                    OTP.objects.create(user=user, otp=otp)

                    # Send OTP via email
                    try:
                        send_mail(
                            'Your OTP for login',
                            f'Your OTP is: {otp}',
                            'noreply@ocrengine.com',
                            [user.email],
                            fail_silently=False,
                        )
                        logger.info(f"OTP sent to email: {user.email}")
                    except Exception as e:
                        logger.error(f"Failed to send OTP email: {e}")
                        return Response({'error': 'Failed to send OTP email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                    # Send OTP via SMS
                    if user.phone_number:
                        try:
                            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                            client.messages.create(
                                body=f'Your ocrengine OTP is: {otp}',
                                from_=settings.TWILIO_PHONE_NUMBER,
                                to=user.phone_number
                            )
                            logger.info(f"OTP sent to phone number: {user.phone_number}")
                        except Exception as e:
                            logger.error(f"Failed to send OTP SMS: {e}")

                    return Response({
                        'message': 'OTP sent to email and phone (if available)',
         
                    }, status=status.HTTP_200_OK)
                else:
                    logger.warning(f"Inactive account login attempt: {email}")
                    return Response({'error': 'Account is not active'}, status=status.HTTP_403_FORBIDDEN)
            else:
                logger.warning(f"Failed login attempt for email: {email}")
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        logger.error(f"Invalid form data: {form.errors}")
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
                    
class OTPVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        form = OTPVerificationForm(request.data)
        if form.is_valid():
            otp = form.cleaned_data['otp']
            otp_obj = OTP.objects.filter(otp=otp).first()

            logger.info(f"Received OTP: {otp}")

            if not otp_obj:
                logger.warning("Invalid OTP")
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.created_at < timezone.now() - timezone.timedelta(minutes=10):
                logger.warning("Expired OTP")
                return Response({'error': 'Expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

            user = otp_obj.user
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            token, _ = Token.objects.get_or_create(user=user)
            otp_obj.delete()  # OTP is consumed, delete it

            return Response({
                'success': True,
                'message': 'Login successful',
                'token': token.key,
                'user_id': user.id,
                'email': user.email
            })
        
        logger.error(f"Form errors: {form.errors}")
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = CustomUser.objects.get(email=email)
            otp = OTP.generate_otp()
            OTP.objects.create(user=user, otp=otp)
            
            # Send OTP via email
            send_mail(
                'Your new OTP for login',
                f'Your new OTP is: {otp}',
                'noreply@ocrengine.com',
                [user.email],
                fail_silently=False,
            )
            
            # Send OTP via SMS
            if user.phone_number:
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                client.messages.create(
                    body=f'Your new ocrengine OTP is: {otp}',
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=user.phone_number
                )
            
            return Response({'message': 'New OTP sent successfully'}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in resending OTP: {str(e)}")
            return Response({'error': 'An error occurred while resending OTP'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})

User = get_user_model()

class GoogleAuthStatusView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated and user.google_id:
            return Response({'is_authenticated': True})
        return Response({'is_authenticated': False})

class GoogleLoginView(APIView):
    def post(self, request):
        token = request.data.get('token')
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_OAUTH2_CLIENT_ID)
            email = idinfo['email']
            name = idinfo.get('name', '')
            google_id = idinfo['sub']
            
            try:
                user = User.objects.get(email=email)
                
                if not user.google_id:
                    user.google_id = google_id
                    user.save()
                    logger.info(f"Updated existing user {email} with Google ID")
                
            except User.DoesNotExist:
                user = User.objects.create(
                    email=email,
                    username=name or email,
                    google_id=google_id
                )
                logger.info(f"Created new user {email} via Google Sign-In")

            refresh = RefreshToken.for_user(user)
            
            response = Response({
                'message': 'Successfully logged in',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'is_google_authenticated': bool(user.google_id)
                },
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
            })
            
            response.set_cookie(
                'refresh_token',
                str(refresh),
                httponly=True,
                samesite='None',
                secure=True,
                max_age=3600*24*14  # 14 days
            )
            response.set_cookie(
                'access_token',
                str(refresh.access_token),
                httponly=True,
                samesite='None',
                secure=True,
                max_age=3600  # 1 hour
            )
            
            return response
        except ValueError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'message': 'Please send a POST request with your email to reset password'})

    def post(self, request):
        form = PasswordResetRequestForm(request.data)
        if form.is_valid():
            email = form.cleaned_data['email']
            user = CustomUser.objects.filter(email=email).first()
            if user:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                reset_link = f"{request.build_absolute_uri('/api/accounts/password-reset/')}{uid}/{token}/"
                
                subject = 'Reset your ocrengine password'
                message = f'Please use the following link to reset your password: {reset_link}'
                send_mail(subject, message, 'noreply@ocrengine.com', [email])
            
            return Response({'message': 'If an account with this email exists, a password reset link has been sent.'})
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            return Response({'message': 'Token is valid, please send a POST request with your new password'})
        return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            form = SetPasswordForm(request.data)
            if form.is_valid():
                user.set_password(form.cleaned_data['new_password1'])
                user.save()
                return Response({'message': 'Password has been reset successfully'})
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'email': user.email,
            'username': user.username,
            'phone_number': user.phone_number,
            'organization': user.organization,
            'role': user.role,
        })

    def put(self, request):
        user = request.user
        form = CustomUserChangeForm(request.data, request.FILES, instance=user)
        if form.is_valid():
            form.save()
            return Response({'message': 'Profile updated successfully'})
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save()
        logout(request)
        return Response({'message': 'User account deactivated successfully'})

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def activate_account(request, uidb64, token, user_id):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = CustomUser.objects.get(pk=user_id)
        logger.info(f"Activation attempt for User ID: {user_id}, Decoded UID: {uid}")

        if int(uid) != int(user_id):
            logger.warning(f"UID mismatch. Decoded UID: {uid}, User ID: {user_id}")
            return Response({'error': 'Invalid activation link'}, status=status.HTTP_400_BAD_REQUEST)

        if account_activation_token.check_token(user, token):
            if request.method == 'GET':
                return Response({
                    'message': 'Token is valid. Please confirm activation.',
                    'uidb64': uidb64,
                    'token': token,
                    'user_id': user_id
                })
            elif request.method == 'POST':
                if not user.is_active:
                    user.is_active = True
                    user.save()
                    logger.info(f"Account activated for user: {user.email}")
                    return Response({'message': 'Account successfully activated'}, status=status.HTTP_200_OK)
                else:
                    logger.warning(f"Account already active for user: {user.email}")
                    return Response({'message': 'Account is already active'}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Invalid token for user: {user.email}")
            return Response({'error': 'Invalid activation token'}, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        logger.error(f"No user found with ID: {user_id}")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in account activation: {str(e)}")
        return Response({'error': 'An error occurred during activation'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    

@api_view(['POST'])
def resend_activation_email(request):
    email = request.data.get('email')
    try:
        user = CustomUser.objects.get(email=email)
        if not user.is_active:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = account_activation_token.make_token(user)
            activation_link = f"{settings.FRONTEND_URL}/api/accounts/activate/{uidb64}/{token}/{user.id}/"

            subject = 'Activate your ocrengine  account'
            message = f'Please use the following link to activate your account: {activation_link}'
            send_mail(subject, message, 'noreply@ocrengine.com', [user.email])
            
            return Response({'message': 'Activation email resent successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Account is already active'}, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'No account found with this email'}, status=status.HTTP_400_BAD_REQUEST)




User = get_user_model()

class RequestPasswordResetEmail(generics.GenericAPIView):
    serializer_class = PasswordResetSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        email = request.data.get('email', '')

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(force_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/api/accounts/password-reset/{uidb64}/{token}"
            
            email_body = f'Hello,\nUse the link below to reset your password:\n{reset_url}'
            send_mail(
                'Reset your ocrengine password',
                email_body,
                'noreply@ocrengine.com',
                [user.email],
                fail_silently=False,
            )
        return Response({'success': 'We have sent you a link to reset your password'}, status=status.HTTP_200_OK)

class PasswordTokenCheckAPI(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer  
    
    def get(self, request, uidb64, token):
        try:
            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'error': 'Token is not valid, please request a new one'}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'success': True, 'message': 'Credentials Valid', 'uidb64': uidb64, 'token': token}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': 'Token is not valid, please request a new one'}, status=status.HTTP_400_BAD_REQUEST)


class SetNewPasswordAPIView(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer

    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'success': True, 'message': 'Password reset success'}, status=status.HTTP_200_OK)