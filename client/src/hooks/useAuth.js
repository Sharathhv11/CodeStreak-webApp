import { useEffect, useState, useCallback } from 'react';
import { EXTENSION_ID, API_ENDPOINTS } from '../utils/constants';

// ── Authentication Hook ─────────────────────────────────────────

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  // Exchange OAuth code on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return;

    window.history.replaceState({}, document.title, "/");
    setLoading(true);

    fetch(`${API_ENDPOINTS.AUTH_CALLBACK}?code=${code}`)
      .then(res => res.json())
      .then(data => {
        const { token: receivedToken, user: receivedUser } = data;
        if (!receivedToken) throw new Error("No token in response");

        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);

        if (window.chrome?.runtime) {
          window.chrome.runtime.sendMessage(
            EXTENSION_ID,
            { type: "AUTH_TOKEN", token: receivedToken, user: receivedUser },
            (response) => console.log("extension ack →", response)
          );
        }
      })
      .catch(err => console.error("Auth error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(''); setUser(null);
    if (window.chrome?.runtime) {
      window.chrome.runtime.sendMessage(EXTENSION_ID, { type: "LOGOUT" });
    }
  }, []);

  const handleGithubLogin = () => { window.location.href = API_ENDPOINTS.AUTH_LOGIN; };

  const updateUser = useCallback((newUser) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  return { token, user, loading, handleLogout, handleGithubLogin, updateUser };
}
