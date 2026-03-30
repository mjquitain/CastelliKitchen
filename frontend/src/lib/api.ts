import axios from "axios";

export const getToken = () =>
    localStorage.getItem('token') || sessionStorage.getItem('token');

export const clearToken = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    withCredentials: true,
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
