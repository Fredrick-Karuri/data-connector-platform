"""
DCP-02 | core/urls.py
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from api.views.auth import RoleTokenObtainPairView

urlpatterns = [
    # Auth
    path("api/auth/token/", RoleTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # App routes — wired in DCP-09 through DCP-12
    path("api/", include("api.urls")),
]