import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAccount, getProfile, loginRequest, registerRequest, updateProfile, uploadAvatar } from '../api/user';
import { getToken } from '../lib/api';

export const useLogin = () => {
    return useMutation({
        mutationFn: loginRequest,
        onSuccess: (response, variables: any) => {
            if (variables.rememberMe) {
                localStorage.setItem('token', response.data.token);
            } else {
                sessionStorage.setItem('token', response.data.token);
            }
        },
    });
};

export const useRegister = () => {
    return useMutation({
        mutationFn: registerRequest,
        onSuccess: (response) => {
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
        },
    });
};

export const useProfile = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await getProfile();
            return res.data;
        },
        enabled: !!getToken(),
    });

    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    const avatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAccount,
    });

    return {
        ...query,
        updateProfile: mutation.mutate,
        isUpdating: mutation.isPending,
        updateError: mutation.error,
        uploadAvatar: avatarMutation.mutate,
        isUploadingAvatar: avatarMutation.isPending,
        deleteAccount: deleteMutation.mutate,
        isDeletingAccount: deleteMutation.isPending,
    };
};

