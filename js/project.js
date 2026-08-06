// ============================================
// Projects API - Project management
// Endpoints:
//   GET    /api/v1/projects
//   POST   /api/v1/projects
//   GET    /api/v1/projects/search
//   GET    /api/v1/projects/featured
//   GET    /api/v1/projects/by-generation/{gen_uuid}
//   GET    /api/v1/projects/by-tech-stack/{ts_uuid}
//   GET    /api/v1/projects/by-category/{cat_uuid}
//   GET    /api/v1/projects/slug/{slug}
//   GET    /api/v1/projects/{uuid}
//   PUT    /api/v1/projects/{uuid}
//   DELETE /api/v1/projects/{uuid}
//   PATCH  /api/v1/projects/{uuid}/featured
//   PATCH  /api/v1/projects/{uuid}/status
// ============================================
(function () {

class ProjectsAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Get all projects with optional filters
     */
    async getAllProjects(params = {}) {
        try {
            const response = await this.client.get('/projects', params);
            return response.data;
        } catch (error) {
            console.error('Get all projects failed:', error.message);
            throw error;
        }
    }

    /**
     * Get all projects with pagination metadata included, for pages that
     * render Prev/Next controls (getAllProjects() above only returns the
     * array, which is enough for pages that don't need page controls).
     * Returns { items, meta: { total, page, size, total_pages, has_next } }.
     */
    async getAllProjectsPaged(params = {}) {
        try {
            const response = await this.client.get('/projects', params);
            return { items: response.data || [], meta: response.meta || null };
        } catch (error) {
            console.error('Get all projects (paged) failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new project
     */
    async createProject(projectData) {
        try {
            // Handle FormData (for file uploads) vs JSON
            if (projectData instanceof FormData) {
                const response = await this.client.postFormData('/projects', projectData);
                return response.data;
            }
            const response = await this.client.post('/projects', projectData);
            return response.data;
        } catch (error) {
            console.error('Create project failed:', error.message);
            throw error;
        }
    }

    /**
     * Search projects
     */
    async searchProjects(query, params = {}) {
        try {
            const response = await this.client.get('/projects/search', { q: query, ...params });
            return response.data;
        } catch (error) {
            console.error('Search projects failed:', error.message);
            throw error;
        }
    }

    /**
     * Get featured projects
     */
    async getFeaturedProjects() {
        try {
            const response = await this.client.get('/projects/featured');
            return response.data;
        } catch (error) {
            console.error('Get featured projects failed:', error.message);
            throw error;
        }
    }

    /**
     * Get projects by generation
     */
    async getProjectsByGeneration(genUuid) {
        try {
            const response = await this.client.get(`/projects/by-generation/${genUuid}`);
            return response.data;
        } catch (error) {
            console.error('Get projects by generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Get projects by tech stack
     */
    async getProjectsByTechStack(tsUuid) {
        try {
            const response = await this.client.get(`/projects/by-tech-stack/${tsUuid}`);
            return response.data;
        } catch (error) {
            console.error('Get projects by tech stack failed:', error.message);
            throw error;
        }
    }

    /**
     * Get projects by category
     */
    async getProjectsByCategory(catUuid) {
        try {
            const response = await this.client.get(`/projects/by-category/${catUuid}`);
            return response.data;
        } catch (error) {
            console.error('Get projects by category failed:', error.message);
            throw error;
        }
    }

    /**
     * Get project by slug
     */
    async getProjectBySlug(slug) {
        try {
            const response = await this.client.get(`/projects/slug/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Get project by slug failed:', error.message);
            throw error;
        }
    }

    /**
     * Get project by UUID
     */
    async getProjectByUuid(uuid) {
        try {
            const response = await this.client.get(`/projects/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Get project by UUID failed:', error.message);
            throw error;
        }
    }

    /**
     * Update project
     */
    async updateProject(uuid, projectData) {
        try {
            const response = await this.client.put(`/projects/${uuid}`, projectData);
            return response.data;
        } catch (error) {
            console.error('Update project failed:', error.message);
            throw error;
        }
    }

    /**
     * Delete project
     */
    async deleteProject(uuid) {
        try {
            const response = await this.client.delete(`/projects/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Delete project failed:', error.message);
            throw error;
        }
    }

    /**
     * Toggle featured status
     */
    async toggleFeatured(uuid) {
        try {
            const response = await this.client.patch(`/projects/${uuid}/featured`);
            return response.data;
        } catch (error) {
            console.error('Toggle featured failed:', error.message);
            throw error;
        }
    }

    /**
     * Update project status.
     *
     * Backend contract (verified by API testing):
     *   PATCH /api/v1/projects/{uuid}/status?status={status}
     * The `status` value MUST be sent as a QUERY parameter, not a JSON body.
     */
    async updateStatus(uuid, status) {
        try {
            const qs = new URLSearchParams({ status });
            const response = await this.client.patch(`/projects/${uuid}/status?${qs.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Update project status failed:', error.message);
            throw error;
        }
    }
}

const projectsAPI = new ProjectsAPI();
window.ProjectsAPI = projectsAPI;

})();
