"""OurSpace backend - FastAPI + MongoDB.

Provides JWT auth (username + password), study material, PYQs, assignments,
notices, marks, subject-based group chat (polled real-time), and profile
endpoints. Seeds demo data on startup.
"""
import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
SECRET_KEY = os.environ.get("JWT_SECRET", "ourspace-dev-secret-please-change")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

app = FastAPI(title="OurSpace API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ourspace")


# ---------- Models ----------
class RegisterIn(BaseModel):
    full_name: str
    username: str
    password: str
    recovery_email: Optional[EmailStr] = None
    college_id: str
    course_id: str
    semester: int
    roll_number: str


class LoginIn(BaseModel):
    username: str
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class MessageIn(BaseModel):
    text: str


# ---------- Utils ----------
def hash_pw(p: str) -> str:
    return pwd_ctx.hash(p)


def verify_pw(p: str, h: str) -> bool:
    try:
        return pwd_ctx.verify(p, h)
    except Exception:
        return False


def make_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer)):
    if not cred:
        raise HTTPException(401, "Missing auth")
    try:
        payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def clean(d):
    if isinstance(d, list):
        return [clean(x) for x in d]
    if isinstance(d, dict):
        return {k: clean(v) for k, v in d.items() if k != "_id"}
    return d


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"app": "OurSpace", "version": "1.0"}


@api.get("/colleges")
async def list_colleges():
    return clean(await db.colleges.find({}, {"_id": 0}).to_list(100))


@api.get("/courses")
async def list_courses(college_id: Optional[str] = None):
    q = {"college_id": college_id} if college_id else {}
    return clean(await db.courses.find(q, {"_id": 0}).to_list(100))


@api.post("/auth/register")
async def register(body: RegisterIn):
    if await db.users.find_one({"username": body.username}):
        raise HTTPException(400, "Username already taken")
    college = await db.colleges.find_one({"id": body.college_id})
    course = await db.courses.find_one({"id": body.course_id})
    if not college or not course:
        raise HTTPException(400, "Invalid college/course")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "full_name": body.full_name,
        "username": body.username,
        "password": hash_pw(body.password),
        "recovery_email": body.recovery_email,
        "college_id": body.college_id,
        "course_id": body.course_id,
        "semester": body.semester,
        "roll_number": body.roll_number,
        "role": "student",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    doc.pop("_id", None)
    # auto-join subject groups
    subjects = await db.subjects.find(
        {"course_id": body.course_id, "semester": body.semester}, {"_id": 0}
    ).to_list(50)
    for s in subjects:
        grp = await db.groups.find_one({"subject_id": s["id"]})
        if grp:
            await db.members.update_one(
                {"group_id": grp["id"], "user_id": uid},
                {"$set": {"group_id": grp["id"], "user_id": uid}},
                upsert=True,
            )
    token = make_token(uid, "student")
    user = {k: v for k, v in doc.items() if k != "password"}
    return {"access_token": token, "user": user}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"username": body.username})
    if not user or not verify_pw(body.password, user["password"]):
        raise HTTPException(400, "Incorrect username or password")
    token = make_token(user["id"], user.get("role", "student"))
    safe = {k: v for k, v in user.items() if k not in ("password", "_id")}
    return {"access_token": token, "user": safe, "role": user.get("role", "student")}


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return user


@api.post("/auth/change-password")
async def change_password(body: ChangePasswordIn, user=Depends(current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not verify_pw(body.current_password, full["password"]):
        raise HTTPException(400, "Current password is incorrect")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hash_pw(body.new_password)}})
    return {"ok": True}


# ---------- Dashboard ----------
@api.get("/dashboard")
async def dashboard(user=Depends(current_user)):
    scope = {"college_id": user["college_id"], "course_id": user["course_id"], "semester": user["semester"]}
    notices = await db.notices.find({"college_id": user["college_id"]}, {"_id": 0}).sort("date", -1).to_list(3)
    assignments = await db.assignments.find(scope, {"_id": 0}).sort("due_date", 1).to_list(3)
    materials = await db.study_material.find(scope, {"_id": 0}).sort("created_at", -1).to_list(3)
    timetable = await db.timetables.find_one(scope, {"_id": 0})
    return {
        "notices": clean(notices),
        "assignments": clean(assignments),
        "materials": clean(materials),
        "timetable": clean(timetable) if timetable else None,
    }


def _scope_query(user):
    return {"college_id": user["college_id"], "course_id": user["course_id"], "semester": user["semester"]}


