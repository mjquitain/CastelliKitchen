import { useMutation } from "@tanstack/react-query";
import { loginRequest } from '../api/user';

export const useLogin = () => {
    return useMutation({
        mutationFn: loginRequest,
        onSuccess: (response) => {
            localStorage.setItem('token', response.data.token);
        },
    });
};

