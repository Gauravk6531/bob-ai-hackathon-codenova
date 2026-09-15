# Drug Safety Signal Detector & Regulatory Submission Readiness Checker — Plan

## Top-Level Overview

Build a full-stack web application entirely inside `src/`. The backend is FastAPI (Python) with SQLite. The frontend is React + TypeScript + Tailwind CSS + MUI. IBM watsonx.ai (`ibm/granite-3-8b-instruct`) provides AI explanations with a deterministic fallback.

**Two modes:**
- **Mode 1 — Signal Detection:** Calls live openFDA API, computes PRR deterministically, ranks signals, shows trends.
- **Mode 2 — Submission Readiness:** User uploads a dossier file; backend extracts headings and checks against a hardcoded ICH CTD requirements dataset.

**Strict rules:**
- All work inside `src/` only.
- AI never computes PRR or completeness scores.
- ICH CTD requirements are hardcoded — never AI-generated.
- No fake data in the final application; openFDA is the live source with CSV fallback.

---

## Sub-Task 1 — Backend Scaffold & Data Layer

**Intent:** Create the FastAPI project skeleton, Pydantic schemas, SQLite setup, sample FAERS CSV, and hardcoded ICH CTD requirements JSON.

**Expected Outcomes:**
- `src/backend/` exists with `main.py`, `requirements.txt`, `models/schemas.py`
- `src/backend/data/faers_sample.csv` contains real FAERS-format columns
- `src/backend/data/ctd_requirements.json` contains ICH CTD Modules 1–5 sections (hardcoded, not AI-generated)
- FastAPI app starts with CORS enabled and `/health` returns 200

**Todo List:**
- [ ] Create `src/backend/requirements.txt` (fastapi, uvicorn, pandas, numpy, httpx, python-multipart, PyMuPDF or pdfminer, python-dotenv, ibm-watsonx-ai)
- [ ] Create `src/backend/main.py` — FastAPI app, CORS, router mounts, `/health` endpoint
- [ ] Create `src/backend/models/__init__.py`
- [ ] Create `src/backend/models/schemas.py` — all Pydantic request/response models for both modes
- [ ] Create `src/backend/data/faers_sample.csv` — FAERS-format sample (safetyreportid, serious, receivedate, patient.drug.medicinalproduct, patient.reaction.reactionmeddrapt)
- [ ] Create `src/backend/data/ctd_requirements.json` — ICH CTD Modules 1–5, each section with id, module, title, required flag

**Relevant Context:**
- `src/.env.example` shows env var names to use: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`
- submission.yaml declares SQLite as the database

**Status:** [ ] pending

---

## Sub-Task 2 — Signal Detection Service (Mode 1 Backend)

**Intent:** Implement deterministic PRR calculation, drug/AE normalization, openFDA live fetch with CSV fallback, and trend analysis — all as pure Python services.

**Expected Outcomes:**
- `prr_calculator.py` computes PRR from a 2×2 contingency table; never calls AI
- `drug_normalizer.py` lowercases and strips brand suffixes for drug and AE names
- `trend_analyzer.py` buckets reports by quarter and counts per drug-event pair
- `signals.py` route returns ranked signals with drug, AE, report count, PRR, trend, signal level

**Todo List:**
- [ ] Create `src/backend/services/__init__.py`
- [ ] Create `src/backend/services/drug_normalizer.py` — normalize drug names and MedDRA AE terms
- [ ] Create `src/backend/services/prr_calculator.py` — build 2×2 table, compute PRR, chi-square, signal level (signal/weak/no signal)
- [ ] Create `src/backend/services/trend_analyzer.py` — group reports by quarter, return time-series counts
- [ ] Create `src/backend/services/faers_fetcher.py` — call openFDA `drug/event.json` API; on failure load `faers_sample.csv`
- [ ] Create `src/backend/api/__init__.py`
- [ ] Create `src/backend/api/signals.py` — POST `/api/signals` accepts drug name + date range, returns ranked signal list

**Relevant Context:**
- openFDA base URL: `https://api.fda.gov/drug/event.json`
- PRR formula: `PRR = (a/(a+b)) / (c/(c+d))` where a=drug+event, b=drug+other, c=other+event, d=other+other
- Signal threshold: PRR ≥ 2 AND report count ≥ 3 = signal; PRR 1.5–2 = weak signal
- AI must NOT be called in any of these files

