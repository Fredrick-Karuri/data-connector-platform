"""
api/views/auth.py
JWT auth endpoints: register, login (token), refresh, logout, me.
Design ref: p.3 — JWT via DRF for session management and RBAC.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from api.serializers import (
    RoleTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RoleTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/token/
    Returns access + refresh tokens with role claim embedded (design p.3).
    Response includes a user object so frontend stores role on login
    without a separate /me call.
    """
    serializer_class = RoleTokenObtainPairSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/auth/register/
    Creates a new user. Role defaults to 'user'; only admins can set role='admin'
    to prevent privilege escalation.
    """
    data = request.data.copy()
    if not (request.user and request.user.is_authenticated and request.user.is_admin):
        data["role"] = "user"

    serializer = RegisterSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["username"] = user.username

    return Response(
        {
            "user":    UserSerializer(user).data,
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    POST /api/auth/logout/
    Blacklists the refresh token.
    Access token expiry handled by the client (60min TTL).
    """
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
    except Exception:
        return Response(
            {"detail": "Invalid or already expired token."},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    GET /api/auth/me/
    Returns current user's profile and role.
    Used by the frontend to rehydrate auth state after page refresh.
    """
    return Response(UserSerializer(request.user).data)