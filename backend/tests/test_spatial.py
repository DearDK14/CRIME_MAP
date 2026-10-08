def test_geojson_endpoint(client, officer_headers):
    resp = client.get("/api/map/geojson", headers=officer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) >= 1

    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Point"
    assert len(feature["geometry"]["coordinates"]) == 2  # [lon, lat]
    assert "case_number" in feature["properties"]

def test_heatmap_endpoint(client, officer_headers):
    resp = client.get("/api/map/heatmap", headers=officer_headers)
    assert resp.status_code == 200
    points = resp.json()
    assert isinstance(points, list)
    if points:
        assert "lat" in points[0]
        assert "lon" in points[0]
        assert "weight" in points[0]

def test_radius_spatial_query(client, officer_headers):
    # Query within 1000m of Grand Bazaar center (11.9365, 79.8322)
    resp = client.get(
        "/api/map/spatial-query?lat=11.9365&lon=79.8322&radius_meters=1000",
        headers=officer_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "matched_count" in data
    assert data["geojson"]["type"] == "FeatureCollection"

def test_bounding_box_query(client, officer_headers):
    resp = client.get(
        "/api/map/spatial-query?min_lat=11.90&min_lon=79.80&max_lat=11.98&max_lon=79.85",
        headers=officer_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "matched_count" in data

def test_nearby_station_query(client, officer_headers):
    resp = client.get(
        "/api/map/nearby-stations?lat=11.9360&lon=79.8320",
        headers=officer_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "station_name" in data
    assert "distance_meters" in data
    assert data["distance_meters"] >= 0
