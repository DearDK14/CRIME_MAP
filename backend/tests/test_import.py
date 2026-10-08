def test_csv_import_preview_and_validation(client, analyst_headers):
    sample_csv = """case_number,crime_type,date,time,latitude,longitude,police_station,severity,status,description
FIR-CSV-001,Burglary,2026-09-01,10:30:00,11.9365,79.8322,Test Grand Bazaar PS,Medium,Reported,Sample test incident
FIR-CSV-002,Robbery,2026-09-02,15:45:00,11.9400,79.8350,Test Grand Bazaar PS,Critical,Reported,Sample critical incident
"""
    # Preview run (commit=False)
    resp = client.post(
        "/api/import/csv?commit=false",
        data={"csv_data": sample_csv},
        headers=analyst_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["valid_rows"] == 2
    assert data["invalid_rows"] == 0
    assert data["imported_rows"] == 0  # not committed yet

def test_csv_duplicate_rejection(client, analyst_headers):
    # Pass duplicate of already seeded case number
    dup_csv = """case_number,crime_type,date,time,latitude,longitude,police_station
TEST-FIR-001,Burglary,2026-09-01,10:30:00,11.9365,79.8322,Test Grand Bazaar PS
"""
    resp = client.post(
        "/api/import/csv?commit=false",
        data={"csv_data": dup_csv},
        headers=analyst_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["duplicate_rows"] == 1
    assert data["valid_rows"] == 0
