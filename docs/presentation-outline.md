# CollApp — Presentation Outline

Slide-by-slide content for the PowerPoint deck. Each slide lists the on-screen
points, then speaker notes. Items marked **[fill in]** need the team's input.

Suggested length: 14–16 slides, about 15 minutes plus a 7–8 minute live demo.

---

## Slide 1 — Title

- **CollApp**: a mobile college-admissions platform
- Connecting senior high school graduates, college admissions offices and platform administrators
- Team name, course and section, adviser, date **[fill in]**

---

## Part 1 — System Overview

### Slide 2 — The Problem

- College applications in the Philippines are scattered across school websites, paper forms and walk-in submissions
- Students re-enter the same details and re-submit the same documents for every school
- Admissions offices check documents by hand and track applicants in spreadsheets
- Results go out one by one, at different times, through different channels

> **Speaker notes:** Frame the pain from both sides, the student and the admissions office. This sets up why the app has three roles.

### Slide 3 — The Solution

- One mobile app for the whole cycle: **discover → apply → review → decide**
- Students build one profile and reuse it for every application
- Colleges publish programs and requirements, review applicants and send decisions in-app
- AI helps at every step and stays **advisory**: people make every decision

### Slide 4 — Three Roles, One Platform

| Role | What they do |
|---|---|
| **Student** | Builds a profile, explores colleges, gets AI-matched programs, applies (works offline), uploads documents, tracks status, messages colleges |
| **School representative** | Manages the college profile, programs, requirements and posts; reviews applicants and documents; makes and batch-releases decisions |
| **Administrator** | Onboards colleges and reps, manages accounts, monitors analytics and compliance, broadcasts announcements, controls platform switches |

> **Speaker notes:** Each college is a separate "tenant". Database rules (row-level security) keep each college from seeing another college's applicants.

### Slide 5 — Architecture at a Glance

```
 Mobile app (Expo / React Native)
   │  Supabase JS client · offline SQLite cache · push token
   ▼
 Supabase
   ├─ Auth (email + OTP, Google sign-in)
   ├─ Postgres + Row-Level Security (per-role, per-college access)
   ├─ Storage (documents, attachments, media, avatars)
   ├─ Realtime (messages, notifications)
   ├─ Edge Functions (AI, push, attachment scan, admin tools)
   └─ pg_cron + pg_net (reminders, retries, scheduled releases)
   ▼
 External: Gemini API (document + essay AI) · Expo Push (FCM / APNs)
```

> **Speaker notes:** Business rules live in the database (triggers and RPCs), so they apply no matter which client calls them. The phone never holds an AI key; all AI calls run server-side.

---

## Part 2 — Team Composition

### Slide 6 — The Team

| Member | Role | Main contributions |
|---|---|---|
| Aaron Lee M. Ybañez **[confirm]** | **[fill in, e.g. Project lead / Full-stack]** | **[fill in]** |
| **[name of GitHub user "CodeBruhhh"]** | **[fill in]** | **[fill in]** |
| **[other members]** | **[fill in]** | **[fill in]** |

Suggested role labels: Project Manager, Lead Developer (Mobile), Backend & Database, UI/UX Designer, QA & Documentation.

> **Speaker notes:** The git history shows two contributors (aaronleemybanez and CodeBruhhh). Add anyone who contributed outside the repo (design, documents, testing). Work was done in phases (Phase 1: Auth → Phase 2: Student and Rep → … → the redesign phases).

---

## Part 3 — Technology Used

### Slide 7 — Technology Stack

| Layer | Technology |
|---|---|
| Mobile framework | **Expo SDK 57**, React Native 0.86, React 19, TypeScript |
| Navigation | Expo Router (file-based routes, typed routes) |
| Data and state | TanStack Query (cached and persisted), Zod validation |
| Offline | expo-sqlite (local drafts and upload outbox), expo-network |
| Device features | Document scanner (ML Kit / VisionKit), camera and image picker, biometrics (Face ID / fingerprint), push notifications, secure storage |
| Backend | **Supabase**: Postgres, Auth, Storage, Realtime, Edge Functions (Deno) |
| Database extensions | pgvector (embeddings), pg_cron (scheduled jobs), pg_net (database → function calls), pg_trgm (search) |
| AI | **gte-small** embeddings (runs inside Supabase) and **Google Gemini** (`gemini-3.5-flash-lite`, fallback `gemini-2.5-flash-lite`) |
| Build and delivery | EAS Build / Submit / Update |
| Tooling | ESLint, Prettier, React Compiler |

