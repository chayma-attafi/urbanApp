const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export type User = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  mobility_preference: string;
  city: string;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  user: User;
  profile: Profile | null;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur API" }));
    throw new Error(error.detail || "Erreur API");
  }

  return response.json();
}

export const api = {
  me: () => request<AuthResponse>("/auth/me"),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
    request<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  verifyEmail: (token: string) =>
    request<{ message: string }>(`/auth/verify?token=${encodeURIComponent(token)}`),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  updateProfile: (payload: Partial<Profile>) =>
    request<Profile>("/profile/me", { method: "PUT", body: JSON.stringify(payload) }),
  dashboard: () => request<Record<string, unknown>>("/demo/dashboard"),
  transportModes: () => request<Array<{ id: string; label: string; status: string }>>("/transport/modes"),
  routeEstimate: (origin: string, destination: string) =>
    request<Record<string, unknown>>(`/routing/estimate?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`),
  aiSuggest: (payload: { origin: string; destination: string; priority: string; modes: string[] }) =>
    request<{ suggestion: string; steps: string[]; co2_estimate: string; tip: string }>(
      "/ai/suggest",
      { method: "POST", body: JSON.stringify(payload) }
    ),
  aiStats: () =>
    request<{ total_trips: number; total_co2_kg: number; monthly_trips: number; monthly_co2_kg: number }>(
      "/ai/stats"
    ),
};
