import math

import httpx
from fastapi import APIRouter, Depends, Query

from app.core.config import settings
from app.routers.deps import get_current_user

router = APIRouter()


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _prim_mode(physical_modes: list) -> str:
    names = [m.get("name", "").lower() for m in physical_modes]
    if any("métro" in n or "metro" in n for n in names):
        return "metro"
    if any("rer" in n for n in names):
        return "rer"
    if any("tram" in n for n in names):
        return "tram"
    return "bus"


@router.get("/contracts")
async def list_contracts(_: object = Depends(get_current_user)):
    if not settings.JCDECAUX_API_KEY:
        return {"error": "JCDECAUX_API_KEY non configurée"}
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(
                "https://api.jcdecaux.com/vls/v1/contracts",
                params={"apiKey": settings.JCDECAUX_API_KEY},
            )
            r.raise_for_status()
            return r.json()
    except Exception as e:
        return {"error": str(e)}


@router.get("/modes")
def list_transport_modes():
    return [
        {"id": "metro", "label": "Metro", "status": "normal"},
        {"id": "bus", "label": "Bus", "status": "delays"},
        {"id": "bike", "label": "Velo", "status": "available"},
        {"id": "walk", "label": "Marche", "status": "available"},
    ]


@router.get("/nearby")
async def nearby_stops(
    lat: float | None = Query(default=None),
    lon: float | None = Query(default=None),
    radius: int = Query(default=600),
    _: object = Depends(get_current_user),
):
    if lat is None or lon is None:
        return [
            {"id": "stop-001", "name": "Gare Centrale", "mode": "metro", "eta_minutes": 3},
            {"id": "stop-002", "name": "Campus Digital", "mode": "bus", "eta_minutes": 8},
        ]

    results = []

    # ── PRIM — arrêts metro/bus/RER/tram (Île-de-France) ──────────────────
    if settings.PRIM_API_KEY:
        urls_to_try = [
            f"https://prim.iledefrance-mobilites.fr/marketplace/navitia/coverage/fr-idf/coords/{lon};{lat}/places_nearby",
            f"https://prim.iledefrance-mobilites.fr/marketplace/navitia/coverage/idfm/coords/{lon};{lat}/places_nearby",
            f"https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/coverage/fr-idf/coords/{lon};{lat}/places_nearby",
        ]
        for url in urls_to_try:
            try:
                async with httpx.AsyncClient(timeout=8) as client:
                    r = await client.get(
                        url,
                        params={"type[]": "stop_point", "distance": radius, "count": 10},
                        headers={"apikey": settings.PRIM_API_KEY},
                    )
                    print(f"[PRIM] {url} → {r.status_code}")
                    if r.status_code == 404:
                        print(f"[PRIM] body: {r.text[:300]}")
                        continue
                    r.raise_for_status()
                    places = r.json().get("places_nearby", [])
                    for p in places:
                        sp = p.get("stop_point", {})
                        coord = sp.get("coord", {})
                        results.append({
                            "id": p["id"],
                            "name": p["name"],
                            "mode": _prim_mode(sp.get("physical_modes", [])),
                            "lat": float(coord.get("lat", 0)),
                            "lon": float(coord.get("lon", 0)),
                            "distance_m": int(p.get("distance", 0)),
                        })
                    print(f"[PRIM] ✅ {len(places)} arrêts trouvés via {url}")
                    break
            except Exception as e:
                print(f"[PRIM] ERREUR {url}: {e}")

    # ── JCDecaux — stations vélo ───────────────────────────────────────────
    if settings.JCDECAUX_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=6) as client:
                r = await client.get(
                    "https://api.jcdecaux.com/vls/v1/stations",
                    params={"contract": settings.JCDECAUX_CONTRACT, "apiKey": settings.JCDECAUX_API_KEY},
                )
                r.raise_for_status()
                stations = r.json()
                bike_count = 0
                for s in stations:
                    pos = s.get("position", {})
                    slat, slon = pos.get("lat"), pos.get("lng")
                    if slat is None or slon is None:
                        continue
                    dist = _haversine(lat, lon, slat, slon)
                    if dist <= radius:
                        results.append({
                            "id": str(s["number"]),
                            "name": s["name"],
                            "mode": "bike",
                            "lat": slat,
                            "lon": slon,
                            "available_bikes": s.get("available_bikes", 0),
                            "available_stands": s.get("available_bike_stands", 0),
                            "status": s.get("status", "UNKNOWN"),
                            "distance_m": round(dist),
                        })
                        bike_count += 1
            print(f"[JCDecaux] {bike_count} stations vélo dans le rayon")
        except Exception as e:
            print(f"[JCDecaux] ERREUR: {e}")

    results.sort(key=lambda x: x["distance_m"])
    return results[:15]
