# Paisa

Paisa is a personal finance web app for recording income and expenses, setting monthly category budgets, and reviewing spending patterns. The dashboard includes transaction search and filters, monthly budget progress, month-over-month comparisons, budget alerts, and a transparent financial model based on a user's recorded activity and stated priorities.

This repository contains a React web app connected to Supabase, plus a separate FastAPI service that supports the earlier life-scenario simulator. These are two different backends: the current finance dashboard uses Supabase directly and does not use the FastAPI service for its transactions, budgets, authentication, or profile.

## What is implemented

- Email and password registration, email verification, login, and logout through Supabase Auth.
- User-specific profiles, transactions, and monthly budgets stored in Supabase PostgreSQL.
- Onboarding preferences for the user's financial goal and analysis priorities.
- A local, explainable financial model that scores savings, budget control, discretionary spending, and goal progress from recorded data.
- Monthly spending comparison and budget threshold alerts, calculated in the frontend from the user's transaction and budget history.
- Optional Supabase Edge Function for an OpenAI-generated explanation of an already aggregated model summary. The frontend disables requests unless explicitly enabled.
- A separate FastAPI service with SQLite-backed accounts, transactions, budgets, simulation history, and a heuristic insights route.

The interface also includes demo/sample content for logged-out visitors. Family tables, receipt storage rules, transaction item tables, and financial goal tables exist in the SQL schema, but corresponding family sharing, receipt upload, itemized receipt, and goal-management flows are not currently implemented in the frontend.

## Technology stack

- **Frontend:** React 19, JavaScript, Vite, Recharts, Supabase JavaScript client
- **Primary data and authentication service:** Supabase Auth, PostgreSQL, Row Level Security, and Storage policies
- **Optional hosted AI explanation:** Supabase Edge Functions using Deno/TypeScript and the OpenAI Responses API
- **Separate simulator API:** Python, FastAPI, Pydantic, SlowAPI, SQLite, Passlib, and python-jose

## Run the web app

Requirements: Node.js and npm.

1. From the repository root, enter the frontend directory and install packages:

   ```bat
   cd frontend
   npm install
   ```

2. Create `frontend/.env.local` with the Supabase project URL and publishable key:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   VITE_ENABLE_AI_INSIGHTS=false
   ```

   The publishable key is intended for client-side use. Never put a Supabase service-role key, database password, or OpenAI API key in a `VITE_` variable or in frontend code.

3. In the Supabase SQL Editor for your project, run [`supabase/schema.sql`](supabase/schema.sql). This creates the app's tables, indexes, Row Level Security policies, household RPC, and private receipt bucket policies.

4. In Supabase Auth settings, enable email/password authentication and configure the site's URL and redirect URLs for the local address Vite prints. Vite commonly uses `http://localhost:5173`; it may select another port if 5173 is occupied. Add the deployed site URL and its auth redirect URL when deploying.

5. Start the frontend:

   ```bat
   npm run dev
   ```

   Open the local URL printed by Vite. Other available frontend commands are `npm run build`, `npm run lint`, and `npm run preview` (after a build).

## Optional AI explanation

AI explanations are disabled by default in the frontend. Keep `VITE_ENABLE_AI_INSIGHTS=false` to avoid requests and related API charges. To enable the feature, first deploy `supabase/functions/personalized-insight` to the same Supabase project, configure the function's `OPENAI_API_KEY` secret (and optionally `OPENAI_INSIGHT_MODEL` and `APP_ORIGIN`), then set these frontend variables in `frontend/.env.local`:

```dotenv
VITE_ENABLE_AI_INSIGHTS=true
VITE_PERSONALIZED_INSIGHT_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/personalized-insight
```

Restart Vite after changing environment variables. The OpenAI key belongs only in the Edge Function's server-side secrets. Calling the function can incur OpenAI charges.

## Run the separate Python API

The FastAPI service is not required to run the current Supabase-backed finance dashboard. It is a separate service for the earlier simulation flow and legacy API routes.

Requirements: Python 3.10 or newer (Pydantic v2 is used). From the repository root, install the dependencies:

```bat
py -m pip install "fastapi>=0.100" "pydantic>=2" "uvicorn[standard]" slowapi python-dotenv "passlib[bcrypt]" "python-jose[cryptography]"
```

The API loads its settings from a root-level `.env`. Create that file if needed and provide a randomly generated secret key of at least 32 characters:

```dotenv
SECRET_KEY=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174
COOKIE_SECURE=false
```

Generate a key with:

```bat
py -c "import secrets; print(secrets.token_urlsafe(48))"
```

Then, still from the repository root, start the API:

```bat
py -m uvicorn backend.api.main:app --reload --port 8000
```

The root endpoint is `http://localhost:8000/`, and the interactive API documentation is at `http://localhost:8000/docs`. The SQLite database is created under `backend/memory/` by default. Keep `.env` and database files private; they are ignored by Git. For a deployed HTTPS environment, use a strong unique `SECRET_KEY` and set `COOKIE_SECURE=true`.

## Repository map

```text
frontend/                         React web app
  src/api/                        Supabase and simulator API clients
  src/components/                 Login and simulator UI components
  src/logic/                      Local financial scoring and spending analysis
backend/                          Separate FastAPI and SQLite service
  api/                             API routes and app entry point
  auth/                            Legacy API authentication
  memory/                          SQLite persistence for the API
  simulator/                       Scenario simulation logic
supabase/schema.sql               Database schema and access policies
supabase/functions/               Supabase Edge Functions
docs/                              Project documentation
```

## Data handling and security notes

- Supabase is the authority for finance dashboard accounts and records. The SQL schema enables Row Level Security and scopes personal records to the authenticated user; shared household records are only visible through the schema's household membership rules.
- Use only the Supabase project URL and publishable key in the browser. Keep service-role keys, database credentials, signing secrets, and OpenAI keys on trusted server-side systems.
- Do not commit `.env`, `.env.local`, database files, or Supabase CLI temporary state. The repository `.gitignore` excludes these paths.
- The app is a tracking and educational analysis tool. Its computed scores and observations depend on the accuracy and completeness of entries and are not professional financial advice.

## Current limitations

- UPI SMS ingestion, automatic bank import, receipt upload and OCR, and itemized receipt tracking are not implemented yet.
- Family creation and family analytics are represented in the database schema but do not yet have complete user-facing workflows.
- The current transaction screen supports adding records and filtering; full edit/delete flows are not all wired into the current dashboard.
- The finance model is deterministic, user-specific analysis, not a trained machine-learning model. It needs more history to make useful comparisons and is not trained on one user's data for another user's benefit.
- The OpenAI feature is an optional explanation layer, not the core financial model, and is off by default.
- The separate FastAPI API uses local SQLite and its own cookie-based accounts. It is not integrated with Supabase Auth or the current dashboard's Supabase data.
