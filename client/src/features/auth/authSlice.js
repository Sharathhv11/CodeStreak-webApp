import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ── Constants ────────────────────────────────────────
const API_BASE_URL = 'http://localhost:5000';
const GITHUB_CLIENT_ID = 'Ov23liQ0pxISITEzJA6b';
const GITHUB_REDIRECT_URI = `${window.location.origin}/auth/callback`;

// ── Async Thunks ─────────────────────────────────────

/** Login with email & password */
export const loginWithCredentials = createAsyncThunk(
    'auth/loginWithCredentials',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                return rejectWithValue(error.message || 'Invalid credentials');
            }

            const data = await response.json();
            localStorage.setItem('codestreak_token', data.token);
            return data;
        } catch (error) {
            return rejectWithValue('Network error. Please try again.');
        }
    }
);

/** Initiate GitHub OAuth */
export const loginWithGitHub = createAsyncThunk(
    'auth/loginWithGitHub',
    async (_, { rejectWithValue }) => {
        try {
            const scope = 'repo,user';
            const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=${scope}`;
            window.location.href = githubAuthUrl;
            return { redirecting: true };
        } catch (error) {
            return rejectWithValue('Failed to initiate GitHub login');
        }
    }
);

/** Exchange GitHub code for token */
export const exchangeGitHubCode = createAsyncThunk(
    'auth/exchangeGitHubCode',
    async (code, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/github/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                const error = await response.json();
                return rejectWithValue(error.message || 'GitHub authentication failed');
            }

            const data = await response.json();
            localStorage.setItem('codestreak_token', data.token || data.access_token);
            return data;
        } catch (error) {
            return rejectWithValue('Network error during GitHub authentication');
        }
    }
);

// ── Slice ────────────────────────────────────────────

const initialState = {
    user: null,
    token: localStorage.getItem('codestreak_token') || null,
    isAuthenticated: !!localStorage.getItem('codestreak_token'),
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('codestreak_token');
        },
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login with credentials
            .addCase(loginWithCredentials.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginWithCredentials.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(loginWithCredentials.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // GitHub OAuth
            .addCase(loginWithGitHub.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginWithGitHub.fulfilled, (state) => {
                state.isLoading = true; // Keep loading since we're redirecting
            })
            .addCase(loginWithGitHub.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Exchange GitHub code
            .addCase(exchangeGitHubCode.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(exchangeGitHubCode.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token || action.payload.access_token;
            })
            .addCase(exchangeGitHubCode.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
