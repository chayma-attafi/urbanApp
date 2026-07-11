import { FormEvent, useEffect, useState } from "react";
import { Bike, Bus, Footprints, Leaf, Loader, MapPin, Navigation, Sparkles, TrainFront, Zap } from "lucide-react";
import { api } from "../lib/api";

const modeIcons = {
  metro: TrainFront,
  bus: Bus,
  bike: Bike,
  walk: Footprints
};

const PRIORITIES = [
  { id: "eco",        label: "Éco",        icon: Leaf },
  { id: "fast",       label: "Rapide",     icon: Zap },
  { id: "accessible", label: "Accessible", icon: Navigation },
];

type AIResult = { suggestion: string; steps: string[]; co2_estimate: string; tip: string } | null;

export function MapPage() {
  const [modes, setModes] = useState<Array<{ id: string; label: string; status: string }>>([]);
  const [activeMode, setActiveMode] = useState("metro");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [priority, setPriority] = useState("eco");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.transportModes().then(setModes).catch(() => setModes([]));
  }, []);

  const handleAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await api.aiSuggest({
        origin: origin.trim(),
        destination: destination.trim(),
        priority,
        modes: ["walk", "transit", "bike"],
      });
      setResult(data);
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
        <div className="map-grid" />
        <div className="flow-route route-a" />
        <div className="flow-route route-b" />
        <div className="flow-route route-c" />
        <div className="map-marker primary pulse">
          <MapPin size={22} />
          Campus
        </div>
        <div className="map-marker secondary">Metro 3 min</div>
        <div className="map-marker tertiary">Bike hub 6 libres</div>
        <aside className="map-panel">
          <p className="eyebrow">Trajet recommandé</p>
          <strong>Campus / Gare Centrale</strong>
          <span>24 min · 1 correspondance · 1.4 kg CO₂ économisé</span>
        </aside>
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
              <input
                placeholder="Ex : Campus Esprit, Ariana"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                required
              />
            </label>
            <label>
              Arrivée
              <input
                placeholder="Ex : Gare de Tunis, Tunis"
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
            {loading ? <><Loader size={16} className="spin" /> Analyse en cours…</> : <><Sparkles size={16} /> Suggérer un itinéraire</>}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="ai-result">
            <p className="ai-suggestion">{result.suggestion}</p>
            <ol className="ai-steps">
              {result.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
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