**Status:** [ ] pending

---

## Sub-Task 3 — Submission Readiness Service (Mode 2 Backend)

**Intent:** Implement file upload, heading extraction from plain-text and PDF, deterministic CTD section matching, completeness scoring, and gap report generation.

**Expected Outcomes:**
- `ctd_checker.py` matches extracted headings against `ctd_requirements.json` using keyword matching
- Module-wise completeness percentages are computed deterministically
- `readiness.py` route accepts file upload and returns completeness scores + gap report

**Todo List:**
- [ ] Create `src/backend/services/doc_parser.py` — extract section headings from .txt and .pdf uploads
- [ ] Create `src/backend/services/ctd_checker.py` — load `ctd_requirements.json`, match headings, compute per-module and overall completeness
- [ ] Create `src/backend/api/readiness.py` — POST `/api/readiness` accepts multipart file, returns readiness result

**Relevant Context:**
- CTD requirements must come only from `src/backend/data/ctd_requirements.json` — never from AI
- Completeness = (matched required sections / total required sections) × 100
- PDF parsing: use PyMuPDF (`fitz`) or pdfminer; plain text: split on newlines and detect heading patterns

**Status:** [ ] pending

---

## Sub-Task 4 — AI Explanation Service

**Intent:** Implement a watsonx.ai service that accepts a context string (signal data or gap report) and returns a natural-language explanation. Provide a deterministic fallback if no API key is configured.

**Expected Outcomes:**
- `ai_service.py` calls `ibm/granite-3-8b-instruct` via watsonx.ai SDK
- If `WATSONX_API_KEY` is missing or the call fails, returns a rule-based template explanation
- `ai.py` route exposes POST `/api/ai/explain`
- AI response clearly states signals are not proof of causality

**Todo List:**
- [ ] Create `src/backend/services/ai_service.py` — watsonx.ai call with prompt template; deterministic fallback
- [ ] Create `src/backend/api/ai.py` — POST `/api/ai/explain` accepts mode + context payload

**Relevant Context:**
- Model: `ibm/granite-3-8b-instruct`
- Env vars: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`
- Fallback must include disclaimer: "A safety signal is NOT proof of causality."
- AI must not receive raw numbers to recalculate — only pre-computed results for explanation

**Status:** [ ] pending

---

## Sub-Task 5 — Frontend Scaffold

**Intent:** Bootstrap the React + TypeScript + Vite + Tailwind CSS + MUI frontend project inside `src/frontend/`.

**Expected Outcomes:**
- `src/frontend/` has `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `index.html`
- App compiles and renders a blank shell at `localhost:5173`
- MUI theme and Tailwind base styles are configured
- API client points to `localhost:8000`

**Todo List:**
- [ ] Create `src/frontend/package.json` with React 18, TypeScript, Vite, MUI, Tailwind CSS, Recharts, Axios, React Router v6
- [ ] Create `src/frontend/tsconfig.json`
- [ ] Create `src/frontend/vite.config.ts`
- [ ] Create `src/frontend/tailwind.config.js`
- [ ] Create `src/frontend/postcss.config.js`
- [ ] Create `src/frontend/index.html`
- [ ] Create `src/frontend/src/main.tsx`
- [ ] Create `src/frontend/src/App.tsx` — React Router routes for `/`, `/signals`, `/readiness`
- [ ] Create `src/frontend/src/types/index.ts` — shared TypeScript interfaces for Signal, ReadinessResult, GapItem, AIExplanation
- [ ] Create `src/frontend/src/services/apiClient.ts` — Axios instance + typed request functions

**Relevant Context:**
- Charting: Recharts (lightweight, works well with MUI)
- Routing: React Router v6 (`createBrowserRouter`)
- Styling: Tailwind CSS for layout/spacing, MUI for components

