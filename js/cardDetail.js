// ============================================
// Card Detail API - Coordinates data loading for
// individual project/card detail pages
// ============================================
(function () {

class CardDetailAPI {
    constructor() {
        this.projectsAPI = window.ProjectsAPI;
        this.mediaAPI = window.MediaAPI;
        this.reviewsAPI = window.ReviewsAPI;
        this.categoriesAPI = window.CategoriesAPI;
        this.techStacksAPI = window.TechStacksAPI;
        this.generationsAPI = window.GenerationsAPI;
    }

    /**
     * Load a project by either slug or UUID
     * @param {string} identifier - UUID or slug
     */
    async loadProject(identifier) {
        try {
            // Check if it's a UUID (36 chars with hyphens) or slug
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
            return isUuid
                ? await this.projectsAPI.getProjectByUuid(identifier)
                : await this.projectsAPI.getProjectBySlug(identifier);
        } catch (error) {
            console.error('Load project failed:', error.message);
            throw error;
        }
    }

    /**
     * Load complete project data with related info
     * @param {string} identifier - UUID or slug of project
     * @returns {Promise<object>} - Complete project data
     */
    async loadCompleteProjectData(identifier) {
        try {
            const project = await this.loadProject(identifier);
            if (!project) return null;

            // The API already embeds full category/tech-stack/owner objects
            // directly on the project (categories, tech_stacks, owner), so no
            // extra lookups are needed for those. Reviews need a separate call,
            // and the project's embedded generation is just {uuid, gen} -- the
            // course name only comes back from GET /generations/{uuid}.
            const genUuid = project.generation && project.generation.uuid;
            const [reviews, fullGeneration] = await Promise.all([
                project.uuid ? this.reviewsAPI.getReviewsByProject(project.uuid).catch(() => []) : [],
                genUuid && this.generationsAPI ? this.generationsAPI.getGenerationByUuid(genUuid).catch(() => null) : null,
            ]);

            const categories = Array.isArray(project.categories) ? project.categories : [];

            return {
                ...project,
                reviews: reviews || [],
                categories,
                category: categories[0] || null, // convenience: first category, for single-category UI
                techStacks: Array.isArray(project.tech_stacks) ? project.tech_stacks : [],
                owner: project.owner || null,
                course: (fullGeneration && fullGeneration.course) || null,
                thumbnailUrl: this.mediaAPI.getMediaUrl(project.thumbnail),
                imageUrl: this.mediaAPI.getMediaUrl(project.thumbnail)
            };
        } catch (error) {
            console.error('Load complete project data failed:', error.message);
            throw error;
        }
    }

    /**
     * Load multiple tech stacks by UUIDs
     */
    async _loadTechStacks(techStackUuids) {
        if (!techStackUuids || !techStackUuids.length) return [];
        try {
            const promises = techStackUuids.map(uuid =>
                this.techStacksAPI.getTechStackByUuid(uuid).catch(() => null)
            );
            const results = await Promise.all(promises);
            return results.filter(ts => ts !== null);
        } catch (error) {
            console.error('Load tech stacks failed:', error.message);
            return [];
        }
    }

    /**
     * Render project cards into a container
     * @param {Array} projects - Array of project data
     * @param {HTMLElement} container - Container element
     * @param {Function} cardTemplate - Template function returning HTML
     */
    renderProjectCards(projects, container, cardTemplate) {
        if (!container || !Array.isArray(projects)) return;

        if (projects.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-8">No projects found</div>';
            return;
        }

        const html = projects.map(project => {
            const template = typeof cardTemplate === 'function'
                ? cardTemplate(project)
                : this._defaultCardTemplate(project);
            return template;
        }).join('');

        container.innerHTML = html;
        this._enrichCardRatings(container);
    }

    /**
     * Star icon markup (filled or outline), shared by the card rating row
     * and reused at whatever size the caller passes.
     */
    _starIcon(on, sizeClass) {
        return on
            ? `<svg class="${sizeClass}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z"/></svg>`
            : `<svg class="${sizeClass}" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z"/></svg>`;
    }

    /**
     * After cards are in the DOM, fetch each visible project's reviews in
     * parallel and fill in its star-rating row. There's no batch "ratings
     * for these N projects" endpoint (GET /reviews/stats is global-only and
     * currently 500s server-side), so this is one request per card -- fine
     * at the page sizes this app renders (a handful to ~20 cards).
     */
    async _enrichCardRatings(container) {
        if (!this.reviewsAPI) return;
        const rows = Array.from(container.querySelectorAll('.card-rating-row'));
        await Promise.all(rows.map(async (row) => {
            const uuid = row.dataset.uuid;
            if (!uuid) return;
            const reviews = await this.reviewsAPI.getReviewsByProject(uuid).catch(() => []);
            const rates = (Array.isArray(reviews) ? reviews : []).map(r => Number(r.rate)).filter(n => !isNaN(n));
            const count = rates.length;
            const avg = count ? rates.reduce((a, b) => a + b, 0) / count : 0;
            const starsEl = row.querySelector('.card-rating-stars');
            const countEl = row.querySelector('.card-rating-count');
            if (starsEl) {
                const rounded = Math.round(avg);
                starsEl.innerHTML = Array.from({ length: 5 }, (_, i) => this._starIcon(i < rounded, 'w-3 h-3')).join('');
            }
            if (countEl) countEl.textContent = `(${count})`;
        }));
    }

    /**
     * Default card template for projects -- the shared look used everywhere
     * a plain project grid is rendered without a page-specific template
     * (search results, category filters, etc.), so results always match the
     * rest of the site instead of a one-off style. showLoading()'s skeleton
     * mirrors this exact shape.
     */
    _defaultCardTemplate(project) {
        const thumbUrl = this.mediaAPI.getMediaUrl(project.thumbnail);
        // Relative path so it works both when served from a web root and when
        // opened directly from the filesystem (file://). project-detail.html lives
        // in the same folder as the pages that render these cards.
        const projectUrl = `project-detail.html?id=${project.uuid || project.slug}`;
        const category = Array.isArray(project.categories) && project.categories[0]
            ? (project.categories[0].title || project.categories[0].name)
            : null;

        return `
            <div class="group h-full w-full cursor-pointer" onclick="window.location.href='${projectUrl}'">
                <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col">
                    <div class="relative overflow-hidden bg-gray-100 h-32">
                        ${thumbUrl ? `<img src="${thumbUrl}"
                            alt="${this._escapeHtml(project.title || 'Project')}"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onerror="this.style.display='none'"/>` : ''}
                        ${project.featured ? `<span class="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-bold shadow-sm">★ Featured</span>` : ''}
                    </div>
                    <div class="p-3 flex-1 flex flex-col">
                        <div class="h-[18px] mb-1.5">
                            ${category ? `<span class="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-secondary2/10 text-secondary2">${this._escapeHtml(category)}</span>` : ''}
                        </div>
                        <h3 class="text-sm font-semibold text-gray-900 mb-1 line-clamp-1 min-h-[20px]">${this._escapeHtml(project.title || 'Untitled')}</h3>
                        <p class="text-xs text-gray-500 line-clamp-2 flex-1 min-h-[32px]">${this._escapeHtml(project.description || project.short_description || '')}</p>
                        <div class="card-rating-row flex items-center gap-1 mt-2 pt-2 border-t border-gray-50" data-uuid="${project.uuid || ''}">
                            <div class="card-rating-stars flex text-amber-400 gap-0.5"></div>
                            <span class="card-rating-count text-[10px] text-gray-400">(0)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show a skeleton-card loading state (shaped like _defaultCardTemplate)
     * instead of a bare spinner, so the grid doesn't jump/reflow once the
     * real cards arrive. Used for both initial loads and search/filter
     * refreshes across every page that lists projects.
     * @param {HTMLElement} container - Container element
     * @param {number} count - How many placeholder cards to render
     */
    showLoading(container, count = 6) {
        if (!container) return;
        const skeletonCard = `
            <div class="w-full animate-pulse">
                <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
                    <div class="bg-gray-200 h-32"></div>
                    <div class="p-3 flex-1 flex flex-col">
                        <div class="h-[18px] mb-1.5"><div class="h-3.5 w-16 bg-gray-200 rounded-full"></div></div>
                        <div class="min-h-[20px] mb-1"><div class="h-4 bg-gray-200 rounded w-3/4"></div></div>
                        <div class="min-h-[32px] flex-1 flex flex-col gap-1.5 justify-center">
                            <div class="h-3 bg-gray-200 rounded w-full"></div>
                            <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = skeletonCard.repeat(count);
    }

    /**
     * Show error state
     * @param {HTMLElement} container - Container element
     * @param {string} message - Error message
     */
    showError(container, message = 'Failed to load data. Please try again.') {
        if (container) {
            container.innerHTML = `<div class="text-center text-red-500 py-8">${this._escapeHtml(message)}</div>`;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    _escapeHtml(str) {
        return window.ApiUtils ? window.ApiUtils.escapeHTML(str) : '';
    }
}

const cardDetailAPI = new CardDetailAPI();
window.CardDetailAPI = cardDetailAPI;
// Also exposed as a global lowercase binding: every page's inline script calls
// the bare `cardDetailAPI.xxx()` form directly (not `window.CardDetailAPI`).
window.cardDetailAPI = cardDetailAPI;

})();
