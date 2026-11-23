
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("gameverse_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export const gameverseAPI = {
  register: (details) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
    }),

  login: async (details) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(details),
    });

    localStorage.setItem("gameverse_token", data.token);
    return data;
  },

  getApps: (search = "") =>
    apiRequest(`/apps?search=${encodeURIComponent(search)}`),

  getApp: (slug) =>
    apiRequest(`/apps/${slug}`),

  startQuiz: (slug) =>
    apiRequest(`/apps/${slug}/quiz`, {
      method: "POST",
    }),

  submitQuiz: (slug, sessionId, answers) =>
    apiRequest(`/apps/${slug}/submit`, {
      method: "POST",
      body: JSON.stringify({ sessionId, answers }),
    }),

  checkAccess: (slug) =>
    apiRequest(`/apps/${slug}/access`),

  logout: () => {
    localStorage.removeItem("gameverse_token");
  },
};
