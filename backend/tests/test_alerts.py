def test_list_alerts(client, officer_headers):
    resp = client.get("/api/alerts", headers=officer_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_acknowledge_alert(client, officer_headers, db=None):
    # Retrieve alerts
    list_resp = client.get("/api/alerts", headers=officer_headers)
    alerts = list_resp.json()
    if alerts:
        alert_id = alerts[0]["id"]
        ack_resp = client.post(
            f"/api/alerts/{alert_id}/acknowledge",
            json={"status": "ACKNOWLEDGED"},
            headers=officer_headers
        )
        assert ack_resp.status_code == 200
        assert ack_resp.json()["status"] == "ACKNOWLEDGED"
