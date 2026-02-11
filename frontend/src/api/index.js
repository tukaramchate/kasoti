import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user?.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - dispatch event so UserContext can clear state
            // This avoids using window.location which bypasses React Router
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth:expired'));
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (username, password) =>
        api.post('/api/auth/login', { username, password }),

    register: (userData) =>
        api.post('/api/auth/register', userData),

    forgotPassword: (email) =>
        api.post('/api/auth/forgot-password', { email }),

    resetPassword: (token, newPassword) =>
        api.post('/api/auth/reset-password', { token, newPassword }),
};

// Quiz API
export const quizAPI = {
    // Get all quizzes with pagination
    getAllQuizzes: (page = 0, size = 10, search = '', category = '', difficulty = '', tags = '') => {
        const params = new URLSearchParams({ page, size });
        if (search) params.append('search', search);
        if (category && category !== 'All') params.append('category', category);
        if (difficulty && difficulty !== 'All') params.append('difficulty', difficulty);
        if (tags) params.append('tags', tags);
        return api.get(`/api/quizzes?${params.toString()}`);
    },

    getQuizById: (id) =>
        api.get(`/api/quizzes/${id}`),

    getMyQuizzes: () =>
        api.get('/api/quizzes/my'),

    createQuiz: (quiz) =>
        api.post('/api/quizzes', quiz),

    updateQuiz: (id, quiz) =>
        api.put(`/api/quizzes/${id}`, quiz),

    deleteQuiz: (id) =>
        api.delete(`/api/quizzes/${id}`),

    // Quiz actions
    publishQuiz: (id) =>
        api.post(`/api/quizzes/${id}/publish`),

    closeQuiz: (id) =>
        api.post(`/api/quizzes/${id}/close`),

    // Submit quiz - answers format: { questionId: "A"|"B"|"C"|"D" }
    submitQuiz: (id, answers, timeTakenSeconds) =>
        api.post(`/api/quizzes/${id}/submit`, { answers, timeTakenSeconds }),

    getLeaderboard: (id) =>
        api.get(`/api/quizzes/${id}/leaderboard`),

    hasAttempted: (id) =>
        api.get(`/api/quizzes/${id}/attempted`),

    getQuizStudents: (id, sort = 'score_desc') =>
        api.get(`/api/quizzes/${id}/students?sort=${sort}`),

    // Public share code (no auth required)
    getByShareCode: (shareCode) =>
        api.get(`/api/public/quizzes/share/${shareCode}`),

    getCategories: () =>
        api.get('/api/categories'),

    getTags: () =>
        api.get('/api/categories/tags'),

    exportQuiz: (id) =>
        api.get(`/api/quizzes/${id}/export`, { responseType: 'blob' }),

    exportAttempts: (id) =>
        api.get(`/api/quizzes/${id}/attempts/export`, { responseType: 'blob' }),
};

// Profile API
export const profileAPI = {
    getProfile: () =>
        api.get('/api/profile'),

    updateProfile: (data) =>
        api.put('/api/profile', data),

    changePassword: (currentPassword, newPassword) =>
        api.post('/api/profile/change-password', { currentPassword, newPassword }),

    getAttempts: () =>
        api.get('/api/profile/attempts'),

    getAttemptsPaginated: (page = 0, size = 10) =>
        api.get(`/api/profile/attempts/paginated?page=${page}&size=${size}`),
};

// Dashboard API (Teacher)
export const dashboardAPI = {
    getStats: () =>
        api.get('/api/dashboard/stats'),

    getQuizzes: (page = 0, size = 10) =>
        api.get(`/api/dashboard/quizzes?page=${page}&size=${size}`),

    getQuizStats: (id) =>
        api.get(`/api/dashboard/quizzes/${id}/stats`),

    getRecentAttempts: (limit = 10) =>
        api.get(`/api/dashboard/recent-attempts?limit=${limit}`),
};

// Admin API
export const adminAPI = {
    // User Management
    getUsers: (page = 0, size = 20) =>
        api.get(`/api/admin/users?page=${page}&size=${size}`),

    getUsersByRole: (role, page = 0, size = 20) =>
        api.get(`/api/admin/users/role/${role}?page=${page}&size=${size}`),

    getUserById: (id) =>
        api.get(`/api/admin/users/${id}`),

    updateUserRole: (id, role) =>
        api.put(`/api/admin/users/${id}/role`, { role }),

    deleteUser: (id) =>
        api.delete(`/api/admin/users/${id}`),

    // Quiz Management
    getQuizzes: (page = 0, size = 20) =>
        api.get(`/api/admin/quizzes?page=${page}&size=${size}`),

    deleteQuiz: (id) =>
        api.delete(`/api/admin/quizzes/${id}`),

    // System Statistics
    getStats: () =>
        api.get('/api/admin/stats'),

    // Attempt Management
    getAttempts: (page = 0, size = 20) =>
        api.get(`/api/admin/attempts?page=${page}&size=${size}`),

    getAttemptById: (id) =>
        api.get(`/api/admin/attempts/${id}`),
};

export default api;
