import { BarChart3, LogOut, Map, Settings, User } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../lib/api";

const links = [
  { to: "/", label: "Carte", icon: Map },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/profile", label: "Profil", icon: User },
  { to: "/settings", label: "Parametres", icon: Settings }
];

export function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith("http") || profile.avatar_url.startsWith("data:")
      ? profile.avatar_url
      : `${BACKEND_URL}${profile.avatar_url}`
    : null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app-shell" style={{ minHeight: "100dvh" }}>
      {/* Mobile-only top bar */}
      <header className="mobile-topbar">
        <div className="brand-block">
          <img src="/icons/icon-512.svg" alt="UrbanFlow" width={30} height={30} style={{ borderRadius: 6, display: "block" }} />
          <div><strong>UrbanFlow</strong><small>Mobility</small></div>
        </div>
        <button onClick={handleLogout} aria-label="Se déconnecter">
          <LogOut size={18} aria-hidden="true" />
        </button>
      </header>

      <aside className="sidebar">
        <div className="brand-block">
          <img src="/icons/icon-512.svg" alt="UrbanFlow" width={36} height={36} style={{ borderRadius: 8, display: "block" }} />
          <div>
            <strong>UrbanFlow</strong>
            <small>Mobility</small>
          </div>
        </div>
        <div className="sidebar-profile" style={{ flex: 1 }}>
          <div className="avatar-small">
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : <User size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="eyebrow">Session active</p>
            <h1>{profile ? `${profile.first_name} ${profile.last_name}` : "MVP"}</h1>
          </div>
          <div className="live-dot" title="En ligne" />
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="ghost-button" onClick={handleLogout} aria-label="Se déconnecter">
          <LogOut size={18} aria-hidden="true" />
          Déconnexion
        </button>
      </aside>
      <Outlet />
    </div>
  );
}
