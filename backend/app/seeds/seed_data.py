import random
from datetime import datetime, date, time, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.police_station import PoliceStation
from app.models.crime_type import CrimeType
from app.models.crime_incident import CrimeIncident
from app.models.alert import Alert
from app.core.security import hash_password
from app.services.ml_service import MLService
from app.services.alert_service import AlertService

# Puducherry Police Stations (Realistic demonstration data - NOT confidential operational data)
PUDUCHERRY_STATIONS = [
    {
        "name": "Grand Bazaar Police Station",
        "station_code": "PY-GBZ-01",
        "jurisdiction_area": "Heritage Town, White Town, Boulevard North",
        "latitude": 11.9365,
        "longitude": 79.8322,
        "contact_number": "+91-413-2334001",
        "officer_in_charge": "Inspector S. Ramanathan"
    },
    {
        "name": "Muthialpet Police Station",
        "station_code": "PY-MUT-02",
        "jurisdiction_area": "Muthialpet, Solai Nagar, Vaithikuppam",
        "latitude": 11.9540,
        "longitude": 79.8315,
        "contact_number": "+91-413-2334002",
        "officer_in_charge": "Inspector M. Kumar"
    },
    {
        "name": "Odeonsale Police Station",
        "station_code": "PY-ODE-03",
        "jurisdiction_area": "Boulevard South, Uppalam, Dubrayapet",
        "latitude": 11.9280,
        "longitude": 79.8280,
        "contact_number": "+91-413-2334003",
        "officer_in_charge": "Inspector K. Selvam"
    },
    {
        "name": "Lawspet Police Station",
        "station_code": "PY-LAW-04",
        "jurisdiction_area": "Lawspet, Tagore Nagar, Airport Area",
        "latitude": 11.9720,
        "longitude": 79.8160,
        "contact_number": "+91-413-2334004",
        "officer_in_charge": "Inspector V. Balaji"
    },
    {
        "name": "D'Nagar Police Station",
        "station_code": "PY-DNG-05",
        "jurisdiction_area": "Dhanvantari Nagar, JIPMER Campus, Gorimedu South",
        "latitude": 11.9525,
        "longitude": 79.7990,
        "contact_number": "+91-413-2334005",
        "officer_in_charge": "Inspector R. Anandan"
    },
    {
        "name": "Gorimedu Police Station",
        "station_code": "PY-GOR-06",
        "jurisdiction_area": "Gorimedu, Priyadarshini Nagar, Mettupalayam",
        "latitude": 11.9685,
        "longitude": 79.7920,
        "contact_number": "+91-413-2334006",
        "officer_in_charge": "Inspector P. Murugan"
    },
    {
        "name": "Kalapet Police Station",
        "station_code": "PY-KAL-07",
        "jurisdiction_area": "Kalapet, Pondicherry University, ECR Coast",
        "latitude": 12.0180,
        "longitude": 79.8550,
        "contact_number": "+91-413-2334007",
        "officer_in_charge": "Inspector T. Jayaraj"
    },
    {
        "name": "Villianur Police Station",
        "station_code": "PY-VIL-08",
        "jurisdiction_area": "Villianur, Sulthanpet, Uruvaiyar",
        "latitude": 11.9160,
        "longitude": 79.7580,
        "contact_number": "+91-413-2334008",
        "officer_in_charge": "Inspector N. Radhakrishnan"
    },
    {
        "name": "Ariyankuppam Police Station",
        "station_code": "PY-ARI-09",
        "jurisdiction_area": "Ariyankuppam, Chunnambar, Nonankuppam",
        "latitude": 11.8960,
        "longitude": 79.8050,
        "contact_number": "+91-413-2334009",
        "officer_in_charge": "Inspector E. Velu"
    },
    {
        "name": "Reddiarpalayam Police Station",
        "station_code": "PY-RED-10",
        "jurisdiction_area": "Reddiarpalayam, Kamban Nagar, Villianur Road",
        "latitude": 11.9390,
        "longitude": 79.7950,
        "contact_number": "+91-413-2334010",
        "officer_in_charge": "Inspector D. Senthamizh"
    }
]

