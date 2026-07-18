import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const KEY = "urbanflow_gdpr";

export function GdprBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(KEY));

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(KEY, "declined");
    setVisible(false);
  };

  return (
    <div className="gdpr-banner">
      <Shield size={18} style={{ flexShrink: 0, color: "var(--green)" }} />
      <p>
        UrbanFlow utilise des données de localisation et de trajet pour améliorer votre expérience.
        Consultez notre <Link to="/privacy">politique de confidentialité</Link> (RGPD).
      </p>
      <div className="gdpr-actions">
        <button className="gdpr-decline" onClick={decline}>Refuser</button>
        <button className="gdpr-accept" onClick={accept}>Accepter</button>
      </div>
    </div>
  );
}
