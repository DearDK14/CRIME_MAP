import pytest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.core.security import hash_password, create_access_token
from app.models.user import User
from app.models.police_station import PoliceStation
from app.models.crime_type import CrimeType
from app.models.crime_incident import CrimeIncident
from datetime import date, time

TEST_DB_URL = "sqlite:///./test_crimemap.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Seed test station
    st = PoliceStation(
        name="Test Grand Bazaar PS",
        station_code="TEST-GBZ-01",
        latitude=11.9365,
        longitude=79.8322,
        contact_number="+91-413-2334001"
    )
    db.add(st)
    db.flush()

    # Seed test crime types
    ct1 = CrimeType(name="Burglary", code="TEST-BURG", category="Property", base_severity="Medium")
    ct2 = CrimeType(name="Robbery", code="TEST-ROB", category="Violent", base_severity="Critical")
    db.add_all([ct1, ct2])
    db.flush()

    # Seed users
    admin_u = User(username="test_admin", email="admin@test.gov", hashed_password=hash_password("Admin@123"), role="admin")
    officer_u = User(username="test_officer", email="officer@test.gov", hashed_password=hash_password("Officer@123"), role="police_officer")
    analyst_u = User(username="test_analyst", email="analyst@test.gov", hashed_password=hash_password("Analyst@123"), role="analyst")
    db.add_all([admin_u, officer_u, analyst_u])
    db.flush()

    # Seed test incidents
    inc1 = CrimeIncident(
        case_number="TEST-FIR-001",
        crime_type_id=ct1.id,
        incident_date=date(2026, 9, 15),
        incident_time=time(14, 30),
        latitude=11.9360,
        longitude=79.8320,
        police_station_id=st.id,
        severity="Medium",
        status="Reported",
        description="Test burglary",
        created_by_id=officer_u.id
    )
    inc2 = CrimeIncident(
        case_number="TEST-FIR-002",
        crime_type_id=ct2.id,
        incident_date=date(2026, 9, 16),
        incident_time=time(22, 15),
        latitude=11.9365,
        longitude=79.8325,
        police_station_id=st.id,
        severity="Critical",
        status="Under Investigation",
        description="Test robbery",
        created_by_id=officer_u.id
    )
    db.add_all([inc1, inc2])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_crimemap.db"):
        try:
            os.remove("./test_crimemap.db")
        except Exception:
            pass

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_headers():
    token = create_access_token(data={"sub": "test_admin", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def officer_headers():
    token = create_access_token(data={"sub": "test_officer", "role": "police_officer"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def analyst_headers():
    token = create_access_token(data={"sub": "test_analyst", "role": "analyst"})
    return {"Authorization": f"Bearer {token}"}
