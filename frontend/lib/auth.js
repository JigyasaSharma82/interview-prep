export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("prep_token");
}
