"""OurSpace backend integration tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://academic-sync-19.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def alex_token():
    r = requests.post(f"{API}/auth/login", json={"username": "alex", "password": "alex1234"}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def neha_token():
    r = requests.post(f"{API}/auth/login", json={"username": "neha", "password": "neha1234"}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- auth ----------
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={"username": "alex", "password": "alex1234"}, timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "access_token" in j and j["user"]["username"] == "alex"
        assert "password" not in j["user"]

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"username": "alex", "password": "wrong"}, timeout=30)
        assert r.status_code == 400

    def test_me(self, alex_token):
        r = requests.get(f"{API}/auth/me", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        assert r.json()["username"] == "alex"

    def test_me_no_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_register_and_login(self):
        uname = f"TEST_u_{uuid.uuid4().hex[:6]}"
        payload = {
            "full_name": "TEST User", "username": uname, "password": "pass1234",
            "college_id": "col-1", "course_id": "crs-1", "semester": 3, "roll_number": "TEST-01"
        }
        r = requests.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["user"]["username"] == uname
        # login using new creds
        r2 = requests.post(f"{API}/auth/login", json={"username": uname, "password": "pass1234"}, timeout=30)
        assert r2.status_code == 200

    def test_register_duplicate(self):
        payload = {
            "full_name": "dup", "username": "alex", "password": "x",
            "college_id": "col-1", "course_id": "crs-1", "semester": 3, "roll_number": "x"
        }
        r = requests.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r.status_code == 400


# ---------- catalog ----------
class TestCatalog:
    def test_colleges(self):
        r = requests.get(f"{API}/colleges", timeout=30)
        assert r.status_code == 200
        cols = r.json()
        assert any(c["id"] == "col-1" for c in cols)

    def test_courses(self):
        r = requests.get(f"{API}/courses?college_id=col-1", timeout=30)
        assert r.status_code == 200
        assert any(c["id"] == "crs-1" for c in r.json())


# ---------- dashboard & study ----------
class TestAcademic:
    def test_dashboard(self, alex_token):
        r = requests.get(f"{API}/dashboard", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "notices" in j and "assignments" in j and "materials" in j
        assert j["timetable"] and len(j["timetable"]["today"]) == 4

    def test_material(self, alex_token):
        r = requests.get(f"{API}/study/material", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_pyqs(self, alex_token):
        r = requests.get(f"{API}/study/pyqs", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_assignments(self, alex_token):
        r = requests.get(f"{API}/study/assignments", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_notices_all(self, alex_token):
        r = requests.get(f"{API}/notices", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_notices_filter(self, alex_token):
        r = requests.get(f"{API}/notices?category=Exams", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert all(n["category"] == "Exams" for n in data)

    def test_marks(self, alex_token):
        r = requests.get(f"{API}/marks", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "cgpa" in j and j["cgpa"] > 0
        assert len(j["marks"]) == 5
        assert all("subject_name" in m for m in j["marks"])


# ---------- groups & chat ----------
class TestGroups:
    def test_list_groups(self, alex_token):
        r = requests.get(f"{API}/groups", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        groups = r.json()
        assert len(groups) == 5

    def test_get_messages_seeded(self, alex_token):
        r = requests.get(f"{API}/groups/grp-sub-1/messages", headers=h(alex_token), timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_send_message_and_persist(self, alex_token):
        text = f"TEST_msg_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/groups/grp-sub-1/messages", headers=h(alex_token),
                          json={"text": text}, timeout=30)
        assert r.status_code == 200
        assert r.json()["text"] == text
        # verify via GET
        r2 = requests.get(f"{API}/groups/grp-sub-1/messages", headers=h(alex_token), timeout=30)
        assert any(m["text"] == text for m in r2.json())

    def test_send_to_unknown_group(self, alex_token):
        r = requests.post(f"{API}/groups/does-not-exist/messages", headers=h(alex_token),
                          json={"text": "x"}, timeout=30)
        assert r.status_code == 404


# ---------- change password ----------
class TestChangePassword:
    def test_change_password_flow(self):
        # register fresh user
        uname = f"TEST_cp_{uuid.uuid4().hex[:6]}"
        p1, p2 = "orig1234", "new12345"
        r = requests.post(f"{API}/auth/register", json={
            "full_name": "cp", "username": uname, "password": p1,
            "college_id": "col-1", "course_id": "crs-1", "semester": 3, "roll_number": "CP-01"
        }, timeout=30)
        assert r.status_code == 200
        tok = r.json()["access_token"]
        # wrong current
        r = requests.post(f"{API}/auth/change-password", headers=h(tok),
                         json={"current_password": "bad", "new_password": p2}, timeout=30)
        assert r.status_code == 400
        # good
        r = requests.post(f"{API}/auth/change-password", headers=h(tok),
                         json={"current_password": p1, "new_password": p2}, timeout=30)
        assert r.status_code == 200
        # login with new
        r = requests.post(f"{API}/auth/login", json={"username": uname, "password": p2}, timeout=30)
        assert r.status_code == 200
