
(function () {

class CategoriesAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Get all categories
     */
    async getAllCategories(params = {}) {
        try {
            const response = await this.client.get('/categories', params);
            return response.data;
        } catch (error) {
            console.error('Get all categories failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new category
     */
    async createCategory(categoryData) {
        try {
            const response = await this.client.post('/categories', categoryData);
            return response.data;
        } catch (error) {
            console.error('Create category failed:', error.message);
            throw error;
        }
    }

    /**
     * Get category by slug
     */
    async getCategoryBySlug(slug) {
        try {
            const response = await this.client.get(`/categories/slug/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Get category by slug failed:', error.message);
            throw error;
        }
    }

    /**
     * Get category statistics
     */
    async getCategoryStats() {
        try {
            const response = await this.client.get('/categories/stats');
            return response.data;
        } catch (error) {
            console.error('Get category stats failed:', error.message);
            throw error;
        }
    }

    /**
     * Get category by UUID
     */
    async getCategoryByUuid(uuid) {
        try {
            const response = await this.client.get(`/categories/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Get category by UUID failed:', error.message);
            throw error;
        }
    }

    /**
     * Update category
     */
    async updateCategory(uuid, categoryData) {
        try {
            const response = await this.client.put(`/categories/${uuid}`, categoryData);
            return response.data;
        } catch (error) {
            console.error('Update category failed:', error.message);
            throw error;
        }
    }

    /**
     * Delete category
     */
    async deleteCategory(uuid) {
        try {
            const response = await this.client.delete(`/categories/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Delete category failed:', error.message);
            throw error;
        }
    }

    /**
     * Get projects in a category
     */
    async getCategoryProjects(uuid) {
        try {
            const response = await this.client.get(`/categories/${uuid}/projects`);
            return response.data;
        } catch (error) {
            console.error('Get category projects failed:', error.message);
            throw error;
        }
    }
}

const categoriesAPI = new CategoriesAPI();
window.CategoriesAPI = categoriesAPI;

})();
