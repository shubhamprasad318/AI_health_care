# Deploying on Render (free tier)

This repo includes a [`render.yaml`](render.yaml) Blueprint that creates both services:

| Service | Render type | Plan |
|---|---|---|
| `ai-healthengine-api` (FastAPI backend, `backend/`) | Web Service | Free (512 MB RAM, 0.1 CPU) |
| `ai-healthengine` (React frontend, `frontend/`) | Static Site | Free |

You also need two free external services:

- **MongoDB Atlas** for the database (Render has no MongoDB)
- **Resend** for email, because Render's free web services block outbound SMTP

The LiveKit voice agent (`livekit-agent/`) is a background worker, and Render has no free
plan for workers. Host it on LiveKit Cloud or elsewhere. Everything except voice
consultations works without it.

## 1. Create the database (MongoDB Atlas)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free **M0** cluster.
2. **Database Access:** add a user with a password.
3. **Network Access:** add `0.0.0.0/0`. Render's free tier has no fixed outbound IP.
4. **Connect → Drivers:** copy the connection string, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## 2. Set up email (Resend, optional)

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. To email any address, verify a domain you own in Resend and use a sender on it, e.g.
   `AI HealthEngine <noreply@yourdomain.com>`.
   Without a verified domain, leave `RESEND_FROM` empty: Resend's test sender then only
   delivers to your own Resend account email.

Skip this step to deploy without email. The app still works; emails are just not sent.

## 3. Deploy the Blueprint

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml`.
3. Render asks for the secret values. Fill in:

| Variable | Service | Value |
|---|---|---|
| `MONGO_URI` | api | Connection string from step 1 |
| `GEMINI_API_KEY` | api | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `ALLOWED_ORIGINS` | api | `https://ai-healthengine.onrender.com` (your frontend URL) |
| `ADMIN_EMAIL` | api | Email of the account allowed into `/admin` |
| `RESEND_API_KEY`, `RESEND_FROM` | api | From step 2 (or leave empty) |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | api | From LiveKit Cloud (or leave empty) |
| `VITE_API_URL` | frontend | `https://ai-healthengine-api.onrender.com` (your backend URL) |

`SECRET_KEY` is generated automatically. The service URLs follow the service names; if a
name is taken, Render adds a suffix. Check the real URLs after the first deploy and update
`ALLOWED_ORIGINS` and `VITE_API_URL` to match.

4. Click **Apply**. The first backend build takes a few minutes.

After changing `VITE_API_URL`, trigger a **manual deploy** of the frontend: the value is
baked in at build time.

## 4. Check it works

- `https://<api>.onrender.com/health` returns a JSON health status
- The `/health` response includes `"ml_models": "loaded"`
- Open the frontend, sign up, and run a symptom check

## How it fits in 512 MB

The backend uses about 340-370 MB with the disease model loaded. The model ships in the
repo as `backend/models/lgbm_model.pkl.gz`, so nothing is trained on Render.
`scikit-learn` and `lightgbm` are pinned in `backend/requirements.txt` to the versions that
trained it; if you retrain with different versions, update the pins to match.

## Free tier limits to know

- **Sleeps after 15 minutes idle.** The next request waits about a minute while it wakes.
- **750 free instance hours per month** per workspace: enough for one always-on service.
- **No persistent disk.** Files saved under `backend/uploads/` are lost on every restart or
  deploy. Use external storage (e.g. MongoDB GridFS or S3) if uploads must persist.
- **0.1 CPU.** Gemini-powered features wait mostly on Google's API and are fine;
  predictions take a few times longer than on a laptop.

## Login across two domains

The frontend and backend are on different `*.onrender.com` sites, so browsers don't send
the backend's `SameSite=Lax` session cookie. The frontend therefore also stores the access
token and sends it as an `Authorization: Bearer` header (see
`frontend/src/utils/authToken.js`). The backend accepts either.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Backend deploy fails at the health check | `/health` returns 503 when MongoDB is unreachable. Check `MONGO_URI` and that Atlas Network Access allows `0.0.0.0/0` |
| Backend restarts with "out of memory" | A larger retrained model. Check memory locally; it must stay well under 512 MB |
| Browser shows CORS errors | `ALLOWED_ORIGINS` must exactly match the frontend URL (`https://…`, no trailing slash) |
| Frontend calls `localhost:8000` | `VITE_API_URL` wasn't set at build time. Set it and redeploy the frontend |
| Refreshing a page gives 404 | The `/* → /index.html` rewrite is missing. Add it under the static site's Redirects/Rewrites |
| Emails aren't sent | Set `RESEND_API_KEY`; SMTP is blocked on the free tier |
