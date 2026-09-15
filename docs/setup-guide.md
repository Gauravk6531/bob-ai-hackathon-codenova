# Setup Guide

 This guide explains how to run the Drug Safety Signal Detector and Regulatory Submission Readiness Checker locally.

 The project has two processes:

 - A FastAPI backend that serves signal detection and submission-readiness APIs on port `8000`.
 - A React/Vite frontend that runs on port `5173` and proxies `/api` requests to the backend.

 ## Prerequisites

 Before you begin, install:

 - Python 3.10 or newer
 - Node.js 18 or newer and npm
 - Git

 No database, Docker installation, IBM Cloud account, or external API key is required for the local demo. The application uses the processed dataset in `data/processed/faers_clean.csv` and the CTD requirements in `src/backend/data/ctd_requirements.json`.

 ## Clone the Repository

 ```bash
 git clone https://github.com/Gauravk6531/bob-ai-hackathon-codenova.git
 cd bob-ai-hackathon-codenova
 ```

 ## Backend Installation

 Create and activate a virtual environment from the repository root.

 ### Windows PowerShell

 ```powershell
 python -m venv .venv
 .venv\Scripts\Activate.ps1
 python -m pip install --upgrade pip
 pip install -r src/backend/requirements.txt
 ```

 If PowerShell blocks activation:

 ```powershell
 Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
 .venv\Scripts\Activate.ps1
 ```

 ### macOS/Linux

 ```bash
 python3 -m venv .venv
 source .venv/bin/activate
 python -m pip install --upgrade pip
 pip install -r src/backend/requirements.txt
 ```

 ## Environment Variables

 Environment variables are optional for the local application. The backend calls `load_dotenv()`, but no variable is required to run the current demo.

 Do not configure a database or notification service for the local setup. The existing `src/.env.example` contains optional placeholder settings and is not required by the implemented API.

 ## Frontend Installation

 Open a second terminal at the repository root and install the frontend dependencies:

 ```bash
 cd src/frontend
 npm install
 ```

 ## Run the Application

 Use two terminals. Keep the Python virtual environment active in the backend terminal.

 ### Terminal 1: Start the backend

 From the repository root:

 ```powershell
 .venv\Scripts\Activate.ps1
 cd src
 python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
 ```

 The API is available at `http://127.0.0.1:8000`. FastAPI documentation is available at `http://127.0.0.1:8000/docs`.

 ### Terminal 2: Start the frontend

 From the repository root:

 ```powershell
 cd src/frontend
 npm run dev
 ```

 Open `http://localhost:5173`. The Vite configuration forwards frontend `/api` requests to `http://127.0.0.1:8000`.

 The backend health check is available at `http://127.0.0.1:8000/health` and returns:

 ```json
 {"status":"ok","service":"drug-safety-api"}
 ```

 ### Available Workflows

 - **Signal Detection:** Enter a drug name such as `aspirin`, `ibuprofen`, or `warfarin`. The backend loads processed FAERS data and returns PRR, Chi-square, classifications, and quarterly trends.
 - **Submission Readiness:** Upload a `.txt` or `.pdf` dossier file up to 50 MB. The backend extracts headings and checks them against the verified CTD requirements.
 - **Reports:** After either analysis completes, open Reports to preview and export safety, readiness, or combined results as PDF, CSV, or JSON.

 ## Running Tests

 With the virtual environment activated, run backend unit tests from the repository root:

 ```powershell
 pytest src/backend/tests -v
 ```

 Run frontend type checking and the production build from `src/frontend`:

 ```powershell
 npm run typecheck
 npm run build
 ```

 ## Optional Data Pipeline

 The existing processed dataset is sufficient for the application. To fetch and prepare FDA data, inspect the scripts under `src/data_pipeline/` and run them from the repository root only when an updated dataset is needed. Data fetching may require network access.

 ## Troubleshooting

 | Issue | Solution |
 |---|---|
 | `ModuleNotFoundError: No module named 'backend'` | Start the backend from the `src` directory with `python -m uvicorn backend.main:app --reload`, or confirm that the virtual environment is active. |
 | `No module named ...` while starting the backend | Activate `.venv` and run `pip install -r src/backend/requirements.txt` from the repository root. |
 | Frontend cannot reach `/api` | Confirm the backend is running on port `8000`, then restart `npm run dev`. The Vite proxy targets `http://127.0.0.1:8000`. |
 | Port `5173` is already in use | Stop the other Vite process or use the alternate URL printed by Vite. Update backend CORS origins if using a different frontend port. |
 | Port `8000` is already in use | Stop the other Uvicorn process or start the backend on another port and update `src/frontend/vite.config.ts` to match. |
 | PDF upload cannot extract headings | Confirm the file is a text-based PDF and that `pdfminer.six` installed successfully. Scanned image-only PDFs may require OCR, which is not included. |
 | PowerShell refuses `.venv\Scripts\Activate.ps1` | Use the process-scoped execution-policy command shown in Backend Installation. |
 | No signal results are returned | Use a drug present in the processed dataset, check the spelling, and review the backend response for data-source and quality details. |

 ## Stop the Application

 Press `Ctrl+C` in each terminal running Uvicorn or Vite. Deactivate the Python environment when finished:

 ```powershell
 deactivate
 ```
