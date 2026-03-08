import { Box, Loader, Text } from '@mantine/core';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';

function AuthCallbackPage() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false });

    useEffect(() => {
        const token = (search as any).token;
        const error = (search as any).error;

        if (token) {
            // Store token in localStorage
            localStorage.setItem('token', token);

            // Redirect to home page
            setTimeout(() => {
                navigate({ to: '/home' });
            }, 500);
        } else if (error) {
            // Redirect to login with error
            setTimeout(() => {
                navigate({ to: '/login' });
            }, 2000);
        }
    }, [search, navigate]);

    const error = (search as any).error;

    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                background: 'linear-gradient(135deg, #f8f9f8 0%, #e8f0e8 100%)',
            }}
        >
            {error ? (
                <>
                    <Text size="xl" c="red">Authentication failed</Text>
                    <Text size="sm" c="dimmed">Redirecting to login...</Text>
                </>
            ) : (
                <>
                    <Loader color="#97A97C" size="lg" />
                    <Text size="lg" style={{ color: '#2d3319' }}>
                        Completing sign in...
                    </Text>
                </>
            )}
        </Box>
    );
}

export default AuthCallbackPage;
