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
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/users/me/profile/password', data);
export const forgotPassword = (email: string) =>
    api.post('/users/forgot-password', { email });
export const resetPassword = (data: { token: string; newPassword: string }) =>
    api.post('/users/reset-password', data);
export const verifyEmail = (token: string) =>
    api.post('/users/verify-email', { token });
export const resendVerification = (email: string) =>
    api.post('/users/resend-verification', { email });