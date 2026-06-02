from fastapi import APIRouter

router = APIRouter()


@router.get("/dashboard")
def dashboard_demo():
    return {
        "active_users": 128,
        "routes_today": 412,
        "average_delay_minutes": 4,
        "favorite_mode": "metro",
    }

