export async function apiRequest(path, options = {}) {
  const response = await fetch(path, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
