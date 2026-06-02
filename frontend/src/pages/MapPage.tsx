import { useEffect, useState } from "react";
import { Bike, Bus, Footprints, MapPin, Navigation, TrainFront } from "lucide-react";
import { api } from "../lib/api";

const modeIcons = {
  metro: TrainFront,
  bus: Bus,
  bike: Bike,
  walk: Footprints
};

export function MapPage() {
  const [modes, setModes] = useState<Array<{ id: string; label: string; status: string }>>([]);
  const [activeMode, setActiveMode] = useState("metro");

  useEffect(() => {
    api.transportModes().then(setModes).catch(() => setModes([]));
  }, []);

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
          <p className="eyebrow">Trajet recommande</p>
          <strong>Campus / Gare Centrale</strong>
          <span>24 min · 1 correspondance · 1.4 kg CO2 economise</span>
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
    </main>
  );
}