@api.get("/study/material")
async def study_material(user=Depends(current_user)):
    return clean(await db.study_material.find(_scope_query(user), {"_id": 0}).sort("created_at", -1).to_list(200))


@api.get("/study/pyqs")
async def pyqs(user=Depends(current_user)):
    return clean(await db.pyqs.find(_scope_query(user), {"_id": 0}).sort("year", -1).to_list(200))


@api.get("/study/assignments")
async def assignments(user=Depends(current_user)):
    return clean(await db.assignments.find(_scope_query(user), {"_id": 0}).sort("due_date", 1).to_list(200))


@api.get("/notices")
async def notices(category: Optional[str] = None, user=Depends(current_user)):
    q = {"college_id": user["college_id"]}
    if category and category != "All":
        q["category"] = category
    return clean(await db.notices.find(q, {"_id": 0}).sort("date", -1).to_list(200))


@api.get("/marks")
async def marks(user=Depends(current_user)):
    rows = await db.marks.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(200)
    # attach subject names
    subject_ids = list({r["subject_id"] for r in rows})
    subs = await db.subjects.find({"id": {"$in": subject_ids}}, {"_id": 0}).to_list(200)
    sub_map = {s["id"]: s for s in subs}
    for r in rows:
        s = sub_map.get(r["subject_id"], {})
        r["subject_name"] = s.get("name", "Subject")
        r["subject_code"] = s.get("code", "")
    # CGPA (simple average of grade points)
    grade_pts = {"A+": 10, "A": 9, "B+": 8, "B": 7, "C": 6, "D": 5, "F": 0}
    if rows:
        cgpa = round(sum(grade_pts.get(r["grade"], 0) for r in rows) / len(rows), 2)
    else:
        cgpa = 0.0
    return {"marks": clean(rows), "cgpa": cgpa}


# ---------- Groups & Chat ----------
@api.get("/groups")
async def my_groups(user=Depends(current_user)):
    mems = await db.members.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    gids = [m["group_id"] for m in mems]
    groups = await db.groups.find({"id": {"$in": gids}}, {"_id": 0}).to_list(100)
    # attach last message
    for g in groups:
        last = await db.messages.find({"group_id": g["id"]}, {"_id": 0}).sort("timestamp", -1).limit(1).to_list(1)
        g["last_message"] = last[0] if last else None
    return clean(groups)


@api.get("/groups/{group_id}/messages")
async def group_messages(group_id: str, since: Optional[str] = None, user=Depends(current_user)):
    q = {"group_id": group_id}
    if since:
        q["timestamp"] = {"$gt": since}
    msgs = await db.messages.find(q, {"_id": 0}).sort("timestamp", 1).to_list(500)
    return clean(msgs)


