"""
DCP-02 | core/urls.py
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from api.views.auth import RoleTokenObtainPairView, register, logout, me

urlpatterns = [
    # ── Auth ──────────────────────────────────────────
    path("api/auth/token/",         RoleTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(),        name="token_refresh"),
    path("api/auth/register/",      register,                          name="register"),
    path("api/auth/logout/",        logout,                            name="logout"),
    path("api/auth/me/",            me,                                name="me"),
    # ── App routes — wired in DCP-09 through DCP-12 ───
    path("api/", include("api.urls")),
]