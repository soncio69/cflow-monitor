import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.models import Base, MonitoredServer, MonitoringHistory
from app.db.database import get_db
from app.main import app

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database"""
    return TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""

    def test_root_endpoint(self, client):
        """Test root endpoint returns correct message"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "C-Flow Monitoring API"

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuthEndpoints:
    """Test authentication endpoints"""

    def test_login_success_admin(self, client):
        """Test login with valid admin credentials"""
        response = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Login successful"

    def test_login_success_monitor(self, client):
        """Test login with valid monitor credentials"""
        response = client.post("/api/auth/login", json={
            "username": "monitor",
            "password": "monitor"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_login_failure_wrong_password(self, client):
        """Test login with wrong password"""
        response = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"

    def test_login_failure_invalid_user(self, client):
        """Test login with invalid username"""
        response = client.post("/api/auth/login", json={
            "username": "invaliduser",
            "password": "anypassword"
        })
        assert response.status_code == 401


class TestServersEndpoints:
    """Test server CRUD endpoints"""

    def test_create_server(self, client):
        """Test creating a new server"""
        response = client.post("/api/servers", json={
            "name": "TestServer1",
            "url": "http://192.168.1.100:8080/health",
            "username": "admin",
            "password": "password123",
            "enabled": True,
            "warning_threshold": 1000,
            "critical_threshold": 3000
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "TestServer1"
        assert data["url"] == "http://192.168.1.100:8080/health"
        assert data["enabled"] is True
        assert "id" in data

    def test_get_servers_empty(self, client):
        """Test getting servers list when empty"""
        response = client.get("/api/servers")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_servers_with_data(self, client):
        """Test getting servers list with data"""
        # Create a server first
        client.post("/api/servers", json={
            "name": "TestServer",
            "url": "http://test.com"
        })

        response = client.get("/api/servers")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "TestServer"

    def test_get_server_by_id(self, client):
        """Test getting a specific server by ID"""
        # Create a server first
        create_response = client.post("/api/servers", json={
            "name": "TestServer",
            "url": "http://test.com"
        })
        server_id = create_response.json()["id"]

        response = client.get(f"/api/servers/{server_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "TestServer"

    def test_get_server_not_found(self, client):
        """Test getting a non-existent server"""
        response = client.get("/api/servers/999")
        assert response.status_code == 404

    def test_update_server(self, client):
        """Test updating a server"""
        # Create a server first
        create_response = client.post("/api/servers", json={
            "name": "TestServer",
            "url": "http://test.com",
            "enabled": True
        })
        server_id = create_response.json()["id"]

        # Update the server
        response = client.put(f"/api/servers/{server_id}", json={
            "name": "UpdatedServer",
            "enabled": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "UpdatedServer"
        assert data["enabled"] is False

    def test_delete_server(self, client):
        """Test deleting a server"""
        # Create a server first
        create_response = client.post("/api/servers", json={
            "name": "TestServer",
            "url": "http://test.com"
        })
        server_id = create_response.json()["id"]

        # Delete the server
        response = client.delete(f"/api/servers/{server_id}")
        assert response.status_code == 204

        # Verify it's gone
        get_response = client.get(f"/api/servers/{server_id}")
        assert get_response.status_code == 404

    def test_delete_server_not_found(self, client):
        """Test deleting a non-existent server"""
        response = client.delete("/api/servers/999")
        assert response.status_code == 404


class TestMonitoringEndpoints:
    """Test monitoring endpoints"""

    def test_get_status_empty(self, client):
        """Test getting status when no servers"""
        response = client.get("/api/monitoring/status")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_status_with_server(self, client):
        """Test getting status with a server"""
        # Create a server first
        client.post("/api/servers", json={
            "name": "TestServer",
            "url": "http://test.com",
            "enabled": True
        })

        response = client.get("/api/monitoring/status")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_history_empty(self, client):
        """Test getting history when empty"""
        # Create a server first
        create_response = client.post("/api/servers", json={
            "name": "TestServer",
            "url": "http://test.com"
        })
        server_id = create_response.json()["id"]

        response = client.get(f"/api/monitoring/history/{server_id}")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_history_with_data(self, client, db_session):
        """Test getting history with data"""
        # Create a server first
        server = MonitoredServer(
            name="TestServer",
            url="http://test.com",
            enabled=True
        )
        db_session.add(server)
        db_session.commit()
        db_session.refresh(server)

        # Add some history
        history = MonitoringHistory(
            server_id=server.id,
            http_code=200,
            response_time_ms=150,
            status="UP"
        )
        db_session.add(history)
        db_session.commit()

        response = client.get(f"/api/monitoring/history/{server.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["http_code"] == 200

    def test_get_chart_data(self, client, db_session):
        """Test getting chart data"""
        # Create a server first
        server = MonitoredServer(
            name="TestServer",
            url="http://test.com",
            enabled=True
        )
        db_session.add(server)
        db_session.commit()
        db_session.refresh(server)

        response = client.get(f"/api/monitoring/chart/{server.id}?hours=24")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "server_id" in data
        assert data["server_id"] == server.id


class TestSettingsEndpoints:
    """Test settings endpoints"""

    def test_get_check_interval(self, client):
        """Test getting check interval"""
        response = client.get("/api/settings/check-interval")
        assert response.status_code == 200
        assert "check_interval_seconds" in response.json()


class TestIntegration:
    """Integration tests"""

    def test_full_workflow(self, client):
        """Test complete workflow: create server -> check status -> delete"""
        # 1. Create server
        create_response = client.post("/api/servers", json={
            "name": "IntegrationTest",
            "url": "http://test.com",
            "enabled": True,
            "warning_threshold": 500,
            "critical_threshold": 2000
        })
        assert create_response.status_code == 201
        server_id = create_response.json()["id"]

        # 2. Get server
        get_response = client.get(f"/api/servers/{server_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "IntegrationTest"

        # 3. Get status
        status_response = client.get("/api/monitoring/status")
        assert status_response.status_code == 200

        # 4. Update server
        update_response = client.put(f"/api/servers/{server_id}", json={
            "name": "UpdatedIntegrationTest"
        })
        assert update_response.status_code == 200

        # 5. Delete server
        delete_response = client.delete(f"/api/servers/{server_id}")
        assert delete_response.status_code == 204

        # 6. Verify deleted
        get_deleted = client.get(f"/api/servers/{server_id}")
        assert get_deleted.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
