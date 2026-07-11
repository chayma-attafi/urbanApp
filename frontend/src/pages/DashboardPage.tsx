import { useEffect, useState } from "react";
import { api } from "../lib/api";

const flowBars = [72, 48, 83, 61, 37, 94, 56, 68];

export function DashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api.dashboard().then(setStats).catch(() => setStats({}));
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
