"""
DCP-02 | api/serializers.py
Stubs — fully expanded in DCP-05 (models) and DCP-06 (RBAC serializers).
"""
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Embeds the user's role in the JWT payload for RBAC checks (design p.3)."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token