# Standard Crime Catalog
CRIME_CATALOG = [
    {"name": "Burglary & House Breaking", "code": "IPC-457", "category": "Property", "base_severity": "Medium", "description": "Night house-breaking or lurking trespass to commit theft."},
    {"name": "Chain Snatching & Robbery", "code": "IPC-392", "category": "Violent", "base_severity": "High", "description": "Street snatching of gold ornaments and mobile phones by motorcycle riders."},
    {"name": "Motor Vehicle Theft", "code": "IPC-379V", "category": "Property", "base_severity": "Medium", "description": "Two-wheeler or car theft from parking spaces or residential streets."},
    {"name": "Aggravated Assault", "code": "IPC-324", "category": "Violent", "base_severity": "Critical", "description": "Voluntarily causing hurt by dangerous weapons or means."},
    {"name": "Armed Robbery", "code": "IPC-397", "category": "Violent", "base_severity": "Critical", "description": "Robbery or dacoity with attempt to cause death or grievous hurt."},
    {"name": "Online Financial Fraud", "code": "IT-66D", "category": "Cyber", "base_severity": "Medium", "description": "UPI fraud, OTP phishing, or unauthorized financial transaction scams."},
    {"name": "Public Nuisance & Disorder", "code": "IPC-268", "category": "Public Order", "base_severity": "Low", "description": "Brawls in public spaces, intoxication, and noise violations."},
    {"name": "Commercial Narcotics Possession", "code": "NDPS-20", "category": "Narcotics", "base_severity": "High", "description": "Illegal possession, transport, or sale of contraband substances."},
    {"name": "Domestic Violence", "code": "IPC-498A", "category": "Violent", "base_severity": "High", "description": "Husband or relative of husband subjecting woman to cruelty."},
    {"name": "Reckless Driving & Accidents", "code": "IPC-279", "category": "Traffic", "base_severity": "Medium", "description": "Rash driving on public ways endangering human life."},
    {"name": "Extortion & Threat", "code": "IPC-384", "category": "Violent", "base_severity": "High", "description": "Putting person in fear of injury to commit extortion."},
    {"name": "Criminal Trespass", "code": "IPC-447", "category": "Property", "base_severity": "Low", "description": "Unlawful entry into property with intent to commit an offense."}
]

# Puducherry Prominent Demonstration Centers
LOCALITY_CENTERS = [
    {"name": "Promenade Beach / White Town", "lat": 11.9330, "lon": 79.8350, "station_idx": 0, "hotspot_tendency": True},
    {"name": "Grand Bazaar Market Area", "lat": 11.9370, "lon": 79.8280, "station_idx": 0, "hotspot_tendency": True},
    {"name": "Muthialpet Clock Tower", "lat": 11.9560, "lon": 79.8320, "station_idx": 1, "hotspot_tendency": False},
    {"name": "Solai Nagar Beach Road", "lat": 11.9610, "lon": 79.8360, "station_idx": 1, "hotspot_tendency": True},
    {"name": "Railway Station / Uppalam", "lat": 11.9260, "lon": 79.8250, "station_idx": 2, "hotspot_tendency": True},
    {"name": "Lawspet Main Junction", "lat": 11.9690, "lon": 79.8140, "station_idx": 3, "hotspot_tendency": False},
    {"name": "Airport Periphery Road", "lat": 11.9740, "lon": 79.8120, "station_idx": 3, "hotspot_tendency": False},
    {"name": "Gorimedu / JIPMER Gate", "lat": 11.9510, "lon": 79.7980, "station_idx": 4, "hotspot_tendency": True},
    {"name": "Dhanvantari Nagar Commercial St", "lat": 11.9490, "lon": 79.8020, "station_idx": 4, "hotspot_tendency": False},
    {"name": "Mettupalayam Industrial Estate", "lat": 11.9650, "lon": 79.7890, "station_idx": 5, "hotspot_tendency": True},
    {"name": "Pondicherry University Gate", "lat": 12.0160, "lon": 79.8540, "station_idx": 6, "hotspot_tendency": False},
    {"name": "Kalapet ECR Junction", "lat": 12.0220, "lon": 79.8580, "station_idx": 6, "hotspot_tendency": False},
    {"name": "Villianur Temple Car Street", "lat": 11.9140, "lon": 79.7590, "station_idx": 7, "hotspot_tendency": False},
    {"name": "Ariyankuppam Bridge / Nonankuppam", "lat": 11.8940, "lon": 79.8040, "station_idx": 8, "hotspot_tendency": False},
    {"name": "Chunnambar Boat House Road", "lat": 11.8890, "lon": 79.8010, "station_idx": 8, "hotspot_tendency": False},
    {"name": "Reddiarpalayam Bus Stop", "lat": 11.9410, "lon": 79.7920, "station_idx": 9, "hotspot_tendency": False}
]

