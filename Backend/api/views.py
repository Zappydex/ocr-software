from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth import get_user_model
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from .serializers import UserSerializer, RegisterSerializer
from accounts.tokens import account_activation_token
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

@api_view(['GET', 'POST'])
def activate_account(request, uidb64, token, user_id):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=user_id)
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
    except User.DoesNotExist:
        logger.error(f"No user found with ID: {user_id}")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in account activation: {str(e)}")
        return Response({'error': 'An error occurred during activation'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
