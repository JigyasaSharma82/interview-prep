export async function apiRequest(path, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || https://interview-prep-5-3w8j.onrender.com;
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("prep_token")
    : null;
  const requestUrl = `${baseUrl}${path}`;
  let response;

  try {
    response = await fetch(requestUrl, {
      ...options,
      cache: "no-store",
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
  } catch (error) {
    throw new Error(
      `Could not reach the API at ${requestUrl}. Check that the backend is running and CORS allows this frontend origin.`
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message || body?.error || `API request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
