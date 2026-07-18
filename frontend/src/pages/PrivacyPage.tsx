import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function PrivacyPage() {
  return (
    <main className="content" style={{ maxWidth: 720 }}>
      <p className="eyebrow">Légal</p>
      <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Shield size={22} color="var(--green)" />
        Politique de confidentialité
      </h2>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
        Dernière mise à jour : juillet 2025 — Conforme au RGPD (Règlement UE 2016/679)
      </p>

      <section style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 24 }}>

        <div>
          <h3>1. Données collectées</h3>
          <ul style={{ color: "var(--fg-muted)", lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Compte</strong> : adresse email, prénom, nom, téléphone (optionnel)</li>
            <li><strong>Trajets planifiés</strong> : origine, destination, mode de transport, estimation CO₂</li>
            <li><strong>Localisation</strong> : position GPS utilisée uniquement en temps réel pour centrer la carte et suggérer des arrêts proches — non stockée en base</li>
          </ul>
        </div>

        <div>
          <h3>2. Finalités du traitement</h3>
          <ul style={{ color: "var(--fg-muted)", lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Authentification et gestion de compte</li>
            <li>Suggestion d'itinéraires multimodaux par IA</li>
            <li>Calcul et suivi de votre empreinte carbone personnelle</li>
            <li>Affichage des transports en commun et stations vélo à proximité</li>
          </ul>
        </div>

        <div>
          <h3>3. Base légale</h3>
          <p style={{ color: "var(--fg-muted)", lineHeight: 1.8 }}>
            Le traitement est fondé sur votre consentement (Art. 6.1.a RGPD) et l'exécution du contrat de service (Art. 6.1.b).
          </p>
        </div>

        <div>
          <h3>4. Durée de conservation</h3>
          <ul style={{ color: "var(--fg-muted)", lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Données de compte : jusqu'à suppression du compte</li>
            <li>Historique de trajets : jusqu'à suppression du compte</li>
          </ul>
        </div>

        <div>
          <h3>5. Partage des données</h3>
          <p style={{ color: "var(--fg-muted)", lineHeight: 1.8 }}>
            Vos données ne sont pas vendues ni cédées à des tiers. Elles transitent uniquement vers :
          </p>
          <ul style={{ color: "var(--fg-muted)", lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Supabase</strong> (hébergement base de données, UE)</li>
            <li><strong>Groq / Meta Llama</strong> (suggestions IA — origine/destination uniquement, sans identifiant)</li>
            <li><strong>Nominatim / OpenStreetMap</strong> (géocodage, données anonymes)</li>
            <li><strong>PRIM / JCDecaux</strong> (données transport, position approximative)</li>
          </ul>
        </div>

        <div>
          <h3>6. Vos droits (RGPD)</h3>
          <p style={{ color: "var(--fg-muted)", lineHeight: 1.8 }}>
            Vous disposez des droits suivants : accès, rectification, effacement, portabilité, opposition.
          </p>
          <ul style={{ color: "var(--fg-muted)", lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Consulter / modifier</strong> vos données : page <Link to="/profile">Profil</Link></li>
            <li><strong>Supprimer votre compte</strong> et toutes vos données : page <Link to="/settings">Paramètres</Link></li>
            <li><strong>Contact</strong> : chaymaattafi3@gmail.com</li>
          </ul>
        </div>

      </section>

      <div style={{ marginTop: 32 }}>
        <Link to="/" style={{ color: "var(--green-dark)", fontWeight: 600 }}>← Retour à l'application</Link>
      </div>
    </main>
  );
}
