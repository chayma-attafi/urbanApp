from fastapi import APIRouter, Depends

from app.routers.deps import get_current_user

router = APIRouter()


@router.get("/modes")
def list_transport_modes():
    return [
        {"id": "metro", "label": "Metro", "status": "normal"},
        {"id": "bus", "label": "Bus", "status": "delays"},
        {"id": "bike", "label": "Velo", "status": "available"},
        {"id": "walk", "label": "Marche", "status": "available"},
    ]


@router.get("/nearby")
def nearby_stops(_: object = Depends(get_current_user)):
    return [
        {"id": "stop-001", "name": "Gare Centrale", "mode": "metro", "eta_minutes": 3},
        {"id": "stop-002", "name": "Campus Digital", "mode": "bus", "eta_minutes": 8},
    ]

