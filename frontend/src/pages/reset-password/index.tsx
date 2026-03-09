import { useResetPassword } from '@/hooks/useAuth';
import { Box, Button, Container, Paper, PasswordInput, Text, Title } from '@mantine/core';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';

function ResetPasswordPage() {
    const { token } = useSearch({ strict: false }) as { token?: string };
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const { mutate: doReset, isPending, error: apiError } = useResetPassword();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!token) {
            setFormError('Invalid or missing reset token.');
            return;
        }
        if (newPassword.length < 6) {
            setFormError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }

        doReset({ token, newPassword }, {
            onSuccess: () => setSuccess(true),
            onError: (err: any) => {
                setFormError(err?.response?.data?.message ?? 'Failed to reset password.');
            },
        });
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8f9f8 0%, #e8f0e8 100%)',
            }}
        >
            <Container fluid w={{ base: '100%', sm: 420 }} px="md">
                <Paper
                    radius="md"
                    p="xl"
                    withBorder
                    style={{ backgroundColor: 'white', borderColor: '#97A97C', borderWidth: '2px' }}
                >
                    <Title
                        order={2}
                        ta="center"
                        mb={5}
                        style={{ color: '#2d3319', fontWeight: 700, fontSize: '28px' }}
                    >
                        Reset Password
                    </Title>

                    {success ? (
                        <>
                            <Text size="sm" ta="center" c="dimmed" mt="md" style={{ color: '#5a6b4f' }}>
                                Your password has been reset successfully!
                            </Text>
                            <Button
                                fullWidth
                                mt="xl"
                                style={{ backgroundColor: '#97A97C' }}
                                onClick={() => navigate({ to: '/login' })}
                            >
                                Go to Login
                            </Button>
                        </>
                    ) : (
                        <>
                            <Text size="sm" ta="center" c="dimmed" mb="xl" style={{ color: '#5a6b4f' }}>
                                Enter your new password below.
                            </Text>
                            {(formError || apiError) && (
                                <Text size="sm" c="red" ta="center" mb="md">
                                    {formError || (apiError as any)?.response?.data?.message || 'Something went wrong.'}
                                </Text>
                            )}
                            <form onSubmit={handleSubmit}>
                                <PasswordInput
                                    mb="md"
                                    label="New Password"
                                    placeholder="At least 6 characters"
                                    value={newPassword}
                                    required
                                    onChange={(e) => setNewPassword(e.currentTarget.value)}
                                    disabled={isPending}
                                    styles={{
                                        label: { color: '#2d3319', fontWeight: 500, marginBottom: '8px' },
                                        input: { borderColor: '#8a9a7b' },
                                    }}
                                />
                                <PasswordInput
                                    mb="xl"
                                    label="Confirm New Password"
                                    placeholder="Repeat new password"
                                    value={confirmPassword}
                                    required
                                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                                    disabled={isPending}
                                    styles={{
                                        label: { color: '#2d3319', fontWeight: 500, marginBottom: '8px' },
                                        input: { borderColor: '#8a9a7b' },
                                    }}
                                />
                                <Button
                                    fullWidth
                                    type="submit"
                                    loading={isPending}
                                    style={{ backgroundColor: '#97A97C' }}
                                >
                                    Reset Password
                                </Button>
                            </form>
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}

export default ResetPasswordPage;
