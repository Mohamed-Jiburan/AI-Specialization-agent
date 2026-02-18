from __future__ import annotations

from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from .models import ProfileInput, RoadmapResponse


def generate_roadmap_pdf(*, roadmap: RoadmapResponse, profile: ProfileInput) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    x0 = 0.75 * inch
    y = height - 0.9 * inch

    c.setTitle("Roadmap")

    c.setFont("Helvetica-Bold", 16)
    c.drawString(x0, y, "AI Specialization Decision Agent")
    y -= 0.3 * inch

    c.setFont("Helvetica", 11)
    c.drawString(x0, y, f"Career roadmap: {roadmap.career_title} ({roadmap.career_id})")
    y -= 0.2 * inch
    c.drawString(x0, y, f"Experience level: {roadmap.experience_level}")
    y -= 0.2 * inch
    c.drawString(x0, y, f"Gap: {roadmap.gap.gap_percent:.1f}%")
    y -= 0.35 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x0, y, "Profile")
    y -= 0.2 * inch

    c.setFont("Helvetica", 10)
    skills = ", ".join(profile.skills[:25]) if profile.skills else "—"
    interests = ", ".join(profile.interests[:25]) if profile.interests else "—"
    c.drawString(x0, y, f"Skills: {skills}")
    y -= 0.18 * inch
    c.drawString(x0, y, f"Interests: {interests}")
    y -= 0.3 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x0, y, "Timeline (6 months)")
    y -= 0.2 * inch

    c.setFont("Helvetica", 10)
    for phase in roadmap.timeline:
        if y < 1.2 * inch:
            c.showPage()
            y = height - 0.9 * inch
            c.setFont("Helvetica", 10)

        c.setFont("Helvetica-Bold", 10)
        c.drawString(x0, y, f"{phase.months} — {phase.title}")
        y -= 0.16 * inch
        c.setFont("Helvetica", 10)

        focus = " • ".join(phase.focus) if phase.focus else "—"
        projects = " • ".join(phase.projects) if phase.projects else "—"

        c.drawString(x0 + 10, y, f"Focus: {focus}")
        y -= 0.16 * inch
        c.drawString(x0 + 10, y, f"Projects: {projects}")
        y -= 0.22 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x0, y, "Project suggestions")
    y -= 0.2 * inch
    c.setFont("Helvetica", 10)

    for p in roadmap.project_suggestions:
        if y < 1.2 * inch:
            c.showPage()
            y = height - 0.9 * inch
            c.setFont("Helvetica", 10)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x0, y, f"{p.title} ({p.difficulty})")
        y -= 0.16 * inch
        c.setFont("Helvetica", 10)
        outcomes = " • ".join(p.outcomes) if p.outcomes else "—"
        c.drawString(x0 + 10, y, f"Outcomes: {outcomes}")
        y -= 0.22 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x0, y, "Resources")
    y -= 0.2 * inch
    c.setFont("Helvetica", 10)

    for r in roadmap.learning_resources:
        if y < 1.2 * inch:
            c.showPage()
            y = height - 0.9 * inch
            c.setFont("Helvetica", 10)
        c.drawString(x0, y, f"{r.kind}: {r.title}")
        y -= 0.16 * inch
        c.setFillColorRGB(0.65, 0.75, 1.0)
        c.drawString(x0 + 10, y, r.url)
        c.setFillColorRGB(1, 1, 1)
        y -= 0.22 * inch

    c.showPage()
    c.save()
    return buf.getvalue()