def seed_database():
    """Seed the database with users, police stations, crime types, and 500+ realistic incidents."""
    print("Beginning database seeding process...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Police Stations
        station_objs = []
        for s_data in PUDUCHERRY_STATIONS:
            st = db.query(PoliceStation).filter(PoliceStation.station_code == s_data["station_code"]).first()
            if not st:
                st = PoliceStation(**s_data)
                db.add(st)
                db.flush()
            station_objs.append(st)
        db.commit()
        print(f"Verified/Seeded {len(station_objs)} Police Stations.")

        # 2. Seed Users
        users_to_seed = [
            {
                "username": "admin",
                "email": "admin@police.py.gov.in",
                "password": hash_password("Admin@123"),
                "role": "admin",
                "badge_number": "PY-HQ-001",
                "police_station_id": station_objs[0].id
            },
            {
                "username": "officer_sharma",
                "email": "sharma.officer@police.py.gov.in",
                "password": hash_password("Officer@123"),
                "role": "police_officer",
                "badge_number": "PY-GBZ-104",
                "police_station_id": station_objs[0].id
            },
            {
                "username": "analyst_priya",
                "email": "priya.analyst@police.py.gov.in",
                "password": hash_password("Analyst@123"),
                "role": "analyst",
                "badge_number": "PY-CID-042",
                "police_station_id": station_objs[0].id
            }
        ]

        created_users = []
        for u_data in users_to_seed:
            u = db.query(User).filter(User.username == u_data["username"]).first()
            if not u:
                u = User(
                    username=u_data["username"],
                    email=u_data["email"],
                    hashed_password=u_data["password"],
                    role=u_data["role"],
                    badge_number=u_data["badge_number"],
                    police_station_id=u_data["police_station_id"],
                    is_active=True
                )
                db.add(u)
                db.flush()
            created_users.append(u)
        db.commit()
        print(f"Verified/Seeded {len(created_users)} System Users.")

        # 3. Seed Crime Catalog
        crime_type_objs = []
        for c_data in CRIME_CATALOG:
            ct = db.query(CrimeType).filter(CrimeType.code == c_data["code"]).first()
            if not ct:
                ct = CrimeType(**c_data)
                db.add(ct)
                db.flush()
            crime_type_objs.append(ct)
        db.commit()
        print(f"Verified/Seeded {len(crime_type_objs)} Crime Types.")

        # 4. Check existing incident count
        current_count = db.query(CrimeIncident).count()
        if current_count >= 500:
            print(f"Database already contains {current_count} incidents. Skipping synthetic incident generation.")
        else:
            print(f"Generating synthetic crime incidents to reach at least 520 records...")
            needed = 520 - current_count
            random.seed(42)  # Deterministic realistic seed

            today = date.today()
            statuses = ["Reported", "Under Investigation", "Charges Filed", "Closed"]
            status_weights = [0.25, 0.45, 0.20, 0.10]

            weapons = [None, None, "None", "Knife", "Iron Rod", "Firearm", "Stick", "None"]

            new_incidents = []
            for i in range(needed):
                idx = current_count + i + 1
                case_no = f"FIR-PY-2026-{idx:05d}"

                # Locality selection
                loc = random.choice(LOCALITY_CENTERS)
                station = station_objs[loc["station_idx"]]

                # If hotspot tendency, cluster tightly within 100-250m, else scatter 300-900m
                jitter_m = random.uniform(20, 220) if loc["hotspot_tendency"] else random.uniform(80, 800)
                # Convert meters to approx deg
                lat_jitter = (jitter_m / 111320.0) * random.choice([-1, 1]) * random.random()
                lon_jitter = (jitter_m / (111320.0 * 0.98)) * random.choice([-1, 1]) * random.random()

                lat = round(loc["lat"] + lat_jitter, 6)
                lon = round(loc["lon"] + lon_jitter, 6)

                # Date: past 120 days with heavier concentration in recent 45 days
                days_ago = int(random.triangular(0, 120, 25))
                inc_date = today - timedelta(days=days_ago)

                # Time: Diurnal variation (evening & night spikes)
                hour = random.choices(
                    population=list(range(24)),
                    weights=[2, 1, 1, 1, 2, 3, 4, 5, 6, 7, 6, 5, 5, 6, 7, 8, 10, 12, 14, 15, 14, 11, 7, 4],
                    k=1
                )[0]
                minute = random.randint(0, 59)
                inc_time = time(hour=hour, minute=minute)

                # Crime type selection
                ctype = random.choice(crime_type_objs)

                # Severity logic: align with type but allow situational variation
                if ctype.base_severity == "Critical":
                    sev = random.choices(["Critical", "High"], weights=[0.8, 0.2])[0]
                elif ctype.base_severity == "High":
                    sev = random.choices(["High", "Medium", "Critical"], weights=[0.7, 0.2, 0.1])[0]
                elif ctype.base_severity == "Medium":
                    sev = random.choices(["Medium", "Low", "High"], weights=[0.75, 0.2, 0.05])[0]
                else:
                    sev = random.choices(["Low", "Medium"], weights=[0.85, 0.15])[0]

                stat = random.choices(statuses, weights=status_weights)[0]
                victim_cnt = 1 if sev in ["Low", "Medium"] else random.choice([1, 1, 2, 3])

                inc = CrimeIncident(
                    case_number=case_no,
                    crime_type_id=ctype.id,
                    incident_date=inc_date,
                    incident_time=inc_time,
                    latitude=lat,
                    longitude=lon,
                    police_station_id=station.id,
                    severity=sev,
                    status=stat,
                    description=f"Synthetic incident record: {ctype.name} near {loc['name']}. Logged for decision-support testing.",
                    address=f"{loc['name']}, Puducherry",
                    weapon_used=random.choice(weapons),
                    victim_count=victim_cnt,
                    created_by_id=created_users[1].id,
                    created_at=datetime.now(timezone.utc) - timedelta(days=days_ago)
                )
                new_incidents.append(inc)

            db.bulk_save_objects(new_incidents)
            db.commit()
            print(f"Successfully generated and committed {len(new_incidents)} synthetic crime incidents.")

        # 5. Run Initial ML Hotspot Detection Pipeline
        print("Executing initial DBSCAN spatial clustering and risk assessment pipeline...")
        all_incidents = db.query(CrimeIncident).all()
        hotspots = MLService.detect_hotspots(db, all_incidents, eps_meters=350.0, min_samples=4)
        print(f"Detected {len(hotspots)} active spatial hotspots.")

        # 6. Run Initial Zone Predictive Assessment Pipeline
        print("Executing initial zone-based predictive risk model...")
        predictions, metrics = MLService.run_zone_risk_assessment(db, all_incidents, model_type="RandomForest")
        print(f"Generated {len(predictions)} risk assessment zones. Baseline MAE: {metrics.get('baseline_mae')}, Model MAE: {metrics.get('model_mae')}")

        # 7. Seed Initial Alerts
        print("Generating initial intelligence alerts...")
        # Evaluate hotspot alerts
        AlertService.evaluate_hotspot_alerts(db, hotspots)

        # Seed sample critical incident alert if none exist
        if db.query(Alert).count() == 0:
            sample_crit = db.query(CrimeIncident).filter(CrimeIncident.severity == "Critical").first()
            if sample_crit:
                AlertService.evaluate_new_incident_alerts(db, sample_crit)

        alert_count = db.query(Alert).count()
        print(f"Verified/Generated {alert_count} active security intelligence alerts.")

        print("=== DATABASE SEEDING COMPLETED SUCCESSFULLY ===")

    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
