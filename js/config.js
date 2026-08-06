// ============================================
// STADIA API Configuration File
// Base URL: https://inspire-api.gital.me
// ============================================

const API_CONFIG = {
    BASE_URL: 'https://inspire-api.gital.me/api/v1',
    STORAGE_KEYS: {
        TOKEN: 'stadia_auth_token',
        REFRESH_TOKEN: 'stadia_refresh_token',
        USER: 'stadia_user'
    }
};

// ============================================
// Core API Client with token refresh support
// ============================================
class APIClient {
    constructor(baseURL = API_CONFIG.BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Main request method that handles auth, token refresh, and errors
     */
    async request(endpoint, options = {}) {
        const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
        const headers = new Headers(options.headers || {});

        // Set content type for JSON unless it's FormData
        if (!(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }
        headers.set('Accept', 'application/json');

        // Add auth token if available
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const REQUEST_TIMEOUT_MS = 15000;

        let response;
        try {
            response = await this._fetchWithTimeout(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
                mode: 'cors',
                credentials: 'include'
            }, REQUEST_TIMEOUT_MS);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out - please check your connection and try again');
            }
            throw new Error('Network error - please check your connection');
        }

        // Handle 401 - only meaningful as "session expired" if we actually
        // HAD a token that got rejected. A 401 with no token present just
        // means the request itself failed authentication (e.g. a login
        // attempt with the wrong password) -- that's an expected failure
        // that should surface its own message ("Invalid credentials"), not
        // a misleading "your session has expired" when no session existed.
        if (response.status === 401 && token) {
            const refreshed = await this._refreshToken();
            if (refreshed) {
                // Retry the original request
                const newToken = localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
                headers.set('Authorization', `Bearer ${newToken}`);
                try {
                    response = await this._fetchWithTimeout(`${this.baseURL}${endpoint}`, {
                        ...options,
                        headers,
                        mode: 'cors',
                        credentials: 'include'
                    }, REQUEST_TIMEOUT_MS);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error('Request timed out - please check your connection and try again');
                    }
                    throw new Error('Network error - please check your connection');
                }
                // The retried request can still come back 401 (e.g. the fresh
                // token was rejected too) - fall through to session-expired handling.
                if (response.status === 401) {
                    this._handleSessionExpired(true);
                    throw new Error('Your session has expired. Please log in again.');
                }
            } else {
                this._handleSessionExpired(true);
                throw new Error('Your session has expired. Please log in again.');
            }
        }

        // Parse response
        let data;
        try {
            const contentType = response.headers.get('content-type');
            data = contentType && contentType.includes('application/json')
                ? await response.json()
                : await response.text();
        } catch {
            data = null;
        }

        if (!response.ok) {
            let message = data?.message || data?.detail || data?.error || 'Request failed';
            // The API returns field-level validation problems in `errors` (e.g.
            // ["body.family_name: String should have at least 1 character"]).
            // Surface those instead of the generic "Validation error" message.
            if (Array.isArray(data?.errors) && data.errors.length) {
                message = data.errors.map(e => String(e).replace(/^body\./, '')).join('; ');
            }
            throw new Error(message);
        }

