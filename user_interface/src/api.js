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
            // Token expired or invalid - clear storage and redirect to login
            localStorage.removeItem('user');
            window.location.href = '/';
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
};

// Quiz API
export const quizAPI = {
    getAllQuizzes: () =>
        api.get('/api/quizzes'),

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

    submitQuiz: (id, answers, timeTakenSeconds) =>
        api.post(`/api/quizzes/${id}/submit`, { answers, timeTakenSeconds }),

    getLeaderboard: (id) =>
        api.get(`/api/quizzes/${id}/leaderboard`),
};

// User API
export const userAPI = {
    getProfile: () =>
        api.get('/api/users/me'),

    getScoreHistory: () =>
        api.get('/api/users/me/scores'),
};

export default api;
