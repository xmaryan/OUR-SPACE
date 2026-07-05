# OurSpace v1.0 - Product Requirements

## Overview
College-level LMS + ERP + real-time academic communication system. Student Android/Expo app in v1.0.

## Users
- **Student** (this app): read-only access to study materials, PYQs, assignments, notices, marks; participate in subject-based real-time chat groups.
- Faculty/Admin panels are out of scope for v1.

## Auth
- Username + password (no email login). JWT tokens, bcrypt hashed passwords.
- Register requires: full name, username, password, optional recovery email, college, course, semester, roll number.

## Modules
1. **Home Dashboard** – welcome hero, today's timetable, latest 3 notices, upcoming 3 assignments, recent 3 materials, 2x2 quick actions (Marks / Study / PYQs / Assignments).
2. **Study** – tabs: Material, PYQ, Assignments. PDFs open in browser.
3. **Notices** – feed with sticky category chips (Announcements, Exams, Events, Holidays, Circulars, Placements, Achievements).
4. **Marks** – subject-wise internal/external/total, grade, computed CGPA.
5. **Groups + Chat** – subject-based chat groups (WhatsApp-style bubbles). Real-time via 2.5s polling.
6. **Profile** – picture, name, username, roll number, course, semester, college. Change password. Logout.

## Data model (MongoDB)
`users`, `colleges`, `courses`, `subjects`, `notices`, `study_material`, `pyqs`, `assignments`, `marks`, `groups`, `messages`, `members`, `timetables`. All scoped by `college_id` / `course_id` / `semester` / `subject_id`.

## Design
Material Design 3, Indigo #3F51B5 / Purple #7E57C2 / Teal #009688 accents, background #F5F6FA, white cards with 16dp radius, pill buttons, shimmer loading (no spinners).

## Explicitly excluded (v1)
QR, OSID, attendance, voice/video, social/reels, complex analytics.
