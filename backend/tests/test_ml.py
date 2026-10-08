def test_hotspot_detection_endpoint(client, analyst_headers):
    payload = {
        "eps_meters": 500.0,
        "min_samples": 2
    }
    resp = client.post("/api/hotspots/detect", json=payload, headers=analyst_headers)
    assert resp.status_code == 200
    clusters = resp.json()
    assert isinstance(clusters, list)
    if clusters:
        cluster = clusters[0]
        assert "risk_score" in cluster
        assert 0.0 <= cluster["risk_score"] <= 100.0
        assert cluster["risk_category"] in ["Low", "Moderate", "High", "Very High"]
        assert "radius_meters" in cluster

def test_prediction_pipeline_endpoint(client, analyst_headers):
    resp = client.post("/api/prediction/run", json={"model_type": "RandomForest"}, headers=analyst_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "metrics" in data
    assert "disclaimer" in data
    assert "decision-support" in data["disclaimer"]
    assert "results" in data
    assert len(data["results"]) > 0
    assert "important_factors" in data["results"][0]
