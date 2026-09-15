from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Drug Safety Signal Detector & Submission Readiness API",
    version="1.0.0",
    description="Backend API for drug safety signal detection and CTD submission readiness checking",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.api import signals, readiness  # noqa: E402

app.include_router(signals.router, prefix="/api")
app.include_router(readiness.router, prefix="/api")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "drug-safety-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
