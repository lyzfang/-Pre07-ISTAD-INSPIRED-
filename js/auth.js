// ============================================
// Auth API - Handles login, register, token refresh
// Endpoints used:
//   POST /api/v1/auth/login
//   POST /api/v1/auth/register
//   POST /api/v1/auth/refresh
// ============================================
(function () {

class AuthAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Login with username (or email) and password.
     * The API authenticates by `username`, so we accept either an email
     * (derived to a login-friendly identifier) or username directly.
     */
    async login(identifier, password) {
        try {
            const response = await this.client.post('/auth/login', {
                username: identifier,
                password
            });
            const data = response.data;

            if (data.access_token || data.tokens) {
                localStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN,
                    data.access_token || data.tokens.access_token);
                localStorage.setItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
                    data.refresh_token || data.tokens.refresh_token);
            }

            if (data.user) {
                localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('Login failed:', error.message);
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    }

    /**
     * Register a new user
     * The API expects: username, given_name, family_name, gender
     */
    async register(userData = {}) {
        try {
            // Adapt common frontend field names to the API contract.
            const givenName = userData.given_name || userData.first_name || userData.givenName || '';
            const familyName = userData.family_name || userData.last_name || userData.familyName || '';
            const username = userData.username || userData.email || '';

            const payload = {
                username: username.trim(),
                given_name: givenName.trim(),
                family_name: familyName.trim(),
                gender: userData.gender || 'Other',
                password: userData.password,
                email: userData.email
            };

            const response = await this.client.post('/auth/register', payload);
            // Intentionally does NOT store tokens/auto-login: registration is
            // followed by an explicit sign-in step (see signup.html), so the
            // user always lands on the Login page with a clean, logged-out state.
            return response.data;
        } catch (error) {
            console.error('Registration failed:', error.message);
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    }

    /**
     * Refresh the access token
     */
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) return false;

            const response = await this.client.post('/auth/refresh', { refresh_token: refreshToken });
            const data = response.data;

            localStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN,
                data.access_token || data.tokens?.access_token);
            localStorage.setItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
                data.refresh_token || data.tokens?.refresh_token);

            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Logout - clear all auth data and redirect to home
     */
    logout() {
        this.client.logout();
        window.location.href = '/index.html';
    }

    /**
     * Check if user is logged in
     */
    isAuthenticated() {
        return this.client.isAuthenticated();
    }

    /**
     * Get currently logged-in user from storage
     */
    getCurrentUser() {
        const userStr = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Update stored user data
     */
    updateStoredUser(user) {
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    }

    /**
     * Wire the shared navbar's auth-aware controls. Any page whose nav
     * includes elements marked data-auth="guest" (Sign In / Sign Up links)
     * and data-auth="user" (account name + Log out) can call this once,
     * after DOMContentLoaded, to show the right state and wire logout.
     *
     * Also wires any [data-requires-auth] link/button: if the user isn't
     * logged in, clicking it sends them to login.html with a `redirect`
     * back to the page they were trying to reach (e.g. Post Creator);
     * logged-in users pass through untouched.
     */
    initNavAuth() {
        const guestEls = document.querySelectorAll('[data-auth="guest"]');
        const userEls = document.querySelectorAll('[data-auth="user"]');
        const nameEls = document.querySelectorAll('[data-auth="user-name"]');
        const avatarEls = document.querySelectorAll('[data-auth="user-avatar"]');
        const logoutBtns = document.querySelectorAll('[data-action="logout"]');

        const isIn = this.isAuthenticated();
        guestEls.forEach(el => el.classList.toggle('hidden', isIn));
        userEls.forEach(el => el.classList.toggle('hidden', !isIn));

        if (isIn) {
            const applyUser = (user) => {
                const label = (user && (user.given_name || user.username)) || 'Account';
                nameEls.forEach(el => { el.textContent = label; });
                avatarEls.forEach(el => this.renderUserAvatar(el, user));
            };
            applyUser(this.getCurrentUser());
            // The cached user (localStorage) can be stale or empty -- e.g. right
            // after login, before any page has fetched the full profile -- since
            // /auth/login itself doesn't return a user object. Refresh in the
            // background so the navbar settles on the real name/avatar instead
            // of staying on generic fallbacks.
            if (window.UsersAPI && typeof UsersAPI.getCurrentUser === 'function') {
                UsersAPI.getCurrentUser().then(applyUser).catch(() => {});
            }
        }

        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        document.querySelectorAll('[data-requires-auth]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (this.isAuthenticated()) return; // logged in: let the link/button work normally
                e.preventDefault();
                const target = el.getAttribute('href') || el.dataset.requiresAuth;
                this.redirectToLogin(target);
            });
        });
    }

    /**
     * Fill an avatar element with the user's real photo if they've set one,
     * otherwise a generated avatar (https://github.com/multiavatar/Multiavatar)
     * so a "no avatar" user still looks intentional rather than a blank circle.
     * The seed is the user's uuid (stable and unique per account) so the same
     * person always gets the same generated avatar everywhere.
     */
    renderUserAvatar(el, user) {
        if (!el) return;
        const avatarPath = user && user.avatar;
        el.style.backgroundColor = '';
        el.innerHTML = '';

        if (avatarPath && window.MediaAPI) {
            const img = document.createElement('img');
            img.src = MediaAPI.getMediaUrl(avatarPath);
            img.alt = '';
            img.className = 'w-full h-full object-cover';
            el.appendChild(img);
            return;
        }

        const seed = (user && (user.uuid || user.username || user.email || user.given_name)) || 'guest';
        if (window.multiavatar) {
            el.innerHTML = window.multiavatar(seed);
            const svg = el.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.style.display = 'block';
            }
            return;
        }

        // multiavatar.js didn't load on this page -- last-resort initials fallback.
        const initials = seed.trim().slice(0, 1).toUpperCase() || 'U';
        const palette = ['#F87171', '#FB923C', '#FBBF24', '#34D399', '#22D3EE', '#60A5FA', '#A78BFA', '#F472B6'];
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
        el.textContent = initials;
        el.style.backgroundColor = palette[hash % palette.length];
    }

    /**
     * Send the user to login.html, remembering where they were headed so
     * they land back there (not the dashboard) right after signing in.
     * `returnPath` should be a relative path from html/, e.g.
     * 'create-project.html' or 'project-detail.html?id=...'.
     */
    redirectToLogin(returnPath) {
        const target = returnPath || (window.location.pathname.split('/').pop() + window.location.search);
        window.location.href = '/login.html?redirect=' + encodeURIComponent(target);
    }
}

// Create and export instance
const authAPI = new AuthAPI();
window.AuthAPI = authAPI;

})();