### Slide 8 — AI in CollApp

| Feature | Model | Who sees it |
|---|---|---|
| Program recommendations (match % plus reasons) | gte-small embeddings + rule-based scoring | Students |
| Applicant fit and enrollment likelihood | gte-small + rule-based scoring | Reps (advisory) |
| Document checker and summarizer: relevant, correct, complete | Gemini (reads the PDF or photo) | Students and reps |
| Essay feedback (students) and essay summary (reps) | Gemini | Students and reps |

> **Speaker notes:** Every AI output carries plain-language reasons and an "advisory" label. A document flagged by AI still needs a rep's approval or rejection. Daily per-user limits protect the free-tier quota.

---

## Part 4 — Implemented Features

### Slide 9 — Student Features

- **Account:** email sign-up with one-time-code verification, Google sign-in, password reset, biometric app lock
- **Onboarding:** academic profile collected once (strand, general average, target courses, preferred regions, interests, career goals)
- **Home:** application summary, AI-recommended programs, ranked campus feed (news, events, scholarships, deadlines)
- **Explore:** search and filter published colleges, save favorites, view programs and requirements
- **AI recommendations:** ranked matches with "why it matched" reasons
- **Apply:** a 3-step wizard (programs → documents and essay → review) that **saves offline and syncs automatically**
- **Documents:** scan with the camera (auto-crop, compressed under 2 MB), photo, or PDF
- **AI document check:** instant feedback such as "looks right" or "this may be the wrong file", with fixes to make
- **AI essay feedback:** fit to the prompt, strengths, improvements and grammar fixes
- **Tracking:** status timeline, requirement checklist, resubmitting flagged documents, decision message
- **Messaging:** real-time chat with a college's admissions office
- **Notifications:** in-app and push, with per-category preferences and deadline reminders 7, 3 and 1 day(s) out
- **Profile and settings:** edit profile, appearance (light and dark), change password, delete account (RA 10173 right to erasure)

### Slide 10 — School Representative Features

- **Dashboard:** applicant counts, profile status, recent applicants, quick actions
- **Institution profile builder:** description, logo, location, website, publish status
- **Programs:** degree, tuition, slots, deadline, minimum average, preferred strands, essay prompt
- **Requirement builder:** custom document and essay requirements per college or per program
- **Campus posts:** news, events, scholarships and deadlines published to student feeds
- **Review queue:** filters, search, sort by AI fit, AI-flag counts
- **Applicant detail:** profile, AI fit score, AI essay summary, document viewer with AI check, approve / request resubmission / reject
- **Decisions:** admit (choosing first- or second-choice program) or decline, with a message template
- **Batch result release:** hold decisions, then release them all at once now or at a scheduled time, so every applicant hears back together
- **Messaging:** with students and with platform admins

### Slide 11 — Administrator Features

- **Analytics:** platform totals and weekly submissions chart
- **Accounts:** manage users and institutions, suspend or reinstate, change roles
- **College onboarding:** create a college (tenant) and its first representative
- **Compliance:** row-level security overview per table, message review
- **Broadcast:** announcement to everyone or to one role (in-app and push)
- **Platform switches:** open or close applications, maintenance mode

### Slide 12 — Quality, Security and Reliability

- Row-level security on every table; reps see only their own college's submitted applications
- Application state machine enforced in the database (draft → submitted → under review / action required → accepted / rejected)
- Audit log for status changes, account changes, broadcasts and decision releases
- Message attachments are checked server-side (type, size and file signature) before anyone can download them
- Offline-first: cached screens, local drafts, an upload outbox and conflict resolution between devices
- Push dispatch with per-category opt-outs; dead device tokens are cleaned up automatically
- Accessibility: screen-reader labels, live regions, 44 pt touch targets, light and dark themes

