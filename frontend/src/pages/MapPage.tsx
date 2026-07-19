import { FormEvent, useEffect, useState } from "react";
import { Bike, Bus, Clock, Footprints, Leaf, Loader, LocateFixed, Navigation, Sparkles, TrainFront, X, Zap } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { api } from "../lib/api";

function makeIcon(bg: string, text: string, anchor: [number, number]) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:#fff;padding:6px 11px;border-radius:9px;font-size:12px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.25);white-space:nowrap">${text}</div>`,
    iconAnchor: anchor,
  });
}

function FlyTo({ pos, zoom }: { pos: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(pos, zoom, { animate: true, duration: 1.2 });
  }, [pos[0], pos[1], zoom]);
  return null;
}

async function geocodeQuery(query: string): Promise<[number, number] | null> {
  try {
    const variants = [
      query,
      `${query}, Tunis`,
      `${query}, Tunisie`,
      `${query}, Tunisia`,
      `${query}, France`,
    ];
    for (const q of variants) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=fr`
      );
      const data = await res.json();
      if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch {}
  return null;
}

async function fetchRoute(from: [number, number], to: [number, number]): Promise<[number, number][]> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates?.length > 1) {
      return data.routes[0].geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
    }
  } catch (e) {
    console.warn("OSRM routing failed, using straight line", e);
  }
  return [from, to]; // straight line fallback
}

const modeIcons = { metro: TrainFront, bus: Bus, bike: Bike, walk: Footprints };

const PRIORITIES = [
  { id: "eco",        label: "Éco",        icon: Leaf },
  { id: "fast",       label: "Rapide",     icon: Zap },
  { id: "accessible", label: "Accessible", icon: Navigation },
];

type AIResult = { suggestion: string; steps: string[]; co2_estimate: string; tip: string } | null;
type RouteMarkers = { origin: [number, number]; dest: [number, number] } | null;
type CachedRoute = { result: NonNullable<AIResult>; origin: string; destination: string; priority: string; timestamp: number };
const CACHE_KEY = "uf_last_itinerary";

const PARIS: [number, number] = [48.8566, 2.3522];

export function MapPage() {
  const [modes, setModes] = useState<Array<{ id: string; label: string; status: string }>>([]);
  const [activeMode, setActiveMode] = useState("metro");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [priority, setPriority] = useState("eco");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<AIResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [routeMarkers, setRouteMarkers] = useState<RouteMarkers>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom: number } | null>(null);
  const [bikeStations, setBikeStations] = useState<Array<{ id: string; name: string; mode: string; lat: number; lon: number; available_bikes: number; available_stands: number; status: string; distance_m: number }>>([]);
  const [lastCached, setLastCached] = useState<CachedRoute | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    api.transportModes().then(setModes).catch(() => setModes([]));
    // Restore last cached itinerary from localStorage
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const c = JSON.parse(raw) as CachedRoute;
        if (Date.now() - c.timestamp < 24 * 60 * 60 * 1000) setLastCached(c);
      }
    } catch {}
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur");
      return;
    }
    setLocating(true);
    setError(null);

    const onSuccess = async (pos: GeolocationPosition) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`
        );
        const data = await res.json();
        const addr = data.address;
        const parts = [addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town || addr.village].filter(Boolean);
        setOrigin(parts.length ? parts.join(", ") : data.display_name.split(",").slice(0, 2).join(",").trim());
        setUserPos([latitude, longitude]);
        setFlyTarget({ pos: [latitude, longitude], zoom: 15 });
        api.transportNearby(latitude, longitude)
          .then(d => setBikeStations(d.filter(s => s.lat != null) as typeof bikeStations))
          .catch(() => null);
      } catch {
        setError("Impossible de déterminer votre adresse");
      } finally {
        setLocating(false);
      }
    };

    const onError = (err: GeolocationPositionError, retried = false) => {
      if (err.code === 3 && !retried) {
        // Timeout with high accuracy → retry with network-based location (faster on mobile)
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (e) => onError(e, true),
          { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 }
        );
        return;
      }
      if (err.code === 1) {
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setError(
          isIos
            ? "Localisation refusée. Allez dans Réglages → Confidentialité → Service de localisation → Safari/UrbanFlow → Autoriser"
            : "Localisation refusée. Autorisez l'accès dans les paramètres de votre navigateur ou de l'application."
        );
      } else if (err.code === 2) {
        setError("Position indisponible. Vérifiez que le GPS est activé sur votre appareil.");
      } else {
        setError("Délai dépassé. Placez-vous dans un endroit avec meilleur signal GPS.");
      }
      setLocating(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 30000,
    });
  };

  // ── TEST ONLY — hardcoded Paris Campus Numérique coords ──────────────────
  const handleTestParis = async () => {
    const lat = 48.8604;
    const lon = 2.3477; // Châtelet-Les Halles, Paris — hub transport dense
    setUserPos([lat, lon]);
    setFlyTarget({ pos: [lat, lon], zoom: 15 });
    setOrigin("Châtelet-Les Halles, Paris");
    setBikeStations([]);
    try {
      const data = await api.transportNearby(lat, lon);
      setBikeStations(data.filter(s => s.lat != null) as typeof bikeStations);
    } catch (e) {
      setError("Erreur transport : " + (e instanceof Error ? e.message : "inconnue"));
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const restoreCached = () => {
    if (!lastCached) return;
    setOrigin(lastCached.origin);
    setDestination(lastCached.destination);
    setPriority(lastCached.priority);
    setResult(lastCached.result);
    setError(null);
    setLastCached(null);
  };

  const handleAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setRouteMarkers(null);
    setRoutePath([]);
    try {
      const [data, originPos, destPos] = await Promise.all([
        api.aiSuggest({ origin: origin.trim(), destination: destination.trim(), priority, modes: ["walk", "transit", "bike"] }),
        geocodeQuery(origin.trim()),
        geocodeQuery(destination.trim()),
      ]);
      setResult(data);
      // Persist to localStorage so the last itinerary survives page reload / offline
      const toCache: CachedRoute = { result: data, origin: origin.trim(), destination: destination.trim(), priority, timestamp: Date.now() };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(toCache)); } catch {}
      setLastCached(null); // dismiss banner now that we have a fresh result
      if (originPos) setFlyTarget({ pos: originPos, zoom: 13 });
      if (originPos && destPos) {
        setRouteMarkers({ origin: originPos, dest: destPos });
        const path = await fetchRoute(originPos, destPos);
        setRoutePath(path);
        setFlyTarget({
          pos: [(originPos[0] + destPos[0]) / 2, (originPos[1] + destPos[1]) / 2],
          zoom: 11,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="content">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Live map</p>
          <h2>UrbanFlow network</h2>
        </div>
        <button type="button" onClick={handleTestParis} aria-label="Tester les transports à Paris">
          <Navigation size={18} aria-hidden="true" />
          Test PRIM · Paris
        </button>
      </section>

      <section className="mode-strip">
        {modes.map((mode) => {
          const Icon = modeIcons[mode.id as keyof typeof modeIcons] || Navigation;
          return (
            <button
              className={activeMode === mode.id ? "mode-pill active" : "mode-pill"}
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              type="button"
            >
              <Icon size={18} />
              {mode.label}
            </button>
          );
        })}
      </section>

      <section className="map-surface">
        <MapContainer center={PARIS} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {flyTarget && <FlyTo pos={flyTarget.pos} zoom={flyTarget.zoom} />}
          {userPos && (
            <Marker position={userPos} icon={makeIcon("#22C55E", "📍 Ma position", [55, 28])}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}
          {bikeStations.filter(s => {
            if (activeMode === "metro") return ["metro", "rer", "tram"].includes(s.mode);
            if (activeMode === "bus")   return s.mode === "bus";
            if (activeMode === "bike")  return s.mode === "bike";
            return false; // walk → aucun marqueur transport
          }).map(s => {
            const modeStyle: Record<string, { bg: string; emoji: string }> = {
              metro: { bg: "#6366f1", emoji: "🚇" },
              rer:   { bg: "#1e3a8a", emoji: "🚆" },
              tram:  { bg: "#3b82f6", emoji: "🚃" },
              bus:   { bg: "#f97316", emoji: "🚌" },
              bike:  { bg: s.available_bikes > 0 ? "#22C55E" : "#9ca3af", emoji: "🚲" },
            };
            const style = modeStyle[s.mode] ?? { bg: "#64748b", emoji: "📍" };
            const label = s.mode === "bike"
              ? `${style.emoji} ${s.available_bikes}`
              : `${style.emoji} ${s.name.split(" - ")[0].slice(0, 12)}`;
            return (
              <Marker key={s.id} position={[s.lat, s.lon]} icon={makeIcon(style.bg, label, [50, 14])}>
                <Popup>
                  <strong>{s.name}</strong><br />
                  {s.mode === "bike"
                    ? <>{s.available_bikes} vélo{s.available_bikes !== 1 ? "s" : ""} · {s.available_stands} place{s.available_stands !== 1 ? "s" : ""}</>
                    : <>{s.mode.toUpperCase()}</>
                  }<br />
                  <small>{s.distance_m} m</small>
                </Popup>
              </Marker>
            );
          })}
          {routeMarkers && (
            <>
              <Marker position={routeMarkers.origin} icon={makeIcon("#176b87", "🚩 Départ", [40, 28])}>
                <Popup>{origin}</Popup>
              </Marker>
              <Marker position={routeMarkers.dest} icon={makeIcon("#f59e0b", "🏁 Arrivée", [40, 28])}>
                <Popup>{destination}</Popup>
              </Marker>
              {routePath.length > 0 && (
                <Polyline
                  positions={routePath}
                  pathOptions={{ color: "#22C55E", weight: 5, opacity: 0.85 }}
                />
              )}
            </>
          )}
        </MapContainer>

        {result && (
          <aside className="map-panel">
            <p className="eyebrow">Trajet recommandé</p>
            <strong>{origin} → {destination}</strong>
            <span>{result.co2_estimate}</span>
          </aside>
        )}
      </section>

      {/* ── AI Route Planner ── */}
      <section className="ai-planner">
        <div className="ai-planner-header">
          <span className="ai-badge"><Sparkles size={15} /> IA</span>
          <div>
            <h3>Planificateur intelligent</h3>
            <p>UrbanFlow suggère votre meilleur itinéraire multimodal</p>
          </div>
        </div>

        {lastCached && !result && (
          <div className={`cached-banner${isOffline ? " cached-banner--offline" : ""}`}>
            <Clock size={14} aria-hidden="true" />
            <span>
              {isOffline ? "Hors ligne — " : ""}Dernier itinéraire : <strong>{lastCached.origin} → {lastCached.destination}</strong>
            </span>
            <button type="button" className="cached-restore" onClick={restoreCached}>Restaurer</button>
            <button type="button" className="cached-dismiss" onClick={() => setLastCached(null)} aria-label="Fermer">
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        )}

        <form className="ai-form" onSubmit={handleAI}>
          <div className="ai-inputs">
            <label>
              Départ
              <div className="input-with-btn">
                <input
                  placeholder="Ex : Campus Paris, France"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="locate-btn"
                  onClick={handleLocate}
                  disabled={locating}
                  title="Utiliser ma position actuelle"
                  aria-label="Utiliser ma position GPS comme point de départ"
                >
                  {locating ? <Loader size={14} className="spin" aria-hidden="true" /> : <LocateFixed size={14} aria-hidden="true" />}
                </button>
              </div>
            </label>
            <label>
              Arrivée
              <input
                placeholder="Ex : Gare de France"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="ai-priority">
            {PRIORITIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={priority === id ? "priority-pill active" : "priority-pill"}
                onClick={() => setPriority(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <button type="submit" className="ai-submit" disabled={loading} aria-label="Lancer la suggestion d'itinéraire par IA">
            {loading
              ? <><Loader size={16} className="spin" aria-hidden="true" /> Analyse en cours…</>
              : <><Sparkles size={16} aria-hidden="true" /> Suggérer un itinéraire</>}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="ai-result">
            <p className="ai-suggestion">{result.suggestion}</p>
            <ol className="ai-steps">
              {(result.steps ?? []).map((step, i) => <li key={i}>{step}</li>)}
            </ol>
            <div className="ai-meta">
              <span className="ai-co2"><Leaf size={14} /> {result.co2_estimate}</span>
              <span className="ai-tip">💡 {result.tip}</span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
