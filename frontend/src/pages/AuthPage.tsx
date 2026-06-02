import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Activity, Lock, Mail, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        await login(String(form.get("email")), String(form.get("password")));
      } else {
        const password = String(form.get("password"));
        const confirmPassword = String(form.get("confirm_password"));
        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas");
          return;
        }
        await register({
          email: String(form.get("email")),
          password,
          first_name: String(form.get("first_name")),
          last_name: String(form.get("last_name")),
          phone: String(form.get("phone") || "")
        });
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand-block auth-brand">
          <span className="brand-mark"><Activity size={22} /></span>
          <div>
            <strong>UrbanFlow</strong>
            <small>Mobility</small>
          </div>
        </div>
        <h1>Naviguez la ville avec un cockpit de mobilité en temps réel.</h1>
        <div className="flow-line">
          <span />
          <span />
          <span />
        </div>
        <div className="route-preview">
          <span>Campus</span>
          <strong>24 min</strong>
          <span>Gare Centrale</span>
        </div>
      </section>

      <form className="auth-panel" onSubmit={handleSubmit}>
        <div className="auth-icon">{mode === "login" ? <Lock size={22} /> : <UserPlus size={22} />}</div>
        <p className="eyebrow">UrbanFlow</p>
        <h1>{mode === "login" ? "Connexion" : "Créer un compte"}</h1>

        {mode === "register" && (
          <div className="form-grid">
            <label>
              Prénom
              <input name="first_name" required />
            </label>
            <label>
              Nom
              <input name="last_name" required />
            </label>
          </div>
        )}

        <label>
          Email
          <span className="input-shell"><Mail size={17} /><input name="email" type="email" required /></span>
        </label>
        <label>
          Mot de passe
          <span className="input-shell"><Lock size={17} /><input name="password" type="password" minLength={8} required /></span>
        </label>

        {mode === "register" && (
          <label>
            Confirmer mot de passe
            <span className="input-shell"><Lock size={17} /><input name="confirm_password" type="password" minLength={8} required /></span>
          </label>
        )}
        {mode === "register" && (
          <label>
            Téléphone
            <input name="phone" />
          </label>
        )}

        {error && <p className="error">{error}</p>}
        <button>{mode === "login" ? "Se connecter" : "Créer le compte"}</button>
        <Link to={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
        </Link>
      </form>
    </main>
  );
}
