import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { api } from "../lib/api";

const flowBars = [72, 48, 83, 61, 37, 94, 56, 68];

type CO2Stats = { total_trips: number; total_co2_kg: number; monthly_trips: number; monthly_co2_kg: number };

export function DashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [co2, setCo2] = useState<CO2Stats | null>(null);

  useEffect(() => {
    api.dashboard().then(setStats).catch(() => setStats({}));
    api.aiStats().then(setCo2).catch(() => null);
  }, []);

  return (
    <main className="content">
      <p className="eyebrow">Dashboard</p>
      <h2>Flux urbains</h2>
      <section className="list-row">
        {Object.entries(stats).map(([key, value]) => (
          <article className="metric-card" key={key}>
            <img src="/icons/icon-192.svg" alt="UrbanFlow" width={28} height={28} style={{ borderRadius: 6 }} />
            <span>{key.replaceAll("_", " ")}</span>
            <strong>{String(value)}</strong>
          </article>
        ))}
      </section>
      {co2 && (
        <section className="co2-banner">
          <div className="co2-icon"><Leaf size={22} /></div>
          <div className="co2-body">
            <p className="eyebrow">Empreinte carbone évitée</p>
            <h3>{co2.monthly_co2_kg} kg CO₂ ce mois</h3>
            <p>{co2.monthly_trips} trajet{co2.monthly_trips > 1 ? "s" : ""} planifié{co2.monthly_trips > 1 ? "s" : ""} · {co2.total_co2_kg} kg au total</p>
          </div>
          <div className="co2-total">
            <strong>{co2.total_trips}</strong>
            <span>trajets</span>
          </div>
        </section>
      )}

      <section className="flow-dashboard">
        <article className="flow-card wide">
          <p className="eyebrow">Demand heat</p>
          <h3>Activite par tranche</h3>
          <div className="bar-flow">
            {flowBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
          </div>
        </article>
        <article className="flow-card">
          <p className="eyebrow">Etat reseau</p>
          <h3>Stable</h3>
          <div className="status-orbit"><span /></div>
        </article>
      </section>
    </main>
  );
}
