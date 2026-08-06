// ============================================
// Courses API - Course management
// Endpoints:
//   GET  /api/v1/courses
//   POST /api/v1/courses
//   GET  /api/v1/courses/slug/{slug}
//   GET  /api/v1/courses/stats
//   GET  /api/v1/courses/{uuid}
//   PUT  /api/v1/courses/{uuid}
//   DELETE /api/v1/courses/{uuid}
//   GET  /api/v1/courses/{uuid}/generation
//   GET  /api/v1/courses/{uuid}/projects
// ============================================
(function () {

class CoursesAPI {
    constructor() {
        this.client = window.apiClient;
    }

    /**
     * Get all courses
     */
    async getAllCourses(params = {}) {
        try {
            const response = await this.client.get('/courses', params);
            return response.data;
        } catch (error) {
            console.error('Get all courses failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new course
     */
    async createCourse(courseData) {
        try {
            const response = await this.client.post('/courses', courseData);
            return response.data;
        } catch (error) {
            console.error('Create course failed:', error.message);
            throw error;
        }
    }

    /**
     * Get course by slug
     */
    async getCourseBySlug(slug) {
        try {
            const response = await this.client.get(`/courses/slug/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Get course by slug failed:', error.message);
            throw error;
        }
    }

    /**
     * Get course statistics
     */
    async getCourseStats() {
        try {
            const response = await this.client.get('/courses/stats');
            return response.data;
        } catch (error) {
            console.error('Get course stats failed:', error.message);
            throw error;
        }
    }

    /**
     * Get course by UUID
     */
    async getCourseByUuid(uuid) {
        try {
            const response = await this.client.get(`/courses/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Get course by UUID failed:', error.message);
            throw error;
        }
    }

    /**
     * Update course
     */
    async updateCourse(uuid, courseData) {
        try {
            const response = await this.client.put(`/courses/${uuid}`, courseData);
            return response.data;
        } catch (error) {
            console.error('Update course failed:', error.message);
            throw error;
        }
    }

    /**
     * Delete course
     */
    async deleteCourse(uuid) {
        try {
            const response = await this.client.delete(`/courses/${uuid}`);
            return response.data;
        } catch (error) {
            console.error('Delete course failed:', error.message);
            throw error;
        }
    }

    /**
     * Get course generations
     */
    async getCourseGenerations(uuid) {
        try {
            const response = await this.client.get(`/courses/${uuid}/generation`);
            return response.data;
        } catch (error) {
            console.error('Get course generations failed:', error.message);
            throw error;
        }
    }

    /**
     * Get course projects
     */
    async getCourseProjects(uuid) {
        try {
            const response = await this.client.get(`/courses/${uuid}/projects`);
            return response.data;
        } catch (error) {
            console.error('Get course projects failed:', error.message);
            throw error;
        }
    }
}

const coursesAPI = new CoursesAPI();
window.CoursesAPI = coursesAPI;

})();
