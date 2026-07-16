import json
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from groq import Groq
from pydantic import BaseModel
from sqlalchemy import func
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


SYSTEM_PROMPT = """Tu es UrbanFlow AI, assistant de mobilité urbaine intelligente pour la France.
Tu aides les citoyens à trouver les meilleurs itinéraires multimodaux (marche, vélo,
trottinette, bus, métro, covoiturage, train régional, avion) en restant GÉOGRAPHIQUEMENT RÉALISTE.

RÈGLES STRICTES :
- Si l'origine et la destination sont dans la même ville → propose marche/vélo/bus/métro/taxi.
- Si l'origine et la destination sont dans des villes différentes du même pays → propose bus interurbain, train (si ligne existe), covoiturage.
- Si l'origine et la destination sont dans des pays différents séparés par la mer (ex: France ↔ Espagne, France ↔ Italie) → propose AVION obligatoirement. Ne propose JAMAIS de train ou bus entre des pays séparés par la mer.
- Ne fabrique pas de modes de transport qui n'existent pas sur le trajet demandé.
- Si le trajet est international, mentionne l'aéroport de départ et d'arrivée.

Réponds TOUJOURS en JSON valide avec exactement ces 4 champs :
{
  "suggestion": "description naturelle du trajet recommandé (2-3 phrases)",
  "steps": ["étape 1", "étape 2", "étape 3"],
  "co2_estimate": "estimation CO2 réaliste selon le mode (avion ≈ 150-250kg, train ≈ 5-20kg, bus ≈ 10-30kg)",
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
