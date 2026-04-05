# **AI Health Care Platform**

## **Project Overview**

The **AI Health Care Platform** is a comprehensive health application that predicts diseases based on symptoms, provides AI-powered medical assistance, and manages health records. It uses machine learning models (**Random Forest**, **Naive Bayes**, **SVM**) for disease prediction and integrates **Google Gemini AI** for intelligent health consultations, medical report analysis, drug interaction checks, and personalized health plans.

The platform includes 15+ feature modules: medication tracking, health journaling, PDF report generation, family profiles, real-time notifications, doctor directory with reviews, appointment calendar, gamification, dark mode, data export (CSV/FHIR), two-factor authentication, admin dashboard, voice-to-text symptom input, and offline PWA support.

The backend is built with **FastAPI** (async) and connects to **MongoDB** via the **Motor** async driver. The frontend is built with **React 18** + **Vite 5** + **Tailwind CSS 3** with full dark mode support and multi-language (i18n) capabilities.

## **Features**

### AI & Machine Learning

* **Disease Prediction** — Ensemble ML prediction (Random Forest, Naive Bayes, SVM) with majority voting. Select up to 3 symptoms and get disease name, description, precautions, and specialist recommendation.
* **Enhanced AI Prediction** — ML prediction augmented with Gemini AI analysis for deeper insights, markdown-rendered results (PRO feature).
* **AI Health Chat** — Gemini AI-powered chatbot with both standard and streaming response modes for real-time medical consultations. Available as a global floating widget on every page.
* **Symptom Analyzer** — Gemini-powered symptom analysis with detailed explanations and recommendations.
* **Drug Interaction Checker** — Check interactions between 2+ medications with severity indicators, autocomplete suggestions, PDF export (jspdf), and save-to-profile functionality.
* **Medical Term Explainer** — Plain-language explanations of complex medical terminology via `/gemini/medical/explain/{term}`.
* **Personalized Health Plans** — AI-generated 4-week health plans tailored to user profile and medical history, with print support.
* **Voice-to-Text Symptom Input** — Hands-free symptom entry using the Web Speech API. Spoken words are fuzzy-matched against the 152-symptom list and auto-filled into the prediction form.
* **Multi-Model Fallback** — Gemini service automatically falls back across 3 Gemini models (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`) for high availability.

### Medical Reports & Files

* **Medical Report Upload** — Upload PDF and image medical reports with file type/size validation.
* **AI Report Analysis** — Automatic Gemini AI analysis on upload, extracting risk levels, summary, key findings, abnormal values, and recommendations.
* **Report Management** — List, view, analyze, and delete uploaded medical reports from the profile page.
* **Report Analysis Modal** — Detailed view of analysis results with risk level indicators.
* **PDF Health Report Generation** — Server-side PDF generation via ReportLab aggregating data from 6 collections (profile, predictions, appointments, medications, medication logs, journal entries). Includes patient info, health metrics, active medications with adherence stats, disease predictions, appointments, and journal entries with medical disclaimer.

### Health Monitoring & Dashboard

* **Health Dashboard** — Centralized dashboard with BMI, blood pressure, and health score metrics with color-coded indicators.
* **Dashboard Statistics** — Total predictions, appointments, uploaded reports, recent predictions, upcoming appointments, and most common health issue.
* **Health Metrics** — BMI auto-calculation, blood pressure analysis, height/weight tracking via `/health/metrics`.
* **Prediction History** — Full history of past predictions with statistics (total count, most common disease, recent activity) and detail modal showing individual model scores (RF/NB/SVM).
* **Quick Actions** — Dashboard shortcuts to predict disease, book appointment, upload report, and access health tools.
* **Health Score Gamification** — 14 achievable badges (first prediction, streak milestones, medication adherence, profile completion, etc.), XP/level system (6 levels from Beginner to Health Champion), consecutive week streak tracking, and rotating weekly health tips.

### Medication Tracker

* **Medication Management** — Full CRUD for medications with name, dosage, frequency (daily/twice daily/thrice daily/weekly/as needed), time slots, date range, notes, and reminder toggle.
* **Medication Logging** — Quick take/skip logging per medication with timestamps.
* **Adherence Statistics** — Track active count, total taken, total skipped, and adherence percentage.
* **Soft Delete** — Medications are deactivated rather than permanently deleted, preserving history.

### Symptom Timeline & Health Journal

* **Unified Health Timeline** — Aggregates 4 event sources (predictions, appointments, medication logs, journal entries) into a chronological timeline with date grouping, type filtering, and configurable date range (7-365 days).
* **Health Journal** — CRUD for journal entries with title, content, mood (great/good/okay/bad/terrible), pain level (0-10), symptoms, and tags.
* **Severity Mapping** — Automatic severity classification for predictions and moods with color-coded indicators.

### Family & Dependent Profiles

* **Family Profile Management** — CRUD for up to 10 family member profiles per account.
* **Relationship Types** — Spouse, child, parent, sibling, grandparent, other.
* **Medical Information** — Track allergies, conditions, medications, blood type, age, and gender per family member.
* **Health Summary** — Per-member summary endpoint for quick overview.

### Appointments

* **Doctor Directory** — Browse doctors with filters (specialization, city, search, min rating, sort by) and paginated results. Admin-only doctor creation and seed endpoint with 10 pre-populated doctors.
* **Doctor Reviews** — Star rating (1-5) and comment system, one review per user per doctor, auto-calculated average ratings via MongoDB aggregation pipeline.
* **Appointment Booking** — Book appointments with doctors, with email confirmation sent automatically.
* **Appointment Management** — View upcoming appointments and cancel with email notification.
* **Appointment Calendar** — Monthly calendar grid with appointment dots (color-coded by status), day detail panel, list view toggle, and appointment detail modal with cancel support.

### Real-time Notifications

* **WebSocket Notifications** — Persistent WebSocket connection per authenticated user with automatic reconnection (exponential backoff, max 5 attempts).
* **Notification Bell** — In-app notification bell with unread count badge, dropdown panel, and mark-read support.
* **Notification Types** — info, success, warning, error, appointment, prediction, medication.
* **REST Endpoints** — List, mark read, mark all read, and delete notifications.

### Data Export

* **CSV Export** — Download CSV files per data type (predictions, appointments, medications, journal entries, family profiles) for any time period.
* **FHIR R4 Export** — Export health data as a FHIR R4 Transaction Bundle with Patient, Condition, Encounter, MedicationStatement, Observation, and RelatedPerson resources.
* **Export Summary** — Preview record counts before downloading.

### User Management

* **User Authentication** — JWT-based auth with HTTP-only secure cookies. Signup, login, logout, and auth status check.
* **Two-Factor Authentication (2FA)** — TOTP-based 2FA via pyotp with QR code setup, 6-digit OTP verification, 8 single-use recovery codes, and enable/disable toggle.
* **Welcome Emails** — Automated welcome email on registration via Gmail SMTP.
* **User Profile** — View and edit profile with health metrics (BMI, blood pressure, height, weight), profile picture update, language preference, and health plan integration.
* **Protected Routes** — Frontend route guards (ProtectedRoute/PublicRoute) with AuthContext managing login state via cookie-based authentication.

### Admin Dashboard

* **Platform Statistics** — Overview counts across 9 collections, 30-day activity trends, 7-day active users, 2FA adoption rate.
* **User Management** — Search users by name/email, paginated list, detailed user profiles with activity stats, cascade delete (removes user data from 12 collections).
* **System Health** — Database connectivity, ML model status, Gemini availability, per-collection document counts.
* **Activity Feed** — Recent platform activity aggregating predictions, appointments, and signups.
* **Admin Guard** — All admin endpoints require `ADMIN_EMAIL` match with RBAC enforcement.

### Content & Communication

* **Health Articles** — Browse health articles with search and category filtering (Wellness, Mental Health, Cardiology, Diabetes, Nutrition, Sleep, Fitness, Women's Health). Links to external resources (Healthline, WebMD, Mayo Clinic).
* **Contact Form** — Submit inquiries with email confirmation. Admin-only endpoints for viewing and managing submissions with RBAC guard.
* **Email Notifications** — Automated emails for registration, appointment confirmation, appointment cancellation, and contact form submissions via Gmail SMTP.

### Virtual Doctor (Voice AI)

* **AI Voice Consultation** — Real-time voice-based medical consultations powered by LiveKit + Gemini 2.5 Flash native audio. Talk to an AI doctor naturally with voice input/output.
* **Voice Activity Detection** — Silero VAD for accurate speech detection and natural turn-taking during conversations.
* **Session Management** — Secure room-based sessions with JWT-authenticated token generation. Each consultation gets a unique room.
* **Consultation UI** — Full consultation flow with pre-call info screen, animated in-call interface (pulsing visuals, session timer, mute control), and post-call summary.
* **Medical Safety Guardrails** — AI doctor provides health guidance but recommends real doctors for serious concerns, with emergency awareness built into the system prompt.

### UI/UX

* **Dark Mode** — Full dark mode support across all 21+ pages and components. Class-based toggle (`darkMode: "class"`) with ThemeContext, system preference detection, and localStorage persistence. Sun/moon toggle in navbar.
* **Multi-language Support (i18n)** — English and Hindi translations via i18next with browser language detection. Language toggle in navbar. User language preference stored in profile.
* **Responsive Design** — Tailwind CSS responsive layout across all devices.
* **Glassmorphism** — Backdrop-blur glass effects on navbar, cards, and overlays with enhanced dark mode variants.
* **Animations** — Framer Motion page transitions and intersection observer scroll animations.
* **Toast Notifications** — Real-time feedback via react-toastify with theme-aware styling.
* **Markdown Rendering** — ReactMarkdown for AI-generated content display with dark mode prose support.
* **Lazy Loading** — Code-split pages with React lazy loading for performance.
* **Error Boundary** — React class-based ErrorBoundary wrapping all lazy routes with reload recovery UI.
* **SVG Progress Circles** — Custom health metric visualizations without external chart libraries.
* **Offline PWA Support** — Service worker via vite-plugin-pwa with workbox caching (NetworkFirst for API, StaleWhileRevalidate for fonts, CacheFirst for static assets). Installable as a Progressive Web App.
* **Accessibility** — ARIA attributes on interactive elements (navbar menu toggle with aria-expanded, aria-controls, role="menu").

### Security Features

* **Rate Limiting** — slowapi with configurable limits (default 100/minute) on all endpoints.
* **Security Headers** — Middleware adding X-Content-Type-Options (nosniff), X-Frame-Options (DENY), X-XSS-Protection, Referrer-Policy (strict-origin-when-cross-origin), and HSTS in production.
* **HTTP-Only Secure Cookies** — JWT stored in HTTP-only cookies with Secure flag in production.
* **Two-Factor Authentication** — TOTP-based 2FA with recovery codes.
* **Admin RBAC** — Admin endpoints guarded by email-based role check.
* **CORS** — Configurable allowed origins via environment variable.
* **Mandatory SECRET_KEY** — Application exits in production if SECRET_KEY is not set.

## **Technologies Used**

* **Frontend**: React 18, Vite 5, Tailwind CSS 3, JavaScript, Framer Motion, ReactMarkdown, react-toastify, jspdf, LiveKit React SDK, i18next, react-i18next, Formik, Yup, react-select, react-icons
* **Backend**: Python, FastAPI, Uvicorn, slowapi (rate limiting)
* **AI/ML**: Google Gemini AI (google-genai SDK), Scikit-learn (Random Forest, Naive Bayes, SVM)
* **Voice AI**: LiveKit Agents, Gemini 2.5 Flash Realtime Audio, Silero VAD
* **Voice Input**: Web Speech API (browser-native)
* **Database**: MongoDB (Motor async driver)
* **Authentication**: JWT (python-jose), bcrypt, HTTP-only cookies, pyotp + qrcode (2FA)
* **Email**: Gmail SMTP (smtplib + email.mime)
* **File Processing**: Pillow, PyPDF2, aiofiles
* **PDF Generation**: ReportLab
* **Real-time**: WebSocket (FastAPI native)
* **PWA**: vite-plugin-pwa, Workbox
* **Data Validation**: Pydantic, email-validator
* **Other**: python-dotenv, pandas, numpy

## **Project Structure**

```
AI_Health_Care/
├── backend/                        # FastAPI backend
│   ├── main.py                     # App entry, CORS, rate limiter, security headers, routers
│   ├── config/
│   │   └── settings.py             # Environment variables & configuration
│   ├── database/
│   │   ├── connection.py           # MongoDB (Motor) connection & indexes
│   │   └── models.py              # Pydantic data models (20+ models)
│   ├── routes/
│   │   ├── auth.py                 # Signup, login, logout, auth status
│   │   ├── two_factor.py          # 2FA setup, verify, disable, status
│   │   ├── gemini.py              # AI chat, streaming, symptom analysis, drugs, health plans
│   │   ├── prediction.py          # Disease prediction (standard & enhanced)
│   │   ├── profile.py             # User profile management
│   │   ├── appointments.py        # Appointment booking & management
│   │   ├── predictions_history.py # Prediction history & statistics
│   │   ├── files.py               # File upload, analysis & management
│   │   ├── contact.py             # Contact form & admin management (RBAC)
│   │   ├── dashboard.py           # Health dashboard & metrics
│   │   ├── livekit_token.py       # LiveKit room token generation
│   │   ├── medications.py         # Medication CRUD, logging, adherence stats
│   │   ├── timeline.py            # Unified health timeline & journal CRUD
│   │   ├── reports.py             # PDF report generation & summary
│   │   ├── family.py              # Family/dependent profile management
│   │   ├── notifications.py       # WebSocket notifications & REST CRUD
│   │   ├── doctors.py             # Doctor directory, reviews, admin seed
│   │   ├── gamification.py        # Badges, XP/levels, streaks, health tips
│   │   ├── export.py              # CSV & FHIR R4 data export
│   │   └── admin.py               # Admin dashboard, user mgmt, system health
│   ├── services/
│   │   ├── auth_service.py        # Authentication, JWT, cookie/header auth
│   │   ├── email_service.py       # Email notifications (Gmail SMTP)
│   │   ├── gemini_service.py      # Gemini AI integration (multi-model fallback)
│   │   └── ml_service.py          # ML model loading & ensemble prediction
│   ├── utils/
│   │   ├── helpers.py             # Utility functions
│   │   ├── security.py            # Security utilities (require_auth)
│   │   └── validators.py          # Input validation
│   ├── models/                    # ML model files (.pkl) & data (.csv)
│   └── requirements.txt
├── frontend/                      # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── NavBar.jsx         # Navigation with dark mode & language toggles
│   │   │   ├── NotificationBell.jsx # Real-time notification dropdown
│   │   │   ├── VoiceInput.jsx     # Web Speech API voice input component
│   │   │   ├── DoctorCard.jsx     # Doctor card with booking modal
│   │   │   ├── Chatbox.jsx        # AI chat floating widget
│   │   │   └── ...                # 20+ components
│   │   ├── pages/                 # Route pages (21 pages, all lazy-loaded)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Cookie-based auth state management
│   │   │   ├── ThemeContext.jsx   # Dark mode toggle & persistence
│   │   │   └── NotificationContext.jsx # WebSocket notification management
│   │   ├── i18n/
│   │   │   ├── i18n.js           # i18next configuration
│   │   │   ├── en.json           # English translations
│   │   │   └── hi.json           # Hindi translations
│   │   ├── utils/
│   │   │   └── api.js            # Centralized API layer (15+ namespaces)
│   │   ├── App.jsx                # Router, ErrorBoundary, layout
│   │   └── main.jsx              # Entry point with providers
│   ├── tailwind.config.js         # Custom colors, dark mode, animations
│   ├── index.html                 # PWA meta tags
│   └── vite.config.js             # Vite + PWA plugin config
├── livekit-agent/                 # LiveKit Voice Agent (separate service)
│   ├── agent.py                   # Voice agent with Gemini realtime audio
│   ├── requirements.txt           # Agent-specific Python dependencies
│   ├── Dockerfile                 # Container image for LiveKit Cloud
│   ├── livekit.toml               # LiveKit Cloud deployment config
│   └── .env.example               # Required environment variables
├── .gitignore                     # Excludes .env, __pycache__, node_modules, .pkl, uploads
└── README.md
```

## **API Endpoints**

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/status` | Check authentication status |
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login user (returns 2FA challenge if enabled) |
| POST | `/auth/logout` | Logout user |

### Two-Factor Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/2fa/setup` | Generate TOTP secret & QR code |
| POST | `/auth/2fa/verify-setup` | Verify OTP & enable 2FA |
| POST | `/auth/2fa/verify-login` | Verify OTP/recovery code during login |
| POST | `/auth/2fa/disable` | Disable 2FA (requires OTP) |
| GET | `/auth/2fa/status` | Check 2FA enabled status |

### Gemini AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/gemini/chat` | AI health chat (non-streaming) |
| POST | `/gemini/chat/stream` | AI health chat (streaming) |
| GET | `/gemini/medical/explain/{term}` | Explain medical terminology |
| POST | `/gemini/symptom/analyze` | AI symptom analysis |
| POST | `/gemini/drugs/interactions` | Drug interaction check (2+ medications) |
| POST | `/gemini/health/personalized-plan` | Generate personalized health plan |
| GET | `/gemini/status` | Gemini service health check |

### Disease Prediction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/disease` | Ensemble ML disease prediction |
| POST | `/predict/enhanced` | ML + Gemini AI enhanced prediction |

### Health Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/dashboard` | Comprehensive user dashboard |
| GET | `/health/metrics` | BMI, blood pressure analysis |

### Prediction History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/predictions/history` | Get prediction history |
| GET | `/predictions/statistics` | Get prediction statistics |

### Medications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/medications` | Create medication |
| GET | `/medications` | List medications (filter by active) |
| GET | `/medications/{id}` | Get medication detail |
| PATCH | `/medications/{id}` | Update medication |
| DELETE | `/medications/{id}` | Soft-delete medication |
| POST | `/medications/log` | Log take/skip action |
| GET | `/medications/{id}/logs` | Get medication logs |
| GET | `/medications/adherence/stats` | Get adherence statistics |

### Health Timeline & Journal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/timeline` | Unified health timeline (days, event_type, limit params) |
| POST | `/timeline/journal` | Create journal entry |
| GET | `/timeline/journal` | List journal entries |
| PATCH | `/timeline/journal/{id}` | Update journal entry |
| DELETE | `/timeline/journal/{id}` | Delete journal entry |

### Health Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/generate` | Generate & download PDF health report |
| GET | `/reports/summary` | Get report data preview (JSON) |

### Family Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/family` | Create family member (max 10) |
| GET | `/family` | List family members |
| GET | `/family/{id}` | Get family member detail |
| PATCH | `/family/{id}` | Update family member |
| DELETE | `/family/{id}` | Delete family member |
| GET | `/family/{id}/summary` | Get family member health summary |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/appointments/book` | Book an appointment |
| GET | `/appointments` | Get user appointments |
| DELETE | `/appointments/{id}` | Cancel an appointment |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctors` | List doctors (filters: specialization, city, search, min_rating, sort_by) |
| GET | `/doctors/specializations` | List available specializations |
| GET | `/doctors/cities` | List available cities |
| GET | `/doctors/{id}` | Get doctor detail with reviews |
| POST | `/doctors` | Create doctor (admin only) |
| POST | `/doctors/seed` | Seed sample doctors (admin only) |
| POST | `/doctors/{id}/reviews` | Add review (1 per user per doctor) |
| PATCH | `/doctors/{id}/reviews` | Update own review |
| DELETE | `/doctors/{id}/reviews` | Delete own review |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| WS | `/ws/notifications` | WebSocket connection for real-time notifications |
| GET | `/notifications` | List notifications (limit, unread_only params) |
| PATCH | `/notifications/{id}/read` | Mark notification as read |
| PATCH | `/notifications/read-all` | Mark all notifications as read |
| DELETE | `/notifications/{id}` | Delete notification |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gamification` | Get badges, XP, level, streak, adherence, health tips |

### Data Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/csv/{data_type}` | Download CSV (predictions/appointments/medications/journal/family) |
| GET | `/export/fhir` | Download FHIR R4 Transaction Bundle (JSON) |
| GET | `/export/summary` | Get record counts preview |

### Admin Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Platform-wide statistics |
| GET | `/admin/users` | List users (search, pagination) |
| GET | `/admin/users/{id}` | Detailed user info with activity |
| DELETE | `/admin/users/{id}` | Cascade delete user & all data |
| GET | `/admin/system` | System health (DB, ML, Gemini, collections) |
| GET | `/admin/activity` | Recent platform activity feed |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/files/upload` | Upload medical report (auto-analyzed) |
| GET | `/files` | List uploaded files |
| GET | `/files/{id}` | Get file details |
| GET | `/files/{id}/analysis` | Get file AI analysis |
| GET | `/files/metrics/history` | Get file metrics history |
| DELETE | `/files/{id}` | Delete a file |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PATCH | `/profile/update` | Update user profile (incl. language preference) |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/contact` | Submit contact form |
| GET | `/contact/submissions` | Get all submissions (admin only) |
| PATCH | `/contact/submissions/{id}/status` | Update submission status (admin only) |

### LiveKit (Virtual Doctor)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/livekit/token` | Generate room token for voice consultation |
| GET | `/livekit/status` | Check LiveKit configuration status |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API home |
| GET | `/health` | Health check (DB, ML models, Gemini, routes) |

## **Frontend Pages**

| Route | Page | Access |
|-------|------|--------|
| `/` | Home — Hero, About, Services, Articles, Testimonials, FAQs, Contact | Public |
| `/login` | Login — with 2FA OTP flow | Public |
| `/signup` | Signup | Public |
| `/dashboard` | Health Dashboard — Metrics, stats, recent activity, quick actions | Protected |
| `/predict` | Disease Prediction — Symptom selection, voice input, ML + AI analysis | Protected |
| `/history` | Prediction History — Past predictions, statistics, detail modal | Protected |
| `/book` | Appointments — Doctor search, booking, management | Protected |
| `/calendar` | Appointment Calendar — Monthly grid, day detail, list view | Protected |
| `/doctors` | Doctor Directory — Search, filter, reviews, ratings | Protected |
| `/medications` | Medication Tracker — CRUD, take/skip logging, adherence stats | Protected |
| `/timeline` | Health Timeline — Unified timeline, journal entries, mood tracking | Protected |
| `/report` | Health Report — PDF generation, data preview, download | Protected |
| `/export` | Export Data — CSV per type, FHIR R4 bundle download | Protected |
| `/family` | Family Profiles — Dependent management, medical info | Protected |
| `/achievements` | Gamification — Badges, XP/levels, streaks, health tips | Protected |
| `/tools` | Health Tools — Symptom Analyzer, Drug Checker, Health Plan Generator | Protected |
| `/article` | Health Articles — Search, category filtering, external resources | Protected |
| `/profile` | Profile — Edit info, health metrics, reports, analysis, health plans | Protected |
| `/virtual-doctor` | Virtual Doctor — AI voice consultation with LiveKit + Gemini | Protected |
| `/security` | 2FA Settings — Setup, QR code, recovery codes, disable | Protected |
| `/admin` | Admin Dashboard — Stats, users, system health, activity (admin only) | Protected |

## **Installation**

### **Prerequisites**

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- Gmail account with App Password (for email notifications)
- LiveKit Cloud account or self-hosted LiveKit server (for Virtual Doctor feature)

### **Backend Setup**

1. Clone the repository:
   ```bash
   git clone https://github.com/shubhamprasad318/AI_Health_Care.git
   cd AI_Health_Care/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend/` directory:
   ```env
   # Database
   MONGO_URI=your_mongodb_connection_string

   # Security (MANDATORY in production — app will exit without it)
   SECRET_KEY=your_secret_key

   # AI
   GEMINI_API_KEY=your_gemini_api_key

   # CORS
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

   # Email (Gmail SMTP)
   SMTP_EMAIL=your_gmail@gmail.com
   SMTP_PASSWORD=your_gmail_app_password
   SMTP_FROM_NAME=AI Health Care

   # Admin
   ADMIN_EMAIL=your_admin_email@example.com

   # LiveKit (for Virtual Doctor)
   LIVEKIT_URL=your_livekit_server_url
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret

   # Environment (set to "production" for secure cookies, HSTS)
   ENV=development
   ```

5. Start the server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

### **Voice Agent Setup (Virtual Doctor)**

1. Navigate to the LiveKit agent directory:
   ```bash
   cd AI_Health_Care/livekit-agent
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file (see `.env.example`):
   ```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   GOOGLE_API_KEY=your_gemini_api_key
   ```

5. Run locally:
   ```bash
   python agent.py console
   ```

6. **Deploy to LiveKit Cloud** (1,000 free minutes/month):
   ```bash
   lk cloud auth
   lk project set-default "<your-project>"
   lk agent create
   lk agent update-secrets --secrets-file .env
   ```

### **Frontend Setup**

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

5. Build for production (generates PWA service worker):
   ```bash
   npm run build
   ```

## **Usage**

1. Open the application in your browser and create an account or log in.
2. **Predict Disease** — Select up to 3 symptoms (or use voice input), get ML-based predictions with disease info, precautions, and specialist recommendations. Toggle enhanced AI analysis for deeper Gemini-powered insights.
3. **AI Health Chat** — Use the floating chatbot widget (available on every page) for real-time medical consultations with streaming responses.
4. **Health Tools** — Access the Symptom Analyzer, Drug Interaction Checker (with PDF export), and Health Plan Generator (4-week AI plans with print support).
5. **Medical Reports** — Upload PDF/image reports from the Profile page for automatic AI analysis showing risk levels, key findings, abnormal values, and recommendations. Generate comprehensive PDF health reports from the Report page.
6. **Medications** — Track daily medications with dosage, frequency, and time schedules. Log take/skip actions and monitor adherence statistics.
7. **Health Timeline** — View a unified chronological timeline of all health events (predictions, appointments, medications, journal entries). Write journal entries with mood and pain tracking.
8. **Appointments** — Search the Doctor Directory with filters and reviews, book appointments, and view them on the Calendar with monthly grid and list views.
9. **Health Dashboard** — Monitor BMI, blood pressure, health score, view prediction history, upcoming appointments, and access quick actions.
10. **Family Profiles** — Add and manage up to 10 family member profiles with medical information.
11. **Achievements** — Earn 14 badges, track XP/levels, maintain health streaks, and view weekly health tips.
12. **Export Data** — Download your health data as CSV files (per category) or as a FHIR R4 bundle for interoperability.
13. **Security** — Enable 2FA from the Security page for TOTP-based two-factor authentication with recovery codes.
14. **Dark Mode** — Toggle dark mode from the sun/moon button in the navbar. Preference persists across sessions.
15. **Language** — Switch between English and Hindi using the language toggle in the navbar.
16. **Virtual Doctor** — Navigate to the Virtual Doctor page, start a voice consultation, and talk naturally with the AI doctor.
17. **Admin** — Access the Admin Dashboard to view platform stats, manage users, monitor system health, and review activity (requires admin email).
