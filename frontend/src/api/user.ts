import api from "../lib/api";

export const loginRequest = (credentials: any) => api.post('/users/login', credentials);
export const registerRequest = (userData: any) => api.post('/users/register', userData);
export const getProfile = () => api.get('/users/profile');