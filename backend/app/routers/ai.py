from fastapi import APIRouter, Depends, HTTPException
from groq import Groq
from pydantic import BaseModel

from app.core.config import settings
from app.routers.deps import get_current_user

router = APIRouter()


class RouteRequest(BaseModel):
    origin: str
    destination: str
    priority: str = "eco"        # eco | fast | accessible
    modes: list[str] = ["walk", "transit"]


class RouteAIResponse(BaseModel):
    suggestion: str
    steps: list[str]
    co2_estimate: str
    tip: str


SYSTEM_PROMPT = """Tu es UrbanFlow AI, assistant de mobilité urbaine intelligente pour la Tunisie.
Tu aides les citoyens à trouver les meilleurs itinéraires multimodaux (marche, vélo,
trottinette, bus, métro, covoiturage, train régional, avion) en restant GÉOGRAPHIQUEMENT RÉALISTE.

RÈGLES STRICTES :
- Si l'origine et la destination sont dans la même ville → propose marche/vélo/bus/métro/taxi.
- Si l'origine et la destination sont dans des villes différentes du même pays → propose bus interurbain, train (si ligne existe), covoiturage.
- Si l'origine et la destination sont dans des pays différents séparés par la mer (ex: Tunisie ↔ France, Tunisie ↔ Italie) → propose AVION obligatoirement. Ne propose JAMAIS de train ou bus entre des pays séparés par la mer.
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


@router.post("/suggest", response_model=RouteAIResponse)
def suggest_route(
    body: RouteRequest,
    _: object = Depends(get_current_user),
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
        import json
        data = json.loads(completion.choices[0].message.content)
        return RouteAIResponse(**data)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erreur IA : {exc}") from exc
