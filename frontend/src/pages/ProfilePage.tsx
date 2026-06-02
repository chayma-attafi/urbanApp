import { type ChangeEvent, FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL, api } from "../lib/api";

const TRANSPORT_MODES = [
  { id: "walk",    label: "Marche",      emoji: "🚶" },
  { id: "bike",    label: "Vélo",        emoji: "🚲" },
  { id: "scooter", label: "Trottinette", emoji: "🛴" },
  { id: "transit", label: "Transports",  emoji: "🚌" },
  { id: "carpool", label: "Covoiturage", emoji: "🚗" },
];

function avatarSrc(avatarUrl: string | null) {
  if (!avatarUrl) return "";
  return avatarUrl.startsWith("http") || avatarUrl.startsWith("data:")
    ? avatarUrl
    : `${BACKEND_URL}${avatarUrl}`;
}

export function ProfilePage() {
  const { profile, setProfile } = useAuth();
  const [message, setMessage]           = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarData, setAvatarData]     = useState<string | null>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>(["walk", "bike", "transit"]);
  const [reducedMobility, setReducedMobility] = useState(false);

  const toggleMode = (id: string) =>
    setSelectedModes(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const updated = await api.updateProfile({
      first_name: String(form.get("first_name")),
      last_name:  String(form.get("last_name")),
      phone:      String(form.get("phone") || ""),
      city:       String(form.get("city") || ""),
      mobility_preference: selectedModes.join(",") || "public_transport",
      ...(avatarData ? { avatar_url: avatarData } : {})
    });
    setProfile(updated);
    setAvatarPreview(updated.avatar_url);
    setAvatarData(null);
    setMessage("Profil mis à jour");
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarData(reader.result);
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!profile) return <main className="content">Profil indisponible</main>;

  return (
    <main className="content">
      <h2>Profil de mobilité</h2>
      <p className="profile-desc">Personnalisez vos préférences de déplacement.</p>

      <form onSubmit={handleSubmit}>
        {/* ── Card 1 : Informations personnelles ── */}
        <section className="profile-card">
          <div className="form-grid">
            <label>
              Prénom
              <input name="first_name" defaultValue={profile.first_name} placeholder="Marie" />
            </label>
            <label>
              Nom
              <input name="last_name" defaultValue={profile.last_name} placeholder="Dupont" />
            </label>
            <label>
              Email
              <input value={profile.email} readOnly tabIndex={-1} style={{ opacity: 0.5, cursor: "not-allowed" }} />
            </label>
            <label>
              Téléphone
              <input name="phone" defaultValue={profile.phone || ""} placeholder="+33 6 00 00 00 00" />
            </label>
            <label>
              Domicile
              <input name="city" defaultValue={profile.city} placeholder="12 rue des Lilas, Centre-ville" />
            </label>
            <label>
              Travail
              <input name="work_address" placeholder="Parc Technologique Nord" />
            </label>
          </div>

          <div className="avatar-row">
            <div className="avatar-large">
              {avatarPreview
                ? <img src={avatarSrc(avatarPreview)} alt="Avatar" />
                : `${profile.first_name[0]}${profile.last_name[0]}`}
            </div>
            <label className="avatar-upload-btn">
              Changer la photo
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>
        </section>

        {/* ── Card 2 : Préférences de mobilité ── */}
        <section className="profile-card">
          <p className="pref-label">Modes préférés</p>
          <div className="mode-tags">
            {TRANSPORT_MODES.map(mode => (
              <button
                key={mode.id}
                type="button"
                className={selectedModes.includes(mode.id) ? "mode-tag active" : "mode-tag"}
                onClick={() => toggleMode(mode.id)}
              >
                {mode.emoji} {mode.label}
              </button>
            ))}
          </div>

          <div className="pref-toggle">
            <div>
              <strong>Mobilité réduite</strong>
              <p>Itinéraires accessibles (WCAG / PMR) en priorité.</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={reducedMobility}
                onChange={e => setReducedMobility(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit">Enregistrer</button>
          {message && <p className="success">{message}</p>}
        </div>
      </form>
    </main>
  );
}
