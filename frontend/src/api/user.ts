import api from "../lib/api";

export const loginRequest = (credentials: any) => api.post('/users/login', credentials);
export const registerRequest = (userData: any) => api.post('/users/register', userData);
export const getProfile = () => api.get('/users/me/profile');
export const updateProfile = (data: { firstname?: string; lastname?: string; username?: string; email?: string }) =>
    api.patch('/users/me/profile', data);

export const uploadAvatar = (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/users/upload-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const logoutRequest = (email: string) => api.post('/users/logout', { email });
export const deleteAccount = () => api.delete('/users/me/profile');