---

## Part 5 — Tech Demo Flow

### Slide 13 — Demo Plan (one slide; then switch to the phone)

Prepare beforehand:
- Two phones (or a phone and an emulator): **Student** and **Rep**. An admin account on a third device or the same emulator.
- A seeded college with 2 programs, an essay prompt and the standard requirements (Form 138, PSA Birth Certificate, Good Moral, 2x2 photo)
- Test files: a real-looking Form 138, a birth certificate, **a photo of a cat**, and a grade report with a page missing
- Push notifications enabled on both devices; the Gemini key and functions deployed

| # | Who | Step | What to point out | Time |
|---|---|---|---|---|
| 1 | Student | Sign in (or show biometric unlock) → onboarding profile | One profile reused for every application | 0:45 |
| 2 | Student | Home → "Recommended for you" → open the recommendations list | Match % and AI reasons ("closely related to what you want to study") | 0:45 |
| 3 | Student | Explore → open a college → programs and requirements → **Apply** | Requirements come from the college's own builder | 0:30 |
| 4 | Student | Turn on **airplane mode** → fill the wizard → scan a document | Saved on device; syncs when back online | 0:45 |
| 5 | Student | Back online → upload the **cat photo** as the Birth Certificate | AI flags it as "this may be the wrong file", with a reason; push notification arrives | 0:45 |
| 6 | Student | Replace it with the correct file; upload the incomplete grade report | "Looks right" vs "Take a second look: final grades page missing" | 0:45 |
| 7 | Student | Write the essay → **Get AI feedback** | Prompt fit, strengths, improvements, grammar fixes | 0:45 |
| 8 | Student | Submit | Server checks for missing requirements; rep is notified | 0:20 |
| 9 | Rep | Review queue → open the applicant | AI fit score, AI flags, AI essay summary | 0:45 |
| 10 | Rep | Review documents: approve one, **request resubmission** on another | The student gets a push; status changes to "Action required" | 0:45 |
| 11 | Rep | Message the student → reply from the student phone | Real-time chat | 0:30 |
| 12 | Rep | Make the decision with **Hold for batch release** on; repeat for a second applicant | Students see nothing yet | 0:45 |
| 13 | Rep | Review queue → "decisions held" → **Release now** (or show scheduling) | Both students are notified at the same moment | 0:30 |
| 14 | Student | Open the notification → decision screen | "Admitted to …" with the college's message | 0:20 |
| 15 | Admin | Analytics → Broadcast an announcement → Compliance view | Platform oversight and tenant isolation | 0:45 |

Total: about 9.5 minutes. To fit a shorter slot, skip steps 4, 11 and 15.

Backup plan:
- Record a screen capture of the full flow in case of network or Wi-Fi problems
- If Gemini is rate-limited, show a document already checked earlier and explain the automatic retry
- Keep a pre-submitted applicant ready on the rep side in case the student-side steps run long

### Slide 14 — Results and Next Steps

- **Done:** the full student → rep → admin workflow, offline support, real-time messaging, push notifications, AI recommendations, scoring, document checks and essay feedback, batch release
- **Next:** **[fill in]**, for example a paid AI tier for data privacy, admin-wide release dates, antivirus scanning for attachments, iOS App Store and Google Play release, user testing with partner schools

### Slide 15 — Thank You / Q&A

- Repository, demo build QR code, contact **[fill in]**

---

## Appendix — Likely Panel Questions

| Question | Short answer |
|---|---|
| Can the AI reject a student? | No. AI output is advisory; reps approve, reject or request resubmission themselves. |
| How is student data protected? | Row-level security per role and college, private storage buckets, an audit log, account deletion (RA 10173). AI calls run server-side; the free Gemini tier may use data to improve Google's products, so a paid tier is planned before real deployment. |
| What happens offline? | Drafts and uploads save on the device and sync automatically; only final submission needs a connection. |
| Why hold decisions for batch release? | So every applicant to a college hears back at the same moment, which is fairer and removes timing advantages. |
| How do you stop AI cost or abuse? | Daily per-user AI limits, a fallback model, and automatic retries for temporary errors. |
