/**
 * API utility module for communicating with the backend server.
 */

const API_BASE_URL = 'http://localhost:5000';

/**
 * Sends the GitHub authorization code to the backend for token exchange.
 * @param {string} code - The GitHub OAuth authorization code.
 * @returns {Promise<object>} - The response from the backend.
 */
async function exchangeCodeForToken(code) {
  const response = await fetch(`${API_BASE_URL}/auth/github/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }

  return response.json();
}
