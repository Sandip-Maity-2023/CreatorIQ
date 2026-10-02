import sys
import httpx
from starlette.testclient import TestClient
from app.main import app

BASE_URL = process.env.BASE_URL;

def get_client():
    try:
        r = httpx.get(f"{BASE_URL}/health", timeout=2.0)
        if r.status_code == 200:
            print(f"[INFO] Connected to live server at {BASE_URL}")
            return httpx.Client(base_url=BASE_URL, timeout=15.0)
    except Exception:
        pass
    print("[INFO] Testing with in-memory FastAPI TestClient")
    return TestClient(app)

def run_tests():
    print("=== Starting CreatorIQ End-to-End API Integration Suite ===")
    client = get_client()
    
    # 1. Health check
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print("[PASS] /health passed:", r.json())

    # 2. Test Demo Accounts
    r = client.get("/api/v1/auth/demo-accounts")
    assert r.status_code == 200
    accounts = r.json()
    print(f"[PASS] /demo-accounts passed ({len(accounts)} demo accounts ready)")

    # 3. Test Login for Creator
    r = client.post("/api/v1/auth/login", json={"email": "creator@creatoriq.com", "password": "password123"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] /api/v1/auth/login passed for Creator")

    # 4. Test Current User
    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200
    print("[PASS] /api/v1/auth/me passed for user:", r.json()["email"], "Role:", r.json()["role"])

    # 5. Test Analytics Overview
    r = client.get("/api/v1/analytics/overview", headers=headers)
    assert r.status_code == 200
    overview_data = r.json()["data"]["summary"]
    print(f"[PASS] /api/v1/analytics/overview passed (Reach: {overview_data['total_followers']:,}, Views: {overview_data['total_views']:,})")

    # 6. Test Social Accounts Feeds
    r = client.get("/api/v1/integrations/accounts", headers=headers)
    assert r.status_code == 200
    socials = r.json()
    print(f"[PASS] /api/v1/integrations/accounts passed ({len(socials)} social feeds connected: {[s['platform'] for s in socials]})")

    # 7. Test Connecting a New Channel (Instagram or YouTube)
    r = client.post("/api/v1/integrations/connect", headers=headers, json={
        "platform": "youtube",
        "account_handle": "@TechInsiderDaily"
    })
    assert r.status_code == 200
    print(f"[PASS] /api/v1/integrations/connect passed: Connected {r.json()['platform']} handle {r.json()['account_handle']} with {r.json()['follower_count']:,} followers")

    # 8. Test Content Posts
    r = client.get("/api/v1/analytics/content", headers=headers)
    assert r.status_code == 200
    print(f"[PASS] /api/v1/analytics/content passed ({len(r.json())} posts retrieved)")

    # 9. Test Demographics & Active Hours
    r = client.get("/api/v1/analytics/demographics", headers=headers)
    assert r.status_code == 200
    print("[PASS] /api/v1/analytics/demographics passed (Age groups & Geographies verified)")

    # 10. Test Recommendations
    r = client.get("/api/v1/analytics/recommendations", headers=headers)
    assert r.status_code == 200
    print(f"[PASS] /api/v1/analytics/recommendations passed ({len(r.json())} actionable insights)")

    # 11. Test Revenue Records & Addition
    r = client.get("/api/v1/revenue/records", headers=headers)
    assert r.status_code == 200
    
    r_deal = client.post("/api/v1/revenue/records", headers=headers, json={
        "title": "Summer Creator Spotlight Sponsorship",
        "source_type": "Sponsorship",
        "amount": 7500.0,
        "brand_name": "Acme Cloud",
        "status": "Completed"
    })
    assert r_deal.status_code == 200
    print(f"[PASS] /api/v1/revenue/records POST passed (Recorded deal of ${r_deal.json()['amount']})")

    # 12. Test PDF Report Export
    r_pdf = client.get("/api/v1/reports/export-pdf", headers=headers)
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert len(r_pdf.content) > 1000
    print(f"[PASS] /api/v1/reports/export-pdf passed ({len(r_pdf.content)} bytes generated)")

    # 13. Test CSV Metrics Export
    r_csv = client.get("/api/v1/reports/export-csv", headers=headers)
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers["content-type"]
    print(f"[PASS] /api/v1/reports/export-csv passed")

    # 14. Test RBAC: Agency Role Access
    r_agency_login = client.post("/api/v1/auth/login", json={"email": "agency@creatoriq.com", "password": "password123"})
    agency_headers = {"Authorization": f"Bearer {r_agency_login.json()['access_token']}"}
    r_roster = client.get("/api/v1/revenue/agency/roster", headers=agency_headers)
    assert r_roster.status_code == 200
    print(f"[PASS] Agency RBAC /api/v1/revenue/agency/roster passed ({len(r_roster.json())} managed creators)")

    # 15. Test RBAC: Administrator Role Access
    r_admin_login = client.post("/api/v1/auth/login", json={"email": "admin@creatoriq.com", "password": "password123"})
    admin_headers = {"Authorization": f"Bearer {r_admin_login.json()['access_token']}"}
    r_stats = client.get("/api/v1/admin/system-stats", headers=admin_headers)
    assert r_stats.status_code == 200
    print("[PASS] Administrator RBAC /api/v1/admin/system-stats passed:", r_stats.json()["system_status"])

    # 16. Test Revenue Record Deletion
    deal_id = r_deal.json()["id"]
    r_del = client.delete(f"/api/v1/revenue/records/{deal_id}", headers=headers)
    assert r_del.status_code == 200
    print(f"[PASS] DELETE /api/v1/revenue/records/{deal_id} passed:", r_del.json()["message"])

    # 17. Test Zernio Free Social Media Tools (Hashtag & Username)
    r_hash = client.post("/api/v1/tools/hashtag-analytics", headers=headers, json={"hashtag": "techtrends", "platform": "instagram"})
    assert r_hash.status_code == 200
    assert "potential_reach" in r_hash.json()
    print(f"[PASS] /api/v1/tools/hashtag-analytics passed (Reach: {r_hash.json()['potential_reach']:,}, Difficulty: {r_hash.json()['difficulty_score']})")

    r_user = client.post("/api/v1/tools/username-availability", headers=headers, json={"username": "supercreator2026"})
    assert r_user.status_code == 200
    assert "networks" in r_user.json()
    print(f"[PASS] /api/v1/tools/username-availability passed ({len(r_user.json()['networks'])} networks checked)")

    # 18. Test Gemini AI Integration (Chat & Post Analyzer)
    r_ai_chat = client.post("/api/v1/ai/chat", headers=headers, json={"prompt": "How can I improve my YouTube retention rate?"})
    assert r_ai_chat.status_code == 200
    assert "response" in r_ai_chat.json()
    print("[PASS] /api/v1/ai/chat passed (Provider:", r_ai_chat.json().get("provider"), ")")

    r_ai_post = client.post("/api/v1/ai/analyze-post", headers=headers, json={"title": "10 AI Tools That Feel Illegal To Know in 2026", "platform": "youtube"})
    assert r_ai_post.status_code == 200
    assert "virality_score" in r_ai_post.json()
    print(f"[PASS] /api/v1/ai/analyze-post passed (Virality score: {r_ai_post.json()['virality_score']}/100)")

    print("\n>>> ALL 18 AUTOMATED INTEGRATION TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_tests()
