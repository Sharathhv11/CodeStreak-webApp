// ── Application Constants ────────────────────────────────────────

export const EXTENSION_ID = 'ejmepeahhlppjjaooifcmebonpfppohe';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH_CALLBACK: `${BACKEND_URL}/auth/github/callback`,
  AUTH_LOGIN: `${BACKEND_URL}/auth/github`,
  SUBMISSIONS: `${BACKEND_URL}/api/submission`,
  HEATMAP: `${BACKEND_URL}/api/submission/heatmap`,
  CREATE_REPO: `${BACKEND_URL}/repo/create-repo`,
  UNLINK_REPO: `${BACKEND_URL}/repo/unlink-repo`,
  REPO_STATUS: `${BACKEND_URL}/repo/status`,
};


