import { useLogin } from '@/hooks/useAuth';
import { Box, Button, Container, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');

    const navigate = useNavigate();

    const { mutate: login, isPending, error: apiError } = useLogin();

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address (e.g., user@domain.com)');
            return;
        }
        login({ email, password }, {
            onSuccess: () => {
                navigate({ to: '/home' });
            }
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
            <Container
                fluid
                w={{ base: "100%", sm: 420 }}
                px="md"
            >
                <Paper
                    radius="md"
                    p="xl"
                    withBorder
                    style={{
                        backgroundColor: 'white',
                        borderColor: '#97A97C',
                        borderWidth: '2px',
                    }}
                >
                    <Title
                        order={2}
                        ta="center"
                        mb={5}
                        style={{
                            color: '#2d3319',
                            fontWeight: 700,
                            fontSize: '28px',
                        }}
                    >
                        Welcome Back! 🌱
                    </Title>

                    <Text c="dimmed" size="sm" ta="center" mb={30} style={{ color: '#5a6b4f' }}>
                        Reduce food waste, one recipe at a time 🍳
                    </Text>

                    {apiError && (
                        <Text color="red" size="sm" ta="center" mb="md">
                            {(apiError as any).response?.data?.message || "Login failed"}
                        </Text>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextInput
                            mb="md"
                            label="Email"
                            value={email}
                            placeholder="your@email.com"
                            required
                            onChange={(e) => {
                                setEmail(e.currentTarget.value)
                            }}
                            error={emailError}
                            disabled={isPending}
                            styles={{
                                label: {
                                    color: '#2d3319',
                                    fontWeight: 500,
                                    marginBottom: '8px',
                                },
                                input: {
                                    borderColor: '#8a9a7b',
                                    '&:focus': {
                                        borderColor: '#6b7c5e',
                                    },
                                },
                            }}
                        />

                        <PasswordInput
                            mb="md"
                            label="Password"
                            value={password}
                            placeholder="Your password"
                            required
                            onChange={(e) => setPassword(e.currentTarget.value)}
                            disabled={isPending}
                            styles={{
                                label: {
                                    color: '#2d3319',
                                    fontWeight: 500,
                                    marginBottom: '8px',
                                },
                                input: {
                                    borderColor: '#8a9a7b',
                                    '&:focus': {
                                        borderColor: '#6b7c5e',
                                    },
                                },
                            }}
                        />

                        <Button
                            fullWidth
                            mt="xl"
                            type="submit"
                            loading={isPending}
                            style={{
                                backgroundColor: '#97A97C',
                            }}
                        >
                            Sign in
                        </Button>
                    </form>

                    <Text ta="center" mt="md" size="sm" style={{ color: '#666' }}>
                        Don't have an account?{' '}
                        <Text
                            component="a"
                            href="#"
                            style={{
                                color: '#97A97C',
                                fontWeight: 500,
                                textDecoration: 'none',
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                            }}
                        >
                            Sign up
                        </Text>
                    </Text>
                </Paper>
            </Container>
        </Box>
    );
}

export default LoginPage;