import api from './axios';

// Get available certificate templates
export const getTemplates = async () => {
    try {
        const response = await api.get('/certificates/templates');
        return response.data;
    } catch (error) {
        console.error('Get templates error:', error);
        throw error;
    }
};

// Update course certificate template (instructor)
export const updateCourseTemplate = async (courseId, template) => {
    try {
        const response = await api.put(`/certificates/course/${courseId}/template`, { template });
        return response.data;
    } catch (error) {
        console.error('Update course template error:', error);
        throw error;
    }
};

// Get student certificates
export const getStudentCertificates = async () => {
    try {
        const response = await api.get('/certificates/my-certificates');
        return response.data;
    } catch (error) {
        console.error('Get student certificates error:', error);
        throw error;
    }
};

// Download certificate
export const downloadCertificate = async (certificateId) => {
    try {
        const response = await api.get(`/certificates/download/${certificateId}`,
            {
                responseType: 'blob',
                headers: { Accept: 'application/pdf' }
            }
        );
        return response;
    } catch (error) {
        console.error('Download certificate error:', error);
        throw error;
    }
};

// Get course certificates (instructor)
export const getCourseCertificates = async (courseId) => {
    try {
        const response = await api.get(`/certificates/course/${courseId}`);
        return response.data;
    } catch (error) {
        console.error('Get course certificates error:', error);
        throw error;
    }
};

// Preview certificate template
export const previewTemplate = async (template) => {
    try {
        const response = await api.get(`/certificates/preview/${template}`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Preview template error:', error);
        throw error;
    }
};

// Regenerate certificate (instructor)
export const regenerateCertificate = async (certificateId) => {
    try {
        const response = await api.post(`/certificates/regenerate/${certificateId}`);
        return response.data;
    } catch (error) {
        console.error('Regenerate certificate error:', error);
        throw error;
    }
};
