import { useVerifyEmail } from '@/hooks/useAuth';
import { Box, Button, Container, Loader, Paper, Text, Title } from '@mantine/core';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';

function VerifyEmailPage() {
    const { token } = useSearch({ strict: false }) as { token?: string };
    const navigate = useNavigate();
    const { mutate: doVerify, isPending, isSuccess, isError, error } = useVerifyEmail();

    useEffect(() => {
        if (token) {
            doVerify(token);
        }
    }, [token]);

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
                    style={{
                        backgroundColor: 'white',
                        borderColor: '#97A97C',
                        borderWidth: '2px',
                        textAlign: 'center',
                    }}
                >
                    {(isPending || (!isSuccess && !isError)) && (
                        <>
                            <Loader color="#97A97C" size="lg" mb="md" />
                            <Title order={3} style={{ color: '#2d3319' }} mb="xs">
                                Verifying your email...
                            </Title>
                            <Text size="sm" c="dimmed">
                                Please wait a moment.
                            </Text>
                        </>
                    )}

                    {isSuccess && (
                        <>
                            <Title order={2} style={{ color: '#2d3319' }} mb="xs">
                                Email Verified! ✅
                            </Title>
                            <Text size="sm" c="dimmed" mb="xl">
                                Your email has been successfully verified. You can now log in.
                            </Text>
                            <Button
                                fullWidth
                                style={{ backgroundColor: '#97A97C' }}
                                onClick={() => navigate({ to: '/login' })}
                            >
                                Go to Login
                            </Button>
                        </>
                    )}

                    {isError && (
                        <>
                            <Title order={2} style={{ color: '#c0392b' }} mb="xs">
                                Verification Failed
                            </Title>
                            <Text size="sm" c="dimmed" mb="xl">
                                {(error as any)?.response?.data?.message ||
                                    'The verification link is invalid or has expired.'}
                            </Text>
                            <Button
                                fullWidth
                                variant="outline"
                                style={{ borderColor: '#97A97C', color: '#2d3319' }}
                                onClick={() => navigate({ to: '/signup' })}
                            >
                                Back to Sign Up
                            </Button>
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}

export default VerifyEmailPage;