**Status:** [ ] pending

---

## Sub-Task 6 — Reusable UI Components

**Intent:** Build all shared React components used by both mode pages.

**Expected Outcomes:**
- `Layout.tsx` — top nav with mode switcher
- `SignalTable.tsx` — sortable MUI DataGrid showing drug, AE, count, PRR, signal level badge
- `PRRChart.tsx` — Recharts bar chart of top N PRR values
- `TrendChart.tsx` — Recharts line chart of report counts over time
- `ReadinessGauge.tsx` — MUI circular progress per module + overall score
- `GapReport.tsx` — MUI list of missing sections grouped by module with priority badge
- `AIExplainer.tsx` — collapsible panel that calls `/api/ai/explain` and renders the response

**Todo List:**
- [ ] Create `src/frontend/src/components/Layout.tsx`
- [ ] Create `src/frontend/src/components/SignalTable.tsx`
- [ ] Create `src/frontend/src/components/PRRChart.tsx`
- [ ] Create `src/frontend/src/components/TrendChart.tsx`
- [ ] Create `src/frontend/src/components/ReadinessGauge.tsx`
- [ ] Create `src/frontend/src/components/GapReport.tsx`
- [ ] Create `src/frontend/src/components/AIExplainer.tsx`

**Relevant Context:**
- MUI DataGrid is in `@mui/x-data-grid` package
- Signal level badge colors: red = signal, amber = weak signal, green = no signal
- AIExplainer must show disclaimer "Safety signals are NOT proof of causality"

**Status:** [ ] pending

---

## Sub-Task 7 — Mode Pages & Hooks

**Intent:** Build the two main feature pages and their data-fetching hooks.

**Expected Outcomes:**
- `Dashboard.tsx` — landing page with two mode cards linking to `/signals` and `/readiness`
- `SignalDetection.tsx` — drug name input + date range → calls backend → renders SignalTable, PRRChart, TrendChart, AIExplainer
- `SubmissionReadiness.tsx` — file upload → calls backend → renders ReadinessGauge, GapReport, AIExplainer
- `useSignals.ts` and `useReadiness.ts` hooks manage loading/error state

**Todo List:**
- [ ] Create `src/frontend/src/hooks/useSignals.ts`
- [ ] Create `src/frontend/src/hooks/useReadiness.ts`
- [ ] Create `src/frontend/src/pages/Dashboard.tsx`
- [ ] Create `src/frontend/src/pages/SignalDetection.tsx`
- [ ] Create `src/frontend/src/pages/SubmissionReadiness.tsx`

**Relevant Context:**
- Mode 1 inputs: drug name (text), optional date range (start/end year)
- Mode 2 input: file upload (accept .txt, .pdf)
- Both pages share Layout.tsx and AIExplainer.tsx
- Causality disclaimer must be visible on the SignalDetection page

**Status:** [ ] pending

---

## File Map (all inside `src/`)

```
src/
├── .env.example                          [existing — do not modify]
├── README.md                             [existing — do not modify]
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── signals.py
│   │   ├── readiness.py
│   │   └── ai.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── drug_normalizer.py
│   │   ├── prr_calculator.py
│   │   ├── trend_analyzer.py
│   │   ├── faers_fetcher.py
│   │   ├── doc_parser.py
│   │   ├── ctd_checker.py
│   │   └── ai_service.py
│   └── data/
│       ├── faers_sample.csv
│       └── ctd_requirements.json
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types/
        │   └── index.ts
        ├── services/
        │   └── apiClient.ts
        ├── hooks/
        │   ├── useSignals.ts
        │   └── useReadiness.ts
        ├── pages/
        │   ├── Dashboard.tsx
        │   ├── SignalDetection.tsx
        │   └── SubmissionReadiness.tsx
        └── components/
            ├── Layout.tsx
            ├── SignalTable.tsx
            ├── PRRChart.tsx
            ├── TrendChart.tsx
            ├── ReadinessGauge.tsx
            ├── GapReport.tsx
            └── AIExplainer.tsx
```

Total new files: **35**. Nothing outside `src/` is touched.
