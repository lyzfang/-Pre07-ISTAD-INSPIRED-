// ============================================
// Users API - User management
// Endpoints:
//   GET    /api/v1/users
//   POST   /api/v1/users
//   GET    /api/v1/users/me
//   PATCH  /api/v1/users/me
//   PATCH  /api/v1/users/me/password
//   GET    /api/v1/users/{uuid}
//   PUT    /api/v1/users/{uuid}
//   DELETE /api/v1/users/{uuid}
//   GET    /api/v1/users/{uuid}/reviews
// ============================================
(function () {

class UsersAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Get all users (admin)
     */
    async getAllUsers(params = {}) {
        try {
            const response = await this.client.get('/users', params);
            return response.data;
        } catch (error) {
            console.error('Get all users failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new user (admin)
     */
    async createUser(userData) {
        try {
            const response = await this.client.post('/users', userData);
            return response.data;
        } catch (error) {
            console.error('Create user failed:', error.message);
            throw error;
        }
    }

    /**
     * Get current user profile
     */
    async getCurrentUser() {
        try {
            const response = await this.client.get('/users/me');
            const data = response.data;
            if (data) {
                localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data));
            }
            return data;
        } catch (error) {
            console.error('Get current user failed:', error.message);
            throw error;
        }
    }

    /**
     * Update current user profile
     */
    async updateCurrentUser(userData) {
        try {
            const response = await this.client.patch('/users/me', userData);
            const data = response.data;
            if (data) {
                localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data));
            }
            return data;
        } catch (error) {
            console.error('Update current user failed:', error.message);
            throw error;
        }
    }

    /**
     * Change current user password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.client.patch('/users/me/password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            return response.data;
        } catch (error) {
            console.error('Change password failed:', error.message);
            throw error;
        }
    }

    /**
     * Get user by UUID
     */
    async getUserByUuid(uuid) {
        try {
            const response = await this.client.get(`/users/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Get user by UUID failed:', error.message);
            throw error;
        }
    }

    /**
     * Update user (admin)
     */
    async updateUser(uuid, userData) {
        try {
            const response = await this.client.put(`/users/${uuid}`, userData);
            return response.data;
        } catch (error) {
            console.error('Update user failed:', error.message);
            throw error;
        }
    }

    /**
     * Delete user (admin)
     */
    async deleteUser(uuid) {
        try {
            const response = await this.client.delete(`/users/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Delete user failed:', error.message);
            throw error;
        }
    }

    /**
     * Get reviews by a specific user
     */
    async getUserReviews(uuid, params = {}) {
        try {
            const response = await this.client.get(`/users/${uuid}/reviews`, params);
            return response.data;
        } catch (error) {
            console.error('Get user reviews failed:', error.message);
            throw error;
        }
    }
}

const usersAPI = new UsersAPI();
window.UsersAPI = usersAPI;

})();
