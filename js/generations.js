// ============================================
// Generations API - Generation management
// Endpoints:
//   GET  /api/v1/generations
//   POST /api/v1/generations
//   GET  /api/v1/generations/stats
//   GET  /api/v1/generations/{uuid}
//   PUT  /api/v1/generations/{uuid}
//   DELETE /api/v1/generations/{uuid}
//   GET  /api/v1/generations/{uuid}/projects
// ============================================
(function () {

class GenerationsAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Get all generations
     */
    async getAllGenerations(params = {}) {
        try {
            const response = await this.client.get('/generations', params);
            return response.data;
        } catch (error) {
            console.error('Get all generations failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new generation
     */
    async createGeneration(generationData) {
        try {
            const response = await this.client.post('/generations', generationData);
            return response.data;
        } catch (error) {
            console.error('Create generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Get generation statistics
     */
    async getGenerationStats() {
        try {
            const response = await this.client.get('/generations/stats');
            return response.data;
        } catch (error) {
            console.error('Get generation stats failed:', error.message);
            throw error;
        }
    }

    /**
     * Get generation by UUID
     */
    async getGenerationByUuid(uuid) {
        try {
            const response = await this.client.get(`/generations/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Get generation by UUID failed:', error.message);
            throw error;
        }
    }

    /**
     * Update generation
     */
    async updateGeneration(uuid, generationData) {
        try {
            const response = await this.client.put(`/generations/${uuid}`, generationData);
            return response.data;
        } catch (error) {
            console.error('Update generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Delete generation
     */
    async deleteGeneration(uuid) {
        try {
            const response = await this.client.delete(`/generations/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Delete generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Get projects in a generation
     */
    async getGenerationProjects(uuid) {
        try {
            const response = await this.client.get(`/generations/${uuid}/projects`);
            return response.data;
        } catch (error) {
            console.error('Get generation projects failed:', error.message);
            throw error;
        }
    }
}

const generationsAPI = new GenerationsAPI();
window.GenerationsAPI = generationsAPI;

})();
