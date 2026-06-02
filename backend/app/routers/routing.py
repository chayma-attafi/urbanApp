from fastapi import APIRouter, Depends, Query

from app.routers.deps import get_current_user

router = APIRouter()


@router.get("/estimate")
def estimate_route(
    origin: str = Query(min_length=2),
    destination: str = Query(min_length=2),
    _: object = Depends(get_current_user),
):
    return {
        "origin": origin,
        "destination": destination,
        "duration_minutes": 24,
        "distance_km": 6.8,
        "steps": ["walk", "metro", "walk"],
        "co2_saved_kg": 1.4,
    }

