// ============================================
// Favorites + View History - client-side only, backed by localStorage.
// There is no favorites/history endpoint on the STADIA API, so bookmarking
// a project and tracking recently-viewed projects are tracked entirely in
// the browser (per-browser, not synced across devices).
// ============================================
(function () {

const FAVORITES_KEY = 'stadia_favorites';
const HISTORY_KEY = 'stadia_history';
const HISTORY_MAX = 50;

function readList(key) {
    try {
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function writeList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
}

function toEntry(project) {
    return {
        uuid: project.uuid,
        title: project.title || 'Untitled project',
        thumbnail: project.thumbnail || '',
        savedAt: new Date().toISOString(),
    };
}

const FavoritesAPI = {
    getAll() {
        return readList(FAVORITES_KEY);
    },
    isFavorited(uuid) {
        return this.getAll().some(p => p.uuid === uuid);
    },
    add(project) {
        if (!project || !project.uuid) return;
        const list = this.getAll().filter(p => p.uuid !== project.uuid);
        list.unshift(toEntry(project));
        writeList(FAVORITES_KEY, list);
    },
    remove(uuid) {
        writeList(FAVORITES_KEY, this.getAll().filter(p => p.uuid !== uuid));
    },
    /** Flips the saved state for a project and returns the new state (true = now favorited). */
    toggle(project) {
        if (!project || !project.uuid) return false;
        if (this.isFavorited(project.uuid)) {
            this.remove(project.uuid);
            return false;
        }
        this.add(project);
        return true;
    },
};

const HistoryAPI = {
    getAll() {
        return readList(HISTORY_KEY);
    },
    /** Records a project as viewed (moves it to the front if already present). */
    record(project) {
        if (!project || !project.uuid) return;
        let list = this.getAll().filter(p => p.uuid !== project.uuid);
        list.unshift({
            uuid: project.uuid,
            title: project.title || 'Untitled project',
            thumbnail: project.thumbnail || '',
            viewedAt: new Date().toISOString(),
        });
        if (list.length > HISTORY_MAX) list = list.slice(0, HISTORY_MAX);
        writeList(HISTORY_KEY, list);
    },
    remove(uuid) {
        writeList(HISTORY_KEY, this.getAll().filter(p => p.uuid !== uuid));
    },
    clear() {
        localStorage.removeItem(HISTORY_KEY);
    },
};

window.FavoritesAPI = FavoritesAPI;
window.HistoryAPI = HistoryAPI;

})();
