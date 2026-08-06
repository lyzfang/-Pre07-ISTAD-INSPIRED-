// ============================================
// Reviews API - Review management
// Endpoints:
//   GET  /api/v1/reviews
//   POST /api/v1/reviews
//   GET  /api/v1/reviews/by-project/{proj_uuid}
//   GET  /api/v1/reviews/by-user/{user_uuid}
//   GET  /api/v1/reviews/stats
//   GET  /api/v1/reviews/{uuid}
//   PUT  /api/v1/reviews/{uuid}
//   DELETE /api/v1/reviews/{uuid}
// ============================================
(function () {

class ReviewsAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Get all reviews
     */
    async getAllReviews(params = {}) {
        try {
            const response = await this.client.get('/reviews', params);
            return response.data;
        } catch (error) {
            console.error('Get all reviews failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new review.
     *
     * Backend contract (verified against the live OpenAPI schema): POST
     * /reviews accepts { project_uuid, user_uuid, rate, message } -- the
     * review text field is `message`, NOT `comment` (an earlier version of
     * this file sent `comment`, which the backend silently ignores, so the
     * review saved with empty text every time).
     *   - `rate` is required (callers that pass `rating` are remapped)
     *   - `user_uuid` is required and is injected from the logged-in user
     *     when the caller does not provide it.
     */
    async createReview(reviewData) {
        try {
            // Backend uses `rate`; callers often pass `rating`.
            const rate = reviewData.rate ?? reviewData.rating ?? 5;

            // Backend requires user_uuid -> derive from current user if absent.
            let userUuid = reviewData.user_uuid;
            if (!userUuid) {
                const stored = (function(){
                    try { return JSON.parse(localStorage.getItem('stadia_user') || 'null'); }
                    catch(e){ return null; }
                })();
                userUuid = (stored && stored.uuid) || null;
                if (!userUuid && window.UsersAPI) {
                    try {
                        const me = await window.UsersAPI.getCurrentUser();
                        userUuid = (me && me.uuid) || null;
                    } catch (e) { /* user not authenticated */ }
                }
            }
            if (!userUuid) {
                throw new Error('You must be logged in to comment.');
            }

            const payload = {
                project_uuid: reviewData.project_uuid,
                user_uuid: userUuid,
                rate,
                message: reviewData.message || reviewData.comment || '',
            };

            const response = await this.client.post('/reviews', payload);
            return response.data;
        } catch (error) {
            console.error('Create review failed:', error.message);
            throw error;
        }
    }

    /**
     * Get reviews by project
     */
    async getReviewsByProject(projectUuid, params = {}) {
        try {
            const response = await this.client.get(`/reviews/by-project/${projectUuid}`, params);
            return response.data;
        } catch (error) {
            console.error('Get reviews by project failed:', error.message);
            throw error;
        }
    }

    /**
     * Get reviews by user
     */
    async getReviewsByUser(userUuid, params = {}) {
        try {
            const response = await this.client.get(`/reviews/by-user/${userUuid}`, params);
            return response.data;
        } catch (error) {
            console.error('Get reviews by user failed:', error.message);
            throw error;
        }
    }

    /**
     * Get review statistics
     */
    async getReviewStats() {
        try {
            const response = await this.client.get('/reviews/stats');
            return response.data;
        } catch (error) {
            console.error('Get review stats failed:', error.message);
            throw error;
        }
    }

    /**
     * Get review by UUID
     */
    async getReviewByUuid(uuid) {
        try {
            const response = await this.client.get(`/reviews/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Get review by UUID failed:', error.message);
            throw error;
        }
    }

    /**
     * Update review
     */
    async updateReview(uuid, reviewData) {
        try {
            const response = await this.client.put(`/reviews/${uuid}`, reviewData);
            return response.data;
        } catch (error) {
            console.error('Update review failed:', error.message);
            throw error;
        }
    }

    /**
     * Delete review
     */
    async deleteReview(uuid) {
        try {
            const response = await this.client.delete(`/reviews/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Delete review failed:', error.message);
            throw error;
        }
    }
}

const reviewsAPI = new ReviewsAPI();
window.ReviewsAPI = reviewsAPI;

})();
