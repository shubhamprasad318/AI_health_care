/**
 * Access-token storage for cross-site deployments.
 *
 * When the frontend and API live on different sites (e.g. two *.onrender.com
 * subdomains), browsers don't send the SameSite=Lax session cookie, so every
 * request also carries the JWT as a Bearer header. The backend accepts either.
 */

const TOKEN_KEY = "access_token";

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode); the session cookie still works same-site
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
