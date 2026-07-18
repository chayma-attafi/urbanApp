import json
import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from groq import Groq
from pydantic import BaseModel
from sqlalchemy import cast, Date, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.trip import Trip
from app.models.user import User
from app.routers.deps import get_current_user

router = APIRouter()


class RouteRequest(BaseModel):
    origin: str
    destination: str
    priority: str = "eco"
    modes: list[str] = ["walk", "transit"]


class RouteAIResponse(BaseModel):
    suggestion: str
    steps: list[str]
    co2_estimate: str
    tip: str


class CO2Stats(BaseModel):
    total_trips: int
    total_co2_kg: float
    monthly_trips: int
    monthly_co2_kg: float


SYSTEM_PROMPT = """Tu es UrbanFlow AI, assistant de mobilité urbaine intelligente.
Tu proposes des itinéraires RÉALISTES en appliquant ces règles SANS EXCEPTION :

RÈGLE 1 — Même ville ou villes proches (<80 km, même région/gouvernorat) :
→ marche, vélo, bus urbain, métro, tram, taxi. JAMAIS avion, JAMAIS ferry, JAMAIS train longue distance.

RÈGLE 2 — Villes différentes dans le même pays (>80 km) :
→ bus interurbain, train régional ou national, covoiturage. JAMAIS avion sauf si île sans pont/tunnel.

RÈGLE 3 — Pays différents séparés par la mer (Tunisie↔Europe, îles séparées) :
→ AVION obligatoire. Mentionne aéroport départ et arrivée.

RÈGLE 4 — Pays frontaliers partageant une frontière terrestre :
→ train international, bus transfrontalier, voiture. Pas d'avion.

INTERDICTIONS ABSOLUES :
- Ne propose JAMAIS ferry pour un trajet terrestre dans le même pays.
- Ne propose JAMAIS avion pour 2 villes dans le même pays continental.
- Ne propose JAMAIS de modes que les modes acceptés n'incluent pas si des alternatives terrestres existent.

Réponds TOUJOURS en JSON valide avec exactement ces 4 champs :
{
  "suggestion": "description naturelle du trajet recommandé (2-3 phrases)",
  "steps": ["étape 1", "étape 2", "étape 3"],
  "co2_estimate": "estimation CO2 réaliste selon le mode (avion ≈ 150-250kg, train ≈ 5-20kg, bus ≈ 10-30kg, marche = 0kg)",
  "tip": "conseil pratique court et réaliste"
}

Adapte selon la priorité : eco = minimise CO2, fast = minimise durée, accessible = évite escaliers/obstacles.
"""


def _parse_co2_kg(text: str) -> float | None:
    match = re.search(r"(\d+(?:[.,]\d+)?)", text)
    if match:
        return float(match.group(1).replace(",", "."))
    return None


@router.post("/suggest", response_model=RouteAIResponse)
def suggest_route(
    body: RouteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY non configurée")

    client = Groq(api_key=settings.GROQ_API_KEY)
    user_message = (
        f"Origine : {body.origin}\n"
        f"Destination : {body.destination}\n"
        f"Priorité : {body.priority}\n"
        f"Modes acceptés : {', '.join(body.modes)}"
    )

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.4,
            max_tokens=512,
            response_format={"type": "json_object"},
        )
        data = json.loads(completion.choices[0].message.content)
        result = RouteAIResponse(**data)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erreur IA : {exc}") from exc

    try:
        db.add(Trip(
            user_id=current_user.id,
            origin=body.origin,
            destination=body.destination,
            priority=body.priority,
            co2_raw=result.co2_estimate,
            co2_kg=_parse_co2_kg(result.co2_estimate),
        ))
        db.commit()
    except Exception:
        db.rollback()

    return result


@router.get("/stats", response_model=CO2Stats)
def get_co2_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total = db.query(
        func.count(Trip.id),
        func.coalesce(func.sum(Trip.co2_kg), 0.0),
    ).filter(Trip.user_id == current_user.id).one()

    monthly = db.query(
        func.count(Trip.id),
        func.coalesce(func.sum(Trip.co2_kg), 0.0),
    ).filter(
        Trip.user_id == current_user.id,
        Trip.created_at >= month_start,
    ).one()

    return CO2Stats(
        total_trips=total[0],
        total_co2_kg=round(float(total[1]), 1),
        monthly_trips=monthly[0],
        monthly_co2_kg=round(float(monthly[1]), 1),
    )


@router.get("/weekly")
def get_weekly_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    week_ago = today - timedelta(days=6)

    rows = db.query(
        cast(Trip.created_at, Date).label("day"),
        func.count(Trip.id).label("trips"),
        func.coalesce(func.sum(Trip.co2_kg), 0.0).label("co2_kg"),
    ).filter(
        Trip.user_id == current_user.id,
        Trip.created_at >= week_ago,
    ).group_by(cast(Trip.created_at, Date)).all()

    data = {row.day: {"trips": row.trips, "co2_kg": float(row.co2_kg)} for row in rows}
    result = []
    for i in range(7):
        day = week_ago + timedelta(days=i)
        d = data.get(day, {"trips": 0, "co2_kg": 0.0})
        result.append({"date": day.isoformat(), "trips": d["trips"], "co2_kg": round(d["co2_kg"], 1)})
    return result


@router.get("/priorities")
def get_priority_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Trip.priority, func.count(Trip.id)).filter(
        Trip.user_id == current_user.id,
    ).group_by(Trip.priority).all()
    return [{"priority": row[0], "count": row[1]} for row in rows]