        // The API wraps all responses in an envelope: { success, message, data, errors, meta }
        // Unwrap so the rest of the app receives clean payloads directly.
        let payload = data;
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
            payload = data.data;
        }

        return {
            status: response.status,
            data: payload,
            // Pagination info for list endpoints: { total, page, size, total_pages, has_next }.
            // Most callers only need `data`; this is here for pages that need to render
            // pagination controls (e.g. Prev/Next) without a second request.
            meta: data && typeof data === 'object' ? data.meta : null
        };
    }

    /**
     * fetch() wrapper that aborts the request if it takes longer than timeoutMs,
     * so a hung connection can't leave the caller waiting forever.
     */
    async _fetchWithTimeout(url, options, timeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Refresh the access token using the refresh token.
     * Like every other endpoint, /auth/refresh responds inside the
     * {success, message, data, errors, meta} envelope - the tokens are at
     * `json.data.access_token` / `json.data.refresh_token`, not top-level.
     */
    async _refreshToken() {
        try {
            const refreshToken = localStorage.getItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) return false;

            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (response.ok) {
                const json = await response.json();
                const tokens = (json && typeof json === 'object' && json.data) ? json.data : json;
                if (tokens && tokens.access_token) {
                    localStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, tokens.access_token);
                    if (tokens.refresh_token) {
                        localStorage.setItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
                    }
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    /**
     * Called once an access token is confirmed dead (refresh failed or also
     * came back 401). Clears the now-invalid session so isAuthenticated()
     * stops lying, tells the nav to redraw as logged-out, and - only if the
     * user actually had a token (i.e. this isn't just an anonymous visitor
     * browsing a public page) - bounces them to login with a way back.
     * Guarded so concurrent failed requests only trigger this once.
     */
    _handleSessionExpired(hadToken) {
        if (this._sessionExpiredHandled) return;
        this._sessionExpiredHandled = true;

        this.logout();

        if (window.AuthAPI && typeof window.AuthAPI.initNavAuth === 'function') {
            try { window.AuthAPI.initNavAuth(); } catch (_) { /* nav markup may not be on this page */ }
        }

        if (!hadToken) return; // anonymous request 401'd (e.g. viewing while logged out) - nothing to expire

        const path = window.location.pathname.toLowerCase();
        const onAuthPage = /\/(login|signup)\.html$/.test(path);
        if (onAuthPage) return;

        if (typeof showToast === 'function') {
            showToast('Your session has expired. Please log in again.', 'error', 5000);
        }

        setTimeout(() => {
            if (window.AuthAPI && typeof window.AuthAPI.redirectToLogin === 'function') {
                window.AuthAPI.redirectToLogin(window.location.pathname.split('/').pop() + window.location.search);
            } else {
                window.location.href = '/login.html';
            }
        }, 900);
    }

    // -------- HTTP Method Helpers --------

    async get(endpoint, params = {}) {
        // Build query string if params provided
        const queryString = Object.keys(params).length 
            ? '?' + new URLSearchParams(params).toString()
            : '';
        return this.request(`${endpoint}${queryString}`);
    }

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Form data posting (for file uploads)
    async postFormData(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * Logout - clear all stored auth data
     */
    logout() {
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    }

    /**
     * Get stored auth token
     */
    getToken() {
        return localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    }
}

// ============================================
// Toast notifications - shared across all pages
// ============================================
// A plain top-level function declaration (not const/class) so it attaches to
// `window` like any classic script global -- this is what ApiUtils.showError/
// showSuccess below detect via `typeof showToast === 'function'`.
function showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('stadia-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'stadia-toast-container';
        container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;max-width:22rem;';
        document.body.appendChild(container);
    }

    const colors = {
        success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
        error:   { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
        info:    { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.style.cssText = `background:${c.bg};border:1px solid ${c.border};color:${c.text};padding:0.75rem 1rem;border-radius:0.75rem;font-size:0.8125rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.08);opacity:0;transform:translateY(-6px);transition:opacity 0.2s ease,transform 0.2s ease;`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(() => toast.remove(), 220);
    }, duration);
}
window.showToast = showToast;

// ============================================
// Confirmation modal - replaces window.confirm() with a real
// yes/no dialog matching the site's look, used for destructive actions
// (delete, status changes) across the dashboard and detail pages.
// Usage: const ok = await showConfirmModal('Delete this project?');
// ============================================
function showConfirmModal(message, options = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(17,24,39,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;opacity:0;transition:opacity 0.15s ease;';

        const box = document.createElement('div');
        box.style.cssText = 'background:#fff;border-radius:1rem;max-width:22rem;width:100%;padding:1.5rem;box-shadow:0 20px 40px rgba(0,0,0,0.15);transform:translateY(8px);transition:transform 0.15s ease;';
        box.innerHTML = `
            <p style="font-size:0.875rem;color:#1f2937;line-height:1.5;margin:0 0 1.25rem;">${(window.ApiUtils ? ApiUtils.escapeHTML(message) : message)}</p>
            <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                <button type="button" data-role="cancel" style="padding:0.5rem 1rem;border-radius:0.5rem;border:1px solid #d1d5db;background:#fff;color:#374151;font-size:0.8125rem;font-weight:600;cursor:pointer;">${options.cancelLabel || 'Cancel'}</button>
                <button type="button" data-role="confirm" style="padding:0.5rem 1rem;border-radius:0.5rem;border:none;background:${options.danger === false ? '#564CE5' : '#dc2626'};color:#fff;font-size:0.8125rem;font-weight:600;cursor:pointer;">${options.confirmLabel || 'Confirm'}</button>
            </div>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => { overlay.style.opacity = '1'; box.style.transform = 'translateY(0)'; });

        function close(result) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 150);
            resolve(result);
        }
        box.querySelector('[data-role="cancel"]').addEventListener('click', () => close(false));
        box.querySelector('[data-role="confirm"]').addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); close(false); }
        });
    });
}
window.showConfirmModal = showConfirmModal;

// ============================================
// Utility functions shared across all modules
// ============================================
const ApiUtils = {
    /**
     * Format date string to readable format
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Format date with time
     */
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Create loading spinner element
     */
    createSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'stadia-loading-spinner';
        spinner.innerHTML = `
            <div class="w-8 h-8 border-4 border-gray-200 border-t-[#564CE5] rounded-full animate-spin"></div>
        `;
        return spinner;
    },

    /**
     * Show error toast notification
     */
    showError(message) {
        // Try to use browser's native toast if available, otherwise alert
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    /**
     * Show success toast notification
     */
    showSuccess(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'success');
        } else {
            console.log(message);
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Get query parameters from URL
     */
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params.entries()) {
            result[key] = value;
        }
        return result;
    }
};

// Expose to window for global access
window.APIClient = APIClient;
window.API_CONFIG = API_CONFIG;
window.ApiUtils = ApiUtils;

// Create a single instance for global use
window.apiClient = new APIClient();
