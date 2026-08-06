// ============================================
// Tech Stacks API - Tech stack management
// Endpoints:
//   GET  /api/v1/tech-stacks
//   POST /api/v1/tech-stacks
//   GET  /api/v1/tech-stacks/slug/{slug}
//   GET  /api/v1/tech-stacks/stats
//   GET  /api/v1/tech-stacks/{uuid}
//   PUT  /api/v1/tech-stacks/{uuid}
//   DELETE /api/v1/tech-stacks/{uuid}
//   GET  /api/v1/tech-stacks/{uuid}/projects
// ============================================
(function () {

class TechStacksAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Get all tech stacks
     */
    async getAllTechStacks(params = {}) {
        try {
            const response = await this.client.get('/tech-stacks', params);
            return response.data;
        } catch (error) {
            console.error('Get all tech stacks failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new tech stack
     */
    async createTechStack(techStackData) {
        try {
            const response = await this.client.post('/tech-stacks', techStackData);
            return response.data;
        } catch (error) {
            console.error('Create tech stack failed:', error.message);
            throw error;
        }
    }

    /**
     * Get tech stack by slug
     */
    async getTechStackBySlug(slug) {
        try {
            const response = await this.client.get(`/tech-stacks/slug/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Get tech stack by slug failed:', error.message);
            throw error;
        }
    }

    /**
     * Get tech stack statistics
     */
    async getTechStackStats() {
        try {
            const response = await this.client.get('/tech-stacks/stats');
            return response.data;
        } catch (error) {
            console.error('Get tech stack stats failed:', error.message);
            throw error;
        }
    }

    /**
     * Get tech stack by UUID
     */
    async getTechStackByUuid(uuid) {
        try {
            const response = await this.client.get(`/tech-stacks/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Get tech stack by UUID failed:', error.message);
            throw error;
        }
    }

    /**
     * Update tech stack
     */
    async updateTechStack(uuid, techStackData) {
        try {
            const response = await this.client.put(`/tech-stacks/${uuid}`, techStackData);
            return response.data;
        } catch (error) {
            console.error('Update tech stack failed:', error.message);
            throw error;
        }
    }

    /**
     * Delete tech stack
     */
    async deleteTechStack(uuid) {
        try {
            const response = await this.client.delete(`/tech-stacks/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Delete tech stack failed:', error.message);
            throw error;
        }
    }

    /**
     * Get projects using a tech stack
     */
    async getTechStackProjects(uuid) {
        try {
            const response = await this.client.get(`/tech-stacks/${uuid}/projects`);
            return response.data;
        } catch (error) {
            console.error('Get tech stack projects failed:', error.message);
            throw error;
        }
    }
}

const techStacksAPI = new TechStacksAPI();
window.TechStacksAPI = techStacksAPI;

})();
