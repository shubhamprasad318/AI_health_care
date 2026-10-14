# AI Health Care Platform

A comprehensive AI-driven health platform that combines a **calibrated LightGBM model trained on the DDXPlus benchmark** (NeurIPS 2022) for differential disease prediction with **Google Gemini AI** for clinical reasoning, medical-report analysis, and voice consultations. Built as a full-stack web application with a FastAPI backend, React frontend, and a dedicated LiveKit voice agent.

> ⚕️ **Medical disclaimer.** This platform is for educational and informational purposes only. It is not a diagnosis, treatment plan, or substitute for in-person medical evaluation. Always consult a qualified healthcare provider for medical decisions. For emergencies, call your local emergency number (112 / 911).

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Disease Prediction Model — Why This Choice](#disease-prediction-model--why-this-choice)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Citation & Attribution](#citation--attribution)

---

## Overview

The platform offers 20+ feature modules across four runtime processes:

| Process | Role |
|---|---|
| **Backend** (FastAPI + MongoDB) | Auth, ML inference, REST + WebSocket APIs, Gemini orchestration |
| **Frontend** (React + Vite + Tailwind) | PWA UI, 21 lazy-loaded pages, real-time notifications |
| **LiveKit Voice Agent** (Python) | Standalone process running the Dr. AI voice consultation |
| **Training** (Python, optional) | Reproducible LightGBM training pipeline on DDXPlus |

Disease prediction is backed by a calibrated LightGBM classifier trained on the **DDXPlus dataset** (~1.16M synthetic patient records, 49 pathologies, ~223 evidences with binary + categorical + multi-choice types), achieving **99.74% top-1 / 100% top-3 accuracy** (~97% top-3 from just 3 symptoms) on a 116K held-out test set in **a few milliseconds**. See the [model design notes](#disease-prediction-model--why-this-choice) for the rationale.

---

## Key Features

### AI & Machine Learning

- **Differential Disease Prediction** — Calibrated LightGBM returns a ranked **top-5 differential diagnosis** with calibrated probabilities and ICD-10 codes. Inputs: any number of symptoms and antecedents (binary, categorical, multi-choice) plus optional age and sex. Frontend renders the top prediction with a confidence bar, every diagnosis with a layperson-explanation tooltip, and the full differential.
- **AI-Enhanced Clinical Assessment** — Toggle-gated Gemini analysis adds pathophysiology, differential diagnoses to consider, red flags, expected clinical course, recommended workup, and questions to ask a physician.
- **AI Health Chat** — Streaming and non-streaming Gemini chatbot widget available on every page.
- **Symptom Analyzer** — Triage classification (Emergency / Urgent / Routine / Self-care) with structured clinical assessment.
- **Drug Interaction Checker** — Pharmacological analysis between 2+ medications with severity classification, autocomplete suggestions, jsPDF export, and localStorage save (quota-aware).
- **Medical Term Explainer** — Plain-language explanations of clinical terminology with medical accuracy preserved.
- **Personalized Health Plans** — 4-week hybrid plans synthesizing ML prediction + uploaded report data + user profile.
- **Voice-to-Text Symptom Search** — Hands-free symptom search via the Web Speech API; spoken phrases populate the live filter over the evidence catalog (`GET /predict/evidences`).
- **Multi-Model Fallback** — Gemini service auto-falls-back across `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite` per request.

### Virtual Doctor (Voice AI)

- **AI Voice Consultation** — Real-time bidirectional voice with Dr. AI powered by **LiveKit Agents + Gemini 2.5 Flash realtime audio**.
- **Pre-loaded Patient Chart** — Agent receives sanitized patient context (profile, recent diagnoses, active medications, journal, appointments, family history) at session start.
- **Voice Activity Detection** — Silero VAD for accurate turn-taking.
- **Persisted Consultations** — Every voice call is recorded as a `db.consultations` document. The agent subscribes to LiveKit's `conversation_item_added` event to capture finalized turns into an in-memory transcript, then POSTs to the backend on disconnect via `ctx.add_shutdown_callback`. The backend asks Gemini to extract a structured summary (chief_complaint, symptoms_mentioned, conditions_discussed, recommendations, red_flags, follow_up_advised).
- **Medical Safety Guardrails** — Hard-coded refusal to prescribe controlled substances, explicit emergency-call escalation prompts, allergy + medication-interaction cross-checks against the patient's chart.

### Medical Reports & Files

- **Medical Report Upload** — PDF and image uploads with file-type and size validation.
- **AI Report Analysis** — Automatic Gemini analysis on upload extracts risk levels, summary, key findings, abnormal values, and recommendations.
- **Report Management** — List, view, analyze, and delete uploaded reports from the profile page.
- **PDF Health Report** — Server-side ReportLab PDF aggregating profile, predictions, appointments, medications, medication logs, and journal entries.

### Health Monitoring & Dashboard

- **Health Dashboard** — BMI, blood pressure, and health score metrics with color-coded indicators.
- **Dashboard Statistics** — Counts and trends across predictions, appointments, uploaded reports.
- **Health Metrics** — BMI auto-calculation, blood pressure analysis, height/weight tracking.
- **Prediction History** — Full history with statistics, detail modal showing the stored differential with probabilities and ICD-10 codes.
- **Health Score Gamification** — 14 badges, XP/levels (Beginner → Health Champion), streak tracking, rotating weekly health tips.

### Medication Tracker

- Full CRUD for medications (name, dosage, frequency, time slots, date range, notes, reminders).
- Take/skip logging with timestamps.
- Adherence statistics (active count, total taken, total skipped, percentage).
- Soft delete preserves history.

### Symptom Timeline & Health Journal

- **Unified Health Timeline** — Aggregates **5 event sources** (predictions, appointments, medication logs, journal entries, voice consultations) into a chronological timeline with date grouping, type filtering, and 7–365 day range.
- **Health Journal** — CRUD entries with title, content, mood, pain level (0–10), symptoms, tags.

### Family & Dependent Profiles

- CRUD for up to 10 family profiles per account.
- Relationship types: spouse, child, parent, sibling, grandparent, other.
- Per-member medical data: allergies, conditions, medications, blood type, age, gender.
- Per-member health summary endpoint.

### Appointments

- **Doctor Directory** — Browse with filters (specialization, city, search, min rating, sort), paginated, admin-only seeding.
- **Doctor Reviews** — 1–5 star rating + comment, one review per user per doctor, auto-calculated average via MongoDB aggregation.
- **Booking & Cancellation** — With automatic email notifications (Gmail SMTP via `aiosmtplib`).
- **Appointment Calendar** — Monthly grid with appointment dots, day detail panel, list-view toggle.

### Real-time Notifications

- Persistent WebSocket connection per authenticated user.
- Automatic reconnection with exponential backoff (max 5 attempts).
- Notification bell with unread badge.
- REST endpoints for list / mark read / mark all read / delete.

### Data Export

- **CSV Export** per data type (predictions, appointments, medications, journal, family).
- **FHIR R4 Bundle** with Patient, Condition, Encounter, MedicationStatement, Observation, RelatedPerson resources.
- **Export Summary** previewing record counts.

### User Management

- **JWT Authentication** with HTTP-only cookies (Bearer header fallback) and explicit `verify_exp` + `verify_signature` JWT decoding.
- **Two-Factor Authentication (2FA)** — TOTP via `pyotp`, QR-code setup, 6-digit OTP, 8 single-use recovery codes, enable/disable toggle.
- **bcrypt password hashing** with explicit `rounds=12`.
- **Welcome emails** on registration.
- **Cookie-based AuthContext** with route guards (ProtectedRoute / PublicRoute).

### Admin Dashboard

- Platform-wide statistics across collections; 30-day activity trends; 7-day active users; 2FA adoption rate.
- User management with search, pagination, detailed profiles with activity stats, cascade-delete across 12 collections.
- System health check (DB connectivity, ML model status, Gemini availability, per-collection counts).
- Recent activity feed.
- All admin endpoints guarded by `ADMIN_EMAIL` env variable.

### Content & Communication

- **Health Articles** with search and category filtering (links to Healthline, WebMD, Mayo Clinic, CDC, MedlinePlus, WHO).
- **Contact Form** with email confirmation; admin-only review endpoints.

### UI / UX

- **Dark Mode** — Class-based toggle, system preference detection, localStorage persistence.
- **Multi-language (i18n)** — English + Hindi via i18next with browser language detection.
- **Responsive Design** — Tailwind responsive layout.
- **Glassmorphism** — Backdrop-blur effects with enhanced dark-mode variants.
- **Animations** — Framer Motion page transitions, intersection-observer scroll animations.
- **Toast Notifications** — Theme-aware `react-toastify`.
- **Markdown Rendering** — `react-markdown` for AI-generated content.
- **Lazy Loading** — Code-split pages with React lazy.
- **Error Boundary** — Class-based ErrorBoundary wrapping all lazy routes.
- **PWA** — `vite-plugin-pwa` with Workbox runtime caching.
- **Accessibility** — ARIA attributes on interactive elements, keyboard navigation, tooltips wired with focus-within for mobile.

### Security

- **Rate Limiting** — `slowapi` (default 100/minute) on all endpoints.
- **Security Headers** — `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, HSTS in production.
- **CSP** — `connect-src` permits dev backends; `frame-ancestors 'none'`.
- **CORS** — Strict configurable origin list (no wildcard with credentials).
- **SECRET_KEY** mandatory in production — application exits if missing.
- **`HTTPException` passthrough** — Status codes preserved through the global exception handler.
- **Prompt-injection defense** — Every user input sanitized (control chars, bidi overrides, markdown fences) before interpolation into Gemini prompts.
- **Patient-data sanitization** — LiveKit metadata fields sanitized before injection into the agent's system prompt.

---

## Architecture

```
                   ┌──────────────────────────────────────┐
                   │   Browser (React + Vite + Tailwind)  │
                   │   - 21 lazy-loaded pages             │
                   │   - PWA + ErrorBoundary              │
                   │   - WebSocket /ws/notifications      │
                   │   - LiveKit Voice Client             │
                   └──────────────────┬───────────────────┘
                                      │ HTTPS + WebSocket
                                      │
┌─────────────────────────────────────▼────────────────────────────┐
│                        FastAPI Backend                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐              │
│  │ auth/2fa   │  │ predict    │  │ gemini         │  ...20 routes│
│  │ require_   │  │ DDXPlus    │  │ chat/stream    │              │
│  │ auth + JWT │  │ LightGBM   │  │ symptom/drugs  │              │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────────┘              │
│        │               │                │                        │
│        ▼               ▼                ▼                        │
│  ┌────────────────────────────────────────────────────┐          │
│  │   MongoDB (Motor async)                            │          │
│  │   users, predictions, appointments, medications,   │          │
│  │   journal_entries, family_profiles, notifications, │          │
│  │   doctors, doctor_reviews, files, contacts,        │          │
│  │   chat_history, health_plans, consultations        │          │
│  └────────────────────────────────────────────────────┘          │
└───────────┬──────────────────────────────────────┬───────────────┘
            │ /livekit/token                       │ /consultations/{id}/summary
            │ (mints JWT, creates consultation)    │
            ▼                                      ▲
┌─────────────────────────────────────────────────┴────────────────┐
│              LiveKit Voice Agent (separate process)              │
│  - Joins room as "Dr. AI" participant                            │
│  - Receives sanitized patient chart in metadata                  │
│  - Gemini 2.5 Flash realtime audio (bidirectional voice)         │
│  - Silero VAD for turn-taking                                    │
│  - Subscribes to `conversation_item_added` events                │
│  - On disconnect: ctx.add_shutdown_callback posts the captured   │
│    transcript + duration back to the backend (httpx)             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Disease Prediction Model — Why This Choice

This section documents the rationale for the ML pipeline. The repo previously used a 3-model ensemble (Random Forest + GaussianNB + SVC) on a 4,920-row Kaggle dataset; this is what replaced it and why.

### Dataset: DDXPlus

- **Scale.** 1.29M synthetic patient records vs ~5K rows in the prior Kaggle dataset (260× more data).
- **Realism.** Each patient has age, sex, region, and travel history; evidences come in **binary, categorical, and multi-choice** types (110 symptoms + 113 antecedents). Prior datasets were binary-only.
- **Differential ground truth.** DDXPlus ships the full ranked differential diagnosis with probabilities per patient — matches how physicians actually reason instead of forcing a single guess.
- **Peer-reviewed.** NeurIPS 2022 Datasets & Benchmarks Track ([arXiv:2205.09148](https://arxiv.org/abs/2205.09148)).
- **License.** CC-BY 4.0 — production use allowed with attribution (see [citation](#citation--attribution) below).

### Model: Single Calibrated LightGBM

- **GBDT beats deep learning on tabular medical data.** Comprehensive 2024 benchmarks (Yıldız & Kalayci, *Gradient Boosting Decision Trees on Medical Diagnosis over Tabular Data*; Shmuel et al., *A Comprehensive Benchmark of Machine and Deep Learning Across Diverse Tabular Datasets*) confirm XGBoost / LightGBM / CatBoost outperform tabular deep-learning architectures (TabNet, TabTransformer, FT-Transformer, SAINT) **with ~100× less compute** on tabular medical classification.
- **One model beats the old 3-model ensemble.** A single tuned GBDT consistently matches or beats hand-built RF + NB + SVM hard-voting ensembles in every benchmark we reviewed, at ~50× faster inference and with one artifact to ship.
- **`GaussianNB` was the wrong family.** The previous `nb_model.pkl` assumed Gaussian-distributed features but symptoms are binary (Bernoulli). LightGBM subsumes the role correctly; we removed the Naive Bayes component instead of "fixing" it.
- **Calibrated probabilities.** The trained model is frozen and wrapped in `CalibratedClassifierCV(method="isotonic")`, fitted on a held-out calibration split, so `predict_proba` reflects actual posterior likelihood. This is what lets the UI honestly say "94% confidence" and produces a meaningful top-K differential whose probabilities sum to ~1.0.
- **Operational simplicity.** One `lgbm_model.pkl.gz` (~20 MB) + small JSON/PKL metadata replaces five inter-dependent files (RF + NB + SVM + data_dict + Doctor_Specialist). Easier to deploy, monitor, and retrain.

### Measured Results

- **99.74% Top-1 accuracy** on a 116K held-out test set (stratified split from DDXPlus) with full symptom answers.
- **Works from a few symptoms:** with only 3 symptoms entered, the right condition is in the top 3 for ~97% of test patients (top-1 ~83%). The model is trained on extra copies of patients reduced to 2-8 symptoms, because real users rarely answer 20 questions.
- **100.00% Top-3 accuracy** — the correct pathology is always in the top 3 candidates.
- **A few milliseconds per prediction** on a single CPU core, no GPU required.

### Considered but Rejected

| Alternative | Top-1 | Why not |
|---|---|---|
| DDxT (transformer on DDXPlus) | 99.98% | +0.3% accuracy at the cost of GPU inference and a more complex serving stack. |
| LoRA-tuned LLaMA-3 on DDXPlus | 99.94% | ~16 GB base model + ~500 ms latency. Wrong tradeoff for a self-hostable MVP. |
| Bio_ClinicalBERT on free-text symptoms | n/a | Lets users type symptoms in plain English, but the structured DDXPlus picker is more reliable and runs on CPU. Possible future direction. |
| Keep RF + NB + SVM, just retrain on DDXPlus | unknown | The ensemble architecture is dominated by GBDT in every published benchmark; retraining wouldn't have closed the gap. |

---

## Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Framer Motion, ReactMarkdown, react-toastify, jsPDF, LiveKit React SDK, i18next, react-i18next, Formik, Yup, react-select, react-icons.
- **Backend:** Python 3.10+, FastAPI, Uvicorn, slowapi (rate limiting).
- **AI / ML:** Google Gemini AI (`google-genai` SDK), **LightGBM** (calibrated multiclass classifier on DDXPlus), Scikit-learn (`CalibratedClassifierCV` for probability calibration).
- **Voice AI:** LiveKit Agents (Python), Gemini 2.5 Flash realtime audio, Silero VAD, httpx (consultation summary POST).
- **Voice Input (browser):** Web Speech API.
- **Database:** MongoDB (Motor async driver).
- **Authentication:** JWT (`python-jose`), bcrypt, HTTP-only cookies, `pyotp` + `qrcode` (2FA).
- **Email:** Gmail SMTP via `aiosmtplib` (async, non-blocking).
- **File Processing:** Pillow, PyPDF2, aiofiles.
- **PDF Generation:** ReportLab.
- **Real-time:** WebSocket (FastAPI native).
- **PWA:** vite-plugin-pwa, Workbox.
- **Data Validation:** Pydantic v2, email-validator.
- **Misc:** python-dotenv, pandas, numpy.

---

## Project Structure

```
AI_Health_Care/
├── backend/                        # FastAPI backend
│   ├── main.py                     # App entry, CORS, rate limiter, security headers, routers
│   ├── config/
│   │   └── settings.py             # Environment variables & configuration
│   ├── database/
│   │   ├── connection.py           # MongoDB (Motor) connection & indexes
│   │   └── models.py               # Pydantic data models (20+ models)
│   ├── routes/
│   │   ├── auth.py                 # Signup, login, logout, auth status
│   │   ├── two_factor.py           # 2FA setup, verify, disable, status
│   │   ├── gemini.py               # AI chat, streaming, symptom analysis, drugs, health plans
│   │   ├── prediction.py           # Disease prediction (standard & enhanced)
│   │   ├── profile.py              # User profile management
│   │   ├── appointments.py         # Appointment booking & management
│   │   ├── predictions_history.py  # Prediction history & statistics
│   │   ├── files.py                # File upload, analysis & management
│   │   ├── contact.py              # Contact form & admin management (RBAC)
│   │   ├── dashboard.py            # Health dashboard & metrics
│   │   ├── livekit_token.py        # LiveKit room token + agent dispatch + consultation creation
│   │   ├── consultations.py        # Voice consultation persistence (CRUD + summary endpoint)
│   │   ├── medications.py          # Medication CRUD, logging, adherence stats
│   │   ├── timeline.py             # Unified health timeline (5 event sources) & journal CRUD
│   │   ├── reports.py              # PDF report generation & summary
│   │   ├── family.py               # Family/dependent profile management
│   │   ├── notifications.py        # WebSocket notifications & REST CRUD
│   │   ├── doctors.py              # Doctor directory, reviews, admin seed
│   │   ├── gamification.py         # Badges, XP/levels, streaks, health tips
│   │   ├── export.py               # CSV & FHIR R4 data export
│   │   └── admin.py                # Admin dashboard, user mgmt, system health
│   ├── services/
│   │   ├── auth_service.py         # Authentication, JWT, cookie/header auth
│   │   ├── email_service.py        # Email notifications (Gmail SMTP via aiosmtplib)
│   │   ├── gemini_service.py       # Gemini AI integration (multi-model fallback + prompt-injection defense)
│   │   ├── consultation_service.py # Voice consultation transcript summarization (Gemini)
│   │   └── ml_service.py           # DDXPlus LightGBM loader, top-K differential, evidence catalog
│   ├── utils/
│   │   ├── helpers.py              # Utility functions
│   │   └── security.py             # Security utilities (require_auth, JWT, bcrypt)
│   ├── models/                     # DDXPlus model artifacts: lgbm_model.pkl.gz, feature_map.pkl,
│   │                               # label_map.pkl, release_{evidences,conditions}.json
│   └── requirements.txt
├── frontend/                       # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/             # Reusable UI components (NavBar, NotificationBell, VoiceInput,
│   │   │                           # DoctorCard, Chatbox, ErrorBoundary, etc.)
│   │   ├── pages/                  # 21 lazy-loaded route pages
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Cookie-based auth state management
│   │   │   ├── ThemeContext.jsx    # Dark mode toggle & persistence
│   │   │   └── NotificationContext.jsx # WebSocket notification management
│   │   ├── i18n/
│   │   │   ├── i18n.js             # i18next configuration
│   │   │   ├── en.json             # English translations
│   │   │   └── hi.json             # Hindi translations
│   │   ├── utils/
│   │   │   └── api.js              # Centralized API layer (15+ namespaces, AbortController support)
│   │   ├── App.jsx                 # Router, ErrorBoundary, layout
│   │   └── main.jsx                # Entry point with providers
│   ├── tailwind.config.js          # Custom colors, dark mode, animations
│   ├── index.html                  # PWA meta tags + Content Security Policy
│   └── vite.config.js              # Vite + PWA plugin config
├── livekit-agent/                  # LiveKit Voice Agent (separate service)
│   ├── agent.py                    # Voice agent with Gemini realtime audio + consultation save hook
│   ├── requirements.txt            # Agent-specific Python dependencies (incl. httpx)
│   ├── Dockerfile                  # Multi-stage container image for LiveKit Cloud
│   ├── livekit.toml                # LiveKit Cloud deployment config
│   └── .env.example                # Required environment variables
├── training/                       # Disease prediction model training (see training/README.md)
│   ├── setup_model.sh              # One command: venv + install + download + train
│   ├── train.py                    # Downloads DDXPlus, trains calibrated LightGBM,
│   │                               # writes artifacts to backend/models/
│   ├── download_dataset.py         # Downloads and caches DDXPlus only
│   ├── requirements.txt            # datasets, lightgbm, scikit-learn, pandas, numpy
│   └── README.md                   # Requirements, steps, troubleshooting
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- Gmail account with App Password (for email notifications)
- LiveKit Cloud account or self-hosted LiveKit server (for Virtual Doctor)
- **macOS only:** `brew install libomp` (required by LightGBM)

### Backend Setup

```bash
git clone <repo-url>
cd AI_Health_Care/backend

python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Configure .env (see Environment Variables below)
cp .env.example .env  # if available, or create from scratch
$EDITOR .env

python main.py                       # API at http://localhost:8000
```

### Training the Disease Prediction Model (optional)

The repo ships a trained model as `backend/models/lgbm_model.pkl.gz` (~20 MB gzipped), so prediction works right after cloning. To retrain from scratch:

```bash
bash training/setup_model.sh --force
```

This creates a virtual environment in `training/`, downloads the DDXPlus dataset from Hugging Face (~1 GB, cached), trains a calibrated LightGBM classifier (about 10 minutes), prints Top-1 / Top-3 / Top-5 accuracy on a 116K held-out test set (expect ~99.7% Top-1) and writes the model files to `backend/models/`. Restart the backend to pick up the model.

Use `--force` to retrain or `--download-only` to just fetch the dataset. For manual steps (e.g. on Windows), hardware requirements and troubleshooting, see [`training/README.md`](training/README.md).

### LiveKit Voice Agent Setup

```bash
cd AI_Health_Care/livekit-agent

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# Configure .env (see livekit-agent/.env.example)
$EDITOR .env

python agent.py console               # Run locally
# OR deploy to LiveKit Cloud (1,000 free minutes/month):
#   lk cloud auth
#   lk project set-default "<your-project>"
#   lk agent create
#   lk agent update-secrets --secrets-file .env
```

### Frontend Setup

```bash
cd AI_Health_Care/frontend

npm install
npm run dev                           # http://localhost:5173
npm run build                         # production build with PWA service worker
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
MONGO_URI=your_mongodb_connection_string
MONGO_DBNAME=helloai

# Security (MANDATORY in production — app will exit without it)
SECRET_KEY=your_secret_key
ENV=development                       # set to "production" for secure cookies & HSTS

# AI
GEMINI_API_KEY=your_gemini_api_key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (Gmail SMTP)
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM_NAME=AI Health Care

# Email over HTTPS (use instead of SMTP on hosts that block it, e.g. Render free tier)
RESEND_API_KEY=
RESEND_FROM=AI HealthEngine <noreply@yourdomain.com>

# Admin RBAC
ADMIN_EMAIL=your_admin_email@example.com

# LiveKit (for Virtual Doctor)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Public URL the LiveKit agent will use to POST consultation summaries back
# In dev this matches your backend; in prod set it to the public backend URL.
BACKEND_PUBLIC_URL=http://localhost:8000
```

### LiveKit Agent (`livekit-agent/.env`)

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
GOOGLE_API_KEY=your_gemini_api_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

> ⚠️ Use `http://localhost:8000`, not `http://0.0.0.0:8000` — Chrome treats `0.0.0.0` as a separate origin and will refuse to send cookies or open WebSockets to it.

---

## Deployment

The repo includes a Render Blueprint (`render.yaml`) that deploys the backend and frontend on Render's free tier, with MongoDB Atlas for the database. See **[DEPLOY.md](DEPLOY.md)** for step-by-step setup, the environment variables to fill in, free-tier limits and troubleshooting.

---

## Usage Guide

1. **Sign up / log in.** Optionally enable 2FA from `/security`.
2. **Predict.** Open `/predict` → search the evidence catalog (symptoms + medical history) → optionally enter age/sex (auto-filled from profile if blank) → check **Enhanced AI Analysis** for Gemini's clinical write-up → submit. View ranked top-5 differential with confidence bars, ICD-10 codes, and plain-language tooltips on each clinical name.
3. **AI Health Chat.** Use the floating chatbot widget on every page for real-time consultations.
4. **Health Tools.** Symptom Analyzer (triage), Drug Interaction Checker (with PDF export), Health Plan Generator (4-week plans).
5. **Medical Reports.** Upload from `/profile` → Gemini auto-analyzes → see risk level, key findings, abnormal values, recommendations.
6. **Medications.** Track daily medications, log take/skip, monitor adherence.
7. **Health Timeline.** `/timeline` aggregates predictions, appointments, medication logs, journal entries, and voice consultations chronologically.
8. **Voice Consultation.** `/virtual-doctor` → start a call with Dr. AI. Speak naturally — the agent has reviewed your chart. End the call to see "Consultation saved" — full transcript + structured summary lands in your Timeline.
9. **Appointments.** Search the Doctor Directory, book, view on Calendar.
10. **Family Profiles.** `/family` — add up to 10 dependents.
11. **Achievements.** `/achievements` — earn badges, track streaks.
12. **Export Data.** `/export` — CSV per category, FHIR R4 bundle.
13. **Dark Mode & Language.** Sun/moon toggle + language toggle in navbar.
14. **Admin.** `/admin` — platform stats, user mgmt, system health.

---

## Citation & Attribution

The disease prediction model is trained on the **DDXPlus dataset**, released under the **Creative Commons Attribution 4.0 International (CC-BY-4.0)** license. If you use this model, its training script, or DDXPlus directly, please cite:

> Tchango, A. F., Goel, R., Wen, Z., Martel, J., & Ghosn, J. (2022).
> **DDXPlus: A New Dataset For Automatic Medical Diagnosis.**
> *Advances in Neural Information Processing Systems 35* (NeurIPS Datasets & Benchmarks Track).
> [arXiv:2205.09148](https://arxiv.org/abs/2205.09148) · [GitHub](https://github.com/mila-iqia/ddxplus)

ICD-10 codes are sourced from the same dataset.

---

*Built with ❤️ for accessible, evidence-based health information.*
