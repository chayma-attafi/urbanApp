import { useState } from "react";
import { Bell, Database, Shield, Smartphone, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const toggles = [
  { icon: Bell,       label: "Notifications trajet", enabled: true },
  { icon: Smartphone, label: "Mode PWA active",       enabled: true },
  { icon: Database,   label: "Données démo uniquement", enabled: false },
];

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount();
      await logout();
      navigate("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
      setDeleting(false);
      setConfirm(false);
    }
  };

  return (
    <main className="content">
      <p className="eyebrow">Paramètres</p>
      <h2>UrbanFlow controls</h2>

      <section className="settings-grid">
        {toggles.map(({ icon: Icon, label, enabled }) => (
          <label className="setting-tile" key={label}>
            <span><Icon size={20} />{label}</span>
            <input type="checkbox" defaultChecked={enabled} />
          </label>
        ))}
      </section>

      {/* ── RGPD — Données personnelles ── */}
      <section style={{ marginTop: 32, padding: "20px 24px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Shield size={18} color="var(--green)" />
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Données personnelles — RGPD</h3>
        </div>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
          Conformément au RGPD, vous pouvez supprimer définitivement votre compte et toutes vos données (trajets, profil, historique CO₂).
        </p>

        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: confirm ? "#ef4444" : "var(--surface)",
            color: confirm ? "#fff" : "#ef4444",
            border: "1px solid #ef4444",
            borderRadius: 8, padding: "8px 16px",
            cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
            transition: "all .2s",
          }}
        >
          <Trash2 size={15} />
          {deleting ? "Suppression…" : confirm ? "Confirmer — supprimer définitivement" : "Supprimer mon compte"}
        </button>
        {confirm && (
          <p style={{ fontSize: "0.78rem", color: "#ef4444", marginTop: 6 }}>
            Cette action est irréversible. Cliquez à nouveau pour confirmer.
          </p>
        )}
      </section>
    </main>
  );
}
