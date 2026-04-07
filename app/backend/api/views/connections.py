"""
api/views/connections.py
GET /api/connections/      — list all connections for authed user
POST /api/connections/     — create, runs test_connection() before saving
POST /api/connections/test/ — validate only, no save
GET /api/connections/{id}/  — retrieve single connection
DELETE /api/connections/{id}/ — remove
Design ref: p.5 (health check), p.20 (endpoints)
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.exceptions import ConnectionError as DCPConnectionError
from api.models import Connection
from api.serializers import ConnectionSerializer, ConnectionTestSerializer
from connectors.factory import ConnectorFactory


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def connections_list(request):
    """GET /api/connections/ — POST /api/connections/"""

    if request.method == "GET":
        # Admins see all; users see only their own (design p.12)
        qs = (
            Connection.objects.all()
            if request.user.is_admin
            else Connection.objects.filter(owner=request.user)
        )
        return Response(ConnectionSerializer(qs, many=True).data)

    # POST — create
    serializer = ConnectionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    db_type = serializer.validated_data["db_type"]
    config  = serializer.validated_data["config"]

    # Run heartbeat ping before persisting (design p.5)
    try:
        ConnectorFactory.test(db_type, config)
        conn_status = Connection.STATUS_HEALTHY
    except Exception:
        conn_status = Connection.STATUS_OFFLINE

    connection = serializer.save(
        owner=request.user,
        status=conn_status,
        last_tested=timezone.now(),
    )
    return Response(
        ConnectionSerializer(connection).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def connection_detail(request, pk):
    """GET /api/connections/{id}/ — DELETE /api/connections/{id}/"""
    try:
        connection = Connection.objects.get(pk=pk)
    except Connection.DoesNotExist:
        return Response({"detail": "Connection not found."}, status=status.HTTP_404_NOT_FOUND)

    # Object-level RBAC
    if not (request.user.is_admin or connection.owner == request.user):
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return Response(ConnectionSerializer(connection).data)

    connection.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def test_connection(request):
    """
    POST /api/connections/test/
    Validates credentials via ConnectorFactory — does NOT save.
    Used by the frontend "Test Connection" button before the user clicks Save.
    Returns 200 Healthy or 400 ConnectionError (design p.5, p.20).
    """
    serializer = ConnectionTestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    db_type = serializer.validated_data["db_type"]
    config  = serializer.validated_data["config"]

    try:
        ConnectorFactory.test(db_type, config)
        return Response({"status": "Healthy", "message": "Connection successful."})
    except DCPConnectionError as e:
        return Response(
            {"status": "Offline", "message": str(e.detail)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def retest_connection(request, pk):
    """
    POST /api/connections/{id}/retest/
    Re-runs the heartbeat on an existing connection and updates its status.
    Used by the dashboard health indicator (design p.5 — Heartbeat checks).
    """
    try:
        connection = Connection.objects.get(pk=pk)
    except Connection.DoesNotExist:
        return Response({"detail": "Connection not found."}, status=status.HTTP_404_NOT_FOUND)

    if not (request.user.is_admin or connection.owner == request.user):
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    try:
        ConnectorFactory.test(connection.db_type, connection.config)
        connection.status = Connection.STATUS_HEALTHY
    except DCPConnectionError:
        connection.status = Connection.STATUS_OFFLINE

    connection.last_tested = timezone.now()
    connection.save(update_fields=["status", "last_tested"])

    return Response(ConnectionSerializer(connection).data)