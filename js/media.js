// ============================================
// Media API - File upload and serving
// Endpoints:
//   POST /api/v1/media  (upload file)
//   GET  /media/{filename}  (serve media file)
// ============================================
(function () {

class MediaAPI {
    constructor() {
        this.uploadURL = `${API_CONFIG.BASE_URL}/media`;
        this.serveURL = 'https://inspire-api.gital.me/media';
        this.client = window.apiClient;
    }

    /**
     * Upload a file to the server
     * @param {File} file - File object to upload
     * @returns {Promise<object>} - Uploaded file data
     */
    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.client.postFormData('/media', formData);
            return response.data;
        } catch (error) {
            console.error('Upload file failed:', error.message);
            throw error;
        }
    }

    /**
     * Upload multiple files
     * @param {FileList|File[]} files - Files to upload
     * @returns {Promise<Array>} - Array of uploaded file data
     */
    async uploadMultipleFiles(files) {
        try {
            const uploadPromises = Array.from(files).map(file => this.uploadFile(file));
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Upload multiple files failed:', error.message);
            throw error;
        }
    }

    /**
     * Get the URL for a media file
     * @param {string} filename - Filename or path
     * @returns {string} - Full media URL
     */
    getMediaUrl(filename) {
        if (!filename) return '';
        // If it already starts with http, return as-is
        if (filename.startsWith('http')) return filename;
        // Remove any leading slashes
        const cleanPath = filename.replace(/^\/+/, '');
        return `${this.serveURL}/${cleanPath}`;
    }

    /**
     * Create an image element with the media file
     * @param {string} filename - Filename
     * @param {string} alt - Alt text
     * @param {string} className - CSS classes
     * @returns {HTMLImageElement} - Image element
     */
    createImageElement(filename, alt = '', className = '') {
        const img = document.createElement('img');
        img.src = this.getMediaUrl(filename);
        img.alt = alt;
        if (className) img.className = className;
        img.loading = 'lazy';
        return img;
    }

    /**
     * Safely set image source on an existing element
     * @param {HTMLElement} element - Image element
     * @param {string} filename - Filename
     */
    setImageSource(element, filename) {
        if (!element || !filename) {
            if (element) element.style.display = 'none';
            return;
        }
        element.src = this.getMediaUrl(filename);
        element.style.display = '';
    }

    /**
     * Handle image onerror - show fallback
     * @param {HTMLElement} imgElement - Image element
     * @param {string} fallbackUrl - Fallback image URL
     */
    handleImageError(imgElement, fallbackUrl) {
        if (!imgElement) return;
        imgElement.onerror = () => {
            imgElement.src = fallbackUrl || '';
            imgElement.onerror = null;
        };
    }
}

const mediaAPI = new MediaAPI();
window.MediaAPI = mediaAPI;

})();
