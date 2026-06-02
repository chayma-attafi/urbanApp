import { Bell, Database, Smartphone } from "lucide-react";

const settings = [
  { icon: Bell, label: "Notifications trajet", enabled: true },
  { icon: Smartphone, label: "Mode PWA active", enabled: true },
  { icon: Database, label: "Donnees demo uniquement", enabled: false }
];

export function SettingsPage() {
  return (
    <main className="content">
      <p className="eyebrow">Parametres</p>
      <h2>UrbanFlow controls</h2>
      <section className="settings-grid">
        {settings.map(({ icon: Icon, label, enabled }) => (
          <label className="setting-tile" key={label}>
            <span><Icon size={20} />{label}</span>
            <input type="checkbox" defaultChecked={enabled} />
          </label>
        ))}
      </section>
    </main>
  );
}