@api.post("/groups/{group_id}/messages")
async def send_message(group_id: str, body: MessageIn, user=Depends(current_user)):
    grp = await db.groups.find_one({"id": group_id})
    if not grp:
        raise HTTPException(404, "Group not found")
    doc = {
        "id": str(uuid.uuid4()),
        "group_id": group_id,
        "sender_id": user["id"],
        "sender_name": user["full_name"],
        "text": body.text,
        "type": "text",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(doc)
    return clean(doc)


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Seed ----------
async def seed():
    if await db.users.count_documents({"username": "alex"}):
        logger.info("seed: already present")
        return
    logger.info("seed: populating demo data")
    # colleges
    college = {"id": "col-1", "name": "Delhi University", "short": "DU"}
    await db.colleges.update_one({"id": "col-1"}, {"$set": college}, upsert=True)
    # courses
    course = {"id": "crs-1", "college_id": "col-1", "name": "BCA", "duration_years": 3}
    await db.courses.update_one({"id": "crs-1"}, {"$set": course}, upsert=True)
    course2 = {"id": "crs-2", "college_id": "col-1", "name": "B.Tech CSE", "duration_years": 4}
    await db.courses.update_one({"id": "crs-2"}, {"$set": course2}, upsert=True)
    # subjects for BCA sem 3
    subjects = [
        {"id": "sub-1", "course_id": "crs-1", "semester": 3, "name": "Java Programming", "code": "BCA301"},
        {"id": "sub-2", "course_id": "crs-1", "semester": 3, "name": "Database Management Systems", "code": "BCA302"},
        {"id": "sub-3", "course_id": "crs-1", "semester": 3, "name": "Operating Systems", "code": "BCA303"},
        {"id": "sub-4", "course_id": "crs-1", "semester": 3, "name": "Data Structures", "code": "BCA304"},
        {"id": "sub-5", "course_id": "crs-1", "semester": 3, "name": "Computer Networks", "code": "BCA305"},
    ]
    for s in subjects:
        await db.subjects.update_one({"id": s["id"]}, {"$set": s}, upsert=True)
    # groups (one per subject)
    for s in subjects:
        g = {
            "id": f"grp-{s['id']}",
            "name": f"BCA Sem 3 - {s['name']}",
            "college_id": "col-1",
            "course_id": "crs-1",
            "semester": 3,
            "subject_id": s["id"],
        }
        await db.groups.update_one({"id": g["id"]}, {"$set": g}, upsert=True)
    # demo student
    uid = "stu-alex"
    await db.users.update_one(
        {"id": uid},
        {"$set": {
            "id": uid,
            "full_name": "Alex Sharma",
            "username": "alex",
            "password": hash_pw("alex1234"),
            "recovery_email": "alex@example.com",
            "college_id": "col-1",
            "course_id": "crs-1",
            "semester": 3,
            "roll_number": "BCA-2023-045",
            "role": "student",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    # second demo student for chat conversations
    uid2 = "stu-neha"
    await db.users.update_one(
        {"id": uid2},
        {"$set": {
            "id": uid2,
            "full_name": "Neha Verma",
            "username": "neha",
            "password": hash_pw("neha1234"),
            "college_id": "col-1",
            "course_id": "crs-1",
            "semester": 3,
            "roll_number": "BCA-2023-046",
            "role": "student",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    # add both students to all subject groups
    for s in subjects:
        gid = f"grp-{s['id']}"
        for u in (uid, uid2):
            await db.members.update_one(
                {"group_id": gid, "user_id": u},
                {"$set": {"group_id": gid, "user_id": u}}, upsert=True,
            )
    # notices
    now = datetime.now(timezone.utc)
    notices = [
        {"id": "n1", "college_id": "col-1", "title": "Mid-semester exam schedule released",
         "description": "The mid-sem exam schedule for BCA has been published. Please check the timetable and prepare accordingly.",
         "category": "Exams", "date": (now - timedelta(days=1)).isoformat(), "author": "Exam Cell"},
        {"id": "n2", "college_id": "col-1", "title": "Tech Fest 2026 registrations open",
         "description": "Register for the annual Tech Fest by Friday. Prizes worth 2 lakh to be won across coding, robotics and design.",
         "category": "Events", "date": (now - timedelta(days=2)).isoformat(), "author": "Student Council"},
        {"id": "n3", "college_id": "col-1", "title": "Diwali break announcement",
         "description": "College will remain closed from Nov 10 to Nov 15 for Diwali holidays.",
         "category": "Holidays", "date": (now - timedelta(days=3)).isoformat(), "author": "Administration"},
        {"id": "n4", "college_id": "col-1", "title": "Placement drive: Infosys",
         "description": "Infosys will be visiting the campus on Nov 22 for on-campus placements. Eligible students should register on the portal.",
         "category": "Placements", "date": (now - timedelta(days=4)).isoformat(), "author": "T&P Cell"},
        {"id": "n5", "college_id": "col-1", "title": "Congrats! Neha wins hackathon",
         "description": "Neha Verma from BCA Sem 3 won 1st place at the National Coding Hackathon. Kudos!",
         "category": "Achievements", "date": (now - timedelta(days=5)).isoformat(), "author": "Faculty"},
        {"id": "n6", "college_id": "col-1", "title": "New library circular",
         "description": "Library hours extended to 9pm from next Monday. Reserve books via the new online portal.",
         "category": "Circulars", "date": (now - timedelta(days=6)).isoformat(), "author": "Librarian"},
        {"id": "n7", "college_id": "col-1", "title": "Annual sports day announcement",
         "description": "Annual sports day scheduled for Dec 5. Sign up for events at the sports office.",
         "category": "Announcements", "date": (now - timedelta(days=7)).isoformat(), "author": "Sports Committee"},
    ]
    for n in notices:
        await db.notices.update_one({"id": n["id"]}, {"$set": n}, upsert=True)
    # study material (PDF via Google Drive style URLs)
    sample_pdf = "https://www.orimi.com/pdf-test.pdf"
    materials = [
        {"id": "m1", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-1",
         "title": "Java OOP - Classes & Objects", "subject_name": "Java Programming", "url": sample_pdf,
         "created_at": (now - timedelta(days=1)).isoformat()},
        {"id": "m2", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-2",
         "title": "SQL Joins Reference Sheet", "subject_name": "DBMS", "url": sample_pdf,
         "created_at": (now - timedelta(days=2)).isoformat()},
        {"id": "m3", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-3",
         "title": "Process Scheduling Notes", "subject_name": "Operating Systems", "url": sample_pdf,
         "created_at": (now - timedelta(days=3)).isoformat()},
        {"id": "m4", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-4",
         "title": "Trees & Graphs - Full Notes", "subject_name": "Data Structures", "url": sample_pdf,
         "created_at": (now - timedelta(days=4)).isoformat()},
    ]
    for m in materials:
        await db.study_material.update_one({"id": m["id"]}, {"$set": m}, upsert=True)
    # pyqs
    pyqs = [
        {"id": "p1", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-1",
         "title": "Java Programming - End Sem 2024", "subject_name": "Java Programming", "year": 2024, "url": sample_pdf},
        {"id": "p2", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-2",
         "title": "DBMS - End Sem 2024", "subject_name": "DBMS", "year": 2024, "url": sample_pdf},
        {"id": "p3", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-4",
         "title": "Data Structures - End Sem 2023", "subject_name": "Data Structures", "year": 2023, "url": sample_pdf},
    ]
    for p in pyqs:
        await db.pyqs.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
    # assignments
    assignments = [
        {"id": "a1", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-1",
         "title": "Build a Java calculator", "subject_name": "Java Programming",
         "due_date": (now + timedelta(days=2)).isoformat(), "url": sample_pdf},
        {"id": "a2", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-2",
         "title": "DBMS ER Diagram Assignment", "subject_name": "DBMS",
         "due_date": (now + timedelta(days=5)).isoformat(), "url": sample_pdf},
        {"id": "a3", "college_id": "col-1", "course_id": "crs-1", "semester": 3, "subject_id": "sub-4",
         "title": "Implement BST insert & delete", "subject_name": "Data Structures",
         "due_date": (now + timedelta(days=7)).isoformat(), "url": sample_pdf},
    ]
    for a in assignments:
        await db.assignments.update_one({"id": a["id"]}, {"$set": a}, upsert=True)
    # marks
    marks_data = [
        {"id": "mk1", "user_id": uid, "subject_id": "sub-1", "internal": 28, "external": 62, "total": 90, "grade": "A+"},
        {"id": "mk2", "user_id": uid, "subject_id": "sub-2", "internal": 25, "external": 55, "total": 80, "grade": "A"},
        {"id": "mk3", "user_id": uid, "subject_id": "sub-3", "internal": 22, "external": 50, "total": 72, "grade": "B+"},
        {"id": "mk4", "user_id": uid, "subject_id": "sub-4", "internal": 27, "external": 58, "total": 85, "grade": "A"},
        {"id": "mk5", "user_id": uid, "subject_id": "sub-5", "internal": 24, "external": 52, "total": 76, "grade": "B+"},
    ]
    for m in marks_data:
        await db.marks.update_one({"id": m["id"]}, {"$set": m}, upsert=True)
    # timetable
    await db.timetables.update_one(
        {"college_id": "col-1", "course_id": "crs-1", "semester": 3},
        {"$set": {
            "college_id": "col-1", "course_id": "crs-1", "semester": 3,
            "today": [
                {"time": "09:00 - 10:00", "subject": "Java Programming", "room": "Lab 2"},
                {"time": "10:15 - 11:15", "subject": "DBMS", "room": "Room 301"},
                {"time": "11:30 - 12:30", "subject": "Operating Systems", "room": "Room 302"},
                {"time": "13:30 - 14:30", "subject": "Data Structures", "room": "Lab 1"},
            ],
        }},
        upsert=True,
    )
    # sample messages
    msgs = [
        {"id": "msg1", "group_id": "grp-sub-1", "sender_id": uid2, "sender_name": "Neha Verma",
         "text": "Hey! Did anyone finish the calculator assignment?", "type": "text",
         "timestamp": (now - timedelta(hours=3)).isoformat()},
        {"id": "msg2", "group_id": "grp-sub-1", "sender_id": uid, "sender_name": "Alex Sharma",
         "text": "Halfway through. GUI part is tricky.", "type": "text",
         "timestamp": (now - timedelta(hours=2)).isoformat()},
        {"id": "msg3", "group_id": "grp-sub-1", "sender_id": uid2, "sender_name": "Neha Verma",
         "text": "Same. Let's group study tomorrow?", "type": "text",
         "timestamp": (now - timedelta(hours=1)).isoformat()},
    ]
    for m in msgs:
        await db.messages.update_one({"id": m["id"]}, {"$set": m}, upsert=True)
    logger.info("seed: done")


@app.on_event("startup")
async def _startup():
    await seed()


@app.on_event("shutdown")
async def _shutdown():
    client.close()
