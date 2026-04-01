"""
DCP-02 | api/views/auth.py
JWT token view with role claim injection — fully wired in DCP-07.
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from api.serializers import RoleTokenObtainPairSerializer


class RoleTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleTokenObtainPairSerializer