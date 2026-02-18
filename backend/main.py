from __future__ import annotations

from fastapi import Body, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import ValidationError

from .agent import analyze_profile
from .agent import CAREERS
from .auth import router as auth_router
from .auth import get_current_user
from .career_profile import get_career_profile
from .comparison_engine import compare
from .models import (
    AnalysisResponse,
    CareerOption,
    CareerProfileResponse,
    ComparisonRequest,
    ComparisonResponse,
    ProfileInput,
    RoadmapResponse,
    UserPublic,
)
from .llm import groq_reasoning_points
from .roadmap_generator import generate_roadmap
from .pdf_generator import generate_roadmap_pdf

app = FastAPI(title="AI Specialization Decision Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/careers", response_model=list[CareerOption])
def careers() -> list[CareerOption]:
    return [CareerOption(id=c.id, title=c.title) for c in CAREERS]


@app.post("/analyze", response_model=AnalysisResponse)
def analyze(payload: ProfileInput, user: UserPublic = Depends(get_current_user)) -> AnalysisResponse:
    _ = user
    analysis = analyze_profile(payload)
    pts = groq_reasoning_points(analysis)
    if pts:
        analysis = analysis.model_copy(
            update={
                "explainability": analysis.explainability.model_copy(
                    update={"reasoning_points": pts}
                )
            }
        )
    return analysis


@app.post("/roadmap/pdf")
def roadmap_pdf(payload: dict = Body(...), user: UserPublic = Depends(get_current_user)) -> Response:
    _ = user
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Invalid request body")

    career_id = payload.get("career_id")
    if not career_id:
        raise HTTPException(status_code=422, detail="Missing career_id")

    profile_raw = payload.get("profile")
    if not profile_raw:
        profile_raw = {
            "skills": payload.get("skills", []),
            "interests": payload.get("interests", []),
            "goal": payload.get("goal"),
            "experience_level": payload.get("experience_level"),
            "risk_tolerance": payload.get("risk_tolerance"),
            "salary_preference": payload.get("salary_preference"),
        }

    try:
        profile = ProfileInput.model_validate(profile_raw)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail={"message": "Invalid profile payload", "errors": e.errors()})
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid profile payload: {e}")

    roadmap = generate_roadmap(profile, career_id)
    pdf_bytes = generate_roadmap_pdf(roadmap=roadmap, profile=profile)
    filename = f"roadmap_{career_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@app.post("/roadmap/{career_id}", response_model=RoadmapResponse)
def roadmap(career_id: str, payload: ProfileInput, user: UserPublic = Depends(get_current_user)) -> RoadmapResponse:
    _ = user
    return generate_roadmap(payload, career_id)


@app.post("/career/{career_id}", response_model=CareerProfileResponse)
def career_profile(
    career_id: str, payload: ProfileInput, user: UserPublic = Depends(get_current_user)
) -> CareerProfileResponse:
    _ = user
    return get_career_profile(payload, career_id)


@app.post("/compare", response_model=ComparisonResponse)
def compare_careers(payload: ComparisonRequest, user: UserPublic = Depends(get_current_user)) -> ComparisonResponse:
    _ = user
    return compare(payload)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
