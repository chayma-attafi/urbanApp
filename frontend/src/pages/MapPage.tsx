import { FormEvent, useEffect, useState } from "react";
import { Bike, Bus, Footprints, Leaf, Loader, LocateFixed, Navigation, Sparkles, TrainFront, Zap } from "lucide-react";
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

const TUNIS: [number, number] = [36.8065, 10.1815];

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

  useEffect(() => {
    api.transportModes().then(setModes).catch(() => setModes([]));
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
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
        } catch {
          setError("Impossible de déterminer votre adresse");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Permission de localisation refusée");
        setLocating(false);
      },
      { timeout: 8000 }
    );
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
        <button>
          <Navigation size={18} />
          Nouveau trajet
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
        <MapContainer center={TUNIS} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl>
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

      <section className="list-row">
        {modes.map((mode) => (
          <article className="metric-card" key={mode.id}>
            <span>{mode.label}</span>
            <strong>{mode.status}</strong>
          </article>
        ))}
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
                >
                  {locating ? <Loader size={14} className="spin" /> : <LocateFixed size={14} />}
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

          <button type="submit" className="ai-submit" disabled={loading}>
            {loading
              ? <><Loader size={16} className="spin" /> Analyse en cours…</>
              : <><Sparkles size={16} /> Suggérer un itinéraire</>}
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
