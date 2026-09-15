# 🚀 Drug Safety Signal Detector & Regulatory Submission Readiness Checker

> An integrated platform for detecting potential drug safety signals and assessing pharmaceutical dossier readiness against verified CTD requirements.

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | CodeNova |
| **Track** | AI |
| **Team Lead** | Dhairya Mehta — d25dcs155@charusat.edu.in |
| **Members** | Kolhe Gaurav, Rucha Gandhi, Mithil Surti |

---

## 🎯 Problem Statement

Pharmacovigilance teams handle large volumes of adverse-event reports, making it difficult to quickly identify drug-event associations that may require further investigation. At the same time, regulatory teams manually review large pharmaceutical dossiers to identify missing or unclear CTD sections before submission.

These workflows are often handled separately, increasing review effort and making it difficult to get a unified view of safety signals and regulatory readiness.

---

## 💡 Solution

We built an integrated platform that analyzes official FAERS/AEMS data to identify statistical drug-event safety signals using PRR and Chi-square analysis, while checking pharmaceutical dossiers against verified ICH CTD requirements.

The platform combines deterministic statistical analysis, CTD document mapping, readiness assessment, gap identification, AI-assisted explanations, and report generation into one workflow.

---

## ✨ Key Features

- **Safety Signal Detection:** Analyze FAERS/AEMS data to identify potential drug-event associations.
- **Statistical Analysis:** Calculate PRR, Chi-square, drug/background reporting percentages, and 2x2 contingency tables.
- **Signal Classification:** Classify results as Potential Safety Signal, Weak/Emerging Signal, or No Signal using transparent application-configured criteria.
- **Trend & Cluster Analysis:** Analyze event patterns over time and identify meaningful patterns where sufficient data exists.
- **CTD Submission Readiness:** Map uploaded dossier content against verified ICH CTD requirements across Modules 1-5.
- **Gap Analysis:** Identify Present, Missing, Unrecognized, and Not Applicable requirements.
- **Regulatory Reports:** Generate safety signal, submission readiness, and combined regulatory reports.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, TypeScript |
| **Frameworks** | FastAPI, React, Vite |
| **IBM Technologies** | IBM Bob |
| **Databases** | None; local CSV/JSON data files |
| **Other** | Pandas, NumPy, Axios, Recharts, Material UI, REST API, Git, GitHub |

---

## 📁 Repository Structure

```text
├── src/
│   ├── backend/          # FastAPI API, analysis services, models, and tests
│   ├── data_pipeline/   # FDA data fetching, cleaning, normalization, and validation
│   └── frontend/        # React + Vite web application
├── data/                 # Raw and processed FAERS/AEMS datasets
├── docs/                 # Problem, solution, architecture, dataset, and setup docs
├── demo/                 # Demo video, live demo, and screenshots
├── presentation/         # Presentation materials
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

The application runs as a FastAPI backend and a Vite frontend. Use two terminals from the repository root.

```bash
# 1. Clone the repo
git clone https://github.com/Gauravk6531/bob-ai-hackathon-codenova.git
cd bob-ai-hackathon-codenova

# 2. Create and activate a Python virtual environment
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r src/backend/requirements.txt

# 4. Install frontend dependencies
cd src/frontend
npm install
```

Start the backend in one terminal:

```bash
cd src
uvicorn backend.main:app --reload
```

Start the frontend in a second terminal:

```bash
cd src/frontend
npm run dev
```

Open `http://localhost:5173`. The backend health endpoint is available at `http://localhost:8000/health`.

Run backend tests from the repository root with:

```bash
pytest src/backend/tests -v
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/](presentation/) |

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- FAERS/AEMS data is based on spontaneous adverse-event reporting and may contain reporting bias, incomplete information, and duplicate reports.
- PRR and Chi-square identify statistical associations but do not establish causality.
- Small report counts can produce unstable statistical results and require expert review.
- CTD completeness depends on the quality and structure of uploaded documents and the verified requirements dataset.
- Module 1 requirements can vary by regulatory region.
- Some documents or sections may require human review when they cannot be confidently mapped.
- Submission readiness does not guarantee regulatory approval or acceptance.

---

## 🏅 What We're Most Proud Of

The platform brings real-world pharmacovigilance signal detection and regulatory submission readiness into one decision-support workflow. It connects statistical safety-signal analysis with regulatory gap identification and provides a practical foundation for investigation and expert review.

---
