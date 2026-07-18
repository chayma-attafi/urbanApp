import { useEffect, useState } from "react";
import { Leaf, Navigation, TrendingUp, Zap } from "lucide-react";
import { api } from "../lib/api";

type CO2Stats  = { total_trips: number; total_co2_kg: number; monthly_trips: number; monthly_co2_kg: number };
type WeekDay   = { date: string; trips: number; co2_kg: number };
type Priority  = { priority: string; count: number };

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  eco:        { label: "Éco",        color: "#22C55E" },
  fast:       { label: "Rapide",     color: "#F59E0B" },
  accessible: { label: "Accessible", color: "#6366F1" },
};

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function dayLabel(iso: string) {
  const d = new Date(iso);
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

export function DashboardPage() {
  const [co2, setCo2]             = useState<CO2Stats | null>(null);
  const [weekly, setWeekly]       = useState<WeekDay[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);

  useEffect(() => {
    api.aiStats().then(setCo2).catch(() => null);
    api.aiWeekly().then(setWeekly).catch(() => null);
    api.aiPriorities().then(setPriorities).catch(() => null);
  }, []);

  const avgCo2 = co2 && co2.total_trips > 0
    ? (co2.total_co2_kg / co2.total_trips).toFixed(1)
    : "—";

  const favPriority = priorities.length > 0
    ? priorities.reduce((a, b) => (b.count > a.count ? b : a))
    : null;

  const maxTrips = Math.max(...weekly.map(d => d.trips), 1);
  const totalPriorities = priorities.reduce((s, p) => s + p.count, 0);

  return (
    <main className="content">
      <p className="eyebrow">Dashboard</p>
      <h2>Mes mobilités</h2>

      {/* ── KPI cards ── */}
      <section className="list-row">
        <article className="metric-card">
          <TrendingUp size={22} color="var(--green)" />
          <span>Trajets planifiés</span>
          <strong>{co2?.total_trips ?? "—"}</strong>
        </article>
        <article className="metric-card">
          <Leaf size={22} color="var(--green)" />
          <span>CO₂ ce mois</span>
          <strong>{co2?.monthly_co2_kg ?? "—"} kg</strong>
        </article>
        <article className="metric-card">
          <Zap size={22} color="var(--amber)" />
          <span>CO₂ moyen / trajet</span>
          <strong>{avgCo2} kg</strong>
        </article>
        <article className="metric-card">
          <Navigation size={22} color="var(--green-dark)" />
          <span>Priorité favorite</span>
          <strong>{favPriority ? (PRIORITY_LABELS[favPriority.priority]?.label ?? favPriority.priority) : "—"}</strong>
        </article>
      </section>

      {/* ── CO₂ banner ── */}
      {co2 && (
        <section className="co2-banner">
          <div className="co2-icon"><Leaf size={22} /></div>
          <div className="co2-body">
            <p className="eyebrow">Empreinte carbone évitée</p>
            <h3>{co2.monthly_co2_kg} kg CO₂ ce mois</h3>
            <p>
              {co2.monthly_trips} trajet{co2.monthly_trips > 1 ? "s" : ""} planifié{co2.monthly_trips > 1 ? "s" : ""} · {co2.total_co2_kg} kg au total
            </p>
          </div>
          <div className="co2-total">
            <strong>{co2.total_trips}</strong>
            <span>trajets</span>
          </div>
        </section>
      )}

      <section className="flow-dashboard">
        {/* ── Bar chart — trajets 7 derniers jours ── */}
        <article className="flow-card wide">
          <p className="eyebrow">7 derniers jours</p>
          <h3>Trajets planifiés</h3>
          {weekly.every(d => d.trips === 0) ? (
            <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginTop: 12 }}>
              Aucun trajet cette semaine — utilisez le planificateur IA pour commencer.
            </p>
          ) : (
            <div className="bar-flow" style={{ alignItems: "flex-end", gap: 8 }}>
              {weekly.map((d, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                  <span
                    style={{
                      height: `${Math.round((d.trips / maxTrips) * 100)}%`,
                      minHeight: d.trips > 0 ? 8 : 3,
                      background: d.trips > 0 ? "var(--green)" : "var(--line-hi)",
                      borderRadius: 4,
                      width: "100%",
                      display: "block",
                      transition: "height .3s",
                    }}
                  />
                  <span style={{ fontSize: 10, color: "var(--fg-muted)" }}>{dayLabel(d.date)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* ── Répartition priorités ── */}
        <article className="flow-card">
          <p className="eyebrow">Répartition</p>
          <h3>Par priorité</h3>
          {priorities.length === 0 ? (
            <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginTop: 12 }}>Aucune donnée</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {(["eco", "fast", "accessible"] as const).map(key => {
                const p = priorities.find(x => x.priority === key);
                const count = p?.count ?? 0;
                const pct = totalPriorities > 0 ? Math.round((count / totalPriorities) * 100) : 0;
                const { label, color } = PRIORITY_LABELS[key];
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--fg-muted)" }}>{label}</span>
                      <span style={{ fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ background: "var(--line-hi)", borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: "100%", transition: "width .4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
