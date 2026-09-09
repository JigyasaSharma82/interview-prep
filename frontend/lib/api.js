export async function apiRequest(path, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("prep_token")
    : null;
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `API request failed: ${response.status}`);
  }

  return response.json();
}
