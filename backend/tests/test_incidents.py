def test_list_incidents(client, officer_headers):
    resp = client.get("/api/incidents", headers=officer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 2

def test_incident_filtering(client, officer_headers):
    resp = client.get("/api/incidents?severity=Critical", headers=officer_headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    assert all(i["severity"] == "Critical" for i in items)

def test_create_incident_officer(client, officer_headers):
    payload = {
        "case_number": "TEST-FIR-NEW-100",
        "crime_type_id": 1,
        "incident_date": "2026-09-20",
        "incident_time": "18:00:00",
        "latitude": 11.9380,
        "longitude": 79.8330,
        "police_station_id": 1,
        "severity": "High",
        "status": "Reported",
        "description": "Street assault incident",
        "address": "Bussy Street, Puducherry"
    }
    resp = client.post("/api/incidents", json=payload, headers=officer_headers)
    assert resp.status_code == 201
    assert resp.json()["case_number"] == "TEST-FIR-NEW-100"

def test_analyst_cannot_create_incident(client, analyst_headers):
    payload = {
        "case_number": "TEST-ANALYST-FAIL",
        "crime_type_id": 1,
        "incident_date": "2026-09-20",
        "latitude": 11.9380,
        "longitude": 79.8330,
        "police_station_id": 1
    }
    resp = client.post("/api/incidents", json=payload, headers=analyst_headers)
    assert resp.status_code == 403  # Forbidden by RBAC

def test_admin_delete_incident(client, admin_headers):
    # Retrieve incident
    list_resp = client.get("/api/incidents", headers=admin_headers)
    incident_id = list_resp.json()["items"][0]["id"]

    del_resp = client.delete(f"/api/incidents/{incident_id}", headers=admin_headers)
    assert del_resp.status_code == 204
