import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader, XCircle } from "lucide-react";
import { api } from "../lib/api";

export function VerifyPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Lien invalide.");
      return;
    }
    api.verifyEmail(token)
      .then((data) => {
        setMessage(data.message);
        setStatus("success");
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : "Lien invalide ou expiré.");
        setStatus("error");
      });
  }, []);

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand-block auth-brand">
          <img src="/icons/icon-512.svg" alt="UrbanFlow" width={36} height={36} style={{ borderRadius: 8, display: "block" }} />
          <div><strong>UrbanFlow</strong><small>Mobility</small></div>
        </div>
        <h1>Naviguez la ville avec un cockpit de mobilité en temps réel.</h1>
        <div className="flow-line"><span /><span /><span /></div>
      </section>

      <div className="auth-panel" style={{ textAlign: "center", gap: 20 }}>
        {status === "loading" && (
          <>
            <div className="auth-icon"><Loader size={22} className="spin" /></div>
            <p className="eyebrow">UrbanFlow</p>
            <h1>Vérification…</h1>
          </>
        )}
        {status === "success" && (
          <>
            <div className="auth-icon" style={{ background: "var(--green-dim)", color: "var(--green-dark)" }}>
              <CheckCircle size={22} />
            </div>
            <p className="eyebrow">UrbanFlow</p>
            <h1>Compte activé !</h1>
            <p style={{ color: "var(--fg-muted)" }}>{message}</p>
            <Link to="/login">Se connecter</Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="auth-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
              <XCircle size={22} />
            </div>
            <p className="eyebrow">UrbanFlow</p>
            <h1>Lien invalide</h1>
            <p style={{ color: "var(--fg-muted)" }}>{message}</p>
            <Link to="/register">Créer un compte</Link>
          </>
        )}
      </div>
    </main>
  );
}
