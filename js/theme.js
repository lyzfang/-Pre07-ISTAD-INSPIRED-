// ============================================
// Dark / light mode toggle, shared across every page.
// Preference is saved to localStorage and falls back to the OS/browser
// preference on first visit. Each page also carries a tiny inline snippet
// in <head> (before this file loads) that applies the saved class early
// to avoid a flash of the wrong theme.
// ============================================
(function () {

const STORAGE_KEY = 'stadia_theme'; // 'light' | 'dark'

function getPreferredTheme() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { /* localStorage unavailable */ }
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelectorAll('.theme-icon-sun').forEach(el => el.classList.toggle('hidden', theme !== 'dark'));
    document.querySelectorAll('.theme-icon-moon').forEach(el => el.classList.toggle('hidden', theme === 'dark'));
}

function setTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
    applyTheme(theme);
}

function toggleTheme() {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
}

applyTheme(getPreferredTheme());

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme());
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
});

window.ThemeAPI = { getPreferredTheme, applyTheme, setTheme, toggleTheme };

})();
