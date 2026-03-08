import { useLogin } from '@/hooks/useAuth';
import { Anchor, Box, Button, Checkbox, Container, Divider, Flex, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const navigate = useNavigate();

    const { mutate: login, isPending, error: apiError } = useLogin();

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address (e.g., user@domain.com)');
            return;
        }
        login({ email, password, rememberMe }, {
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

                        <Flex justify="space-between" align="center" mb="md">
                            <Checkbox
                                label="Remember me"
                                checked={rememberMe}
                                onChange={(event) => setRememberMe(event.currentTarget.checked)}
                            />

                            <Anchor
                                type="button"
                                size="sm"
                                style={{ color: '#97A97C', fontWeight: 500 }}
                            >
                                Forgot Password?
                            </Anchor>
                        </Flex>

                        <Button
                            fullWidth
                            type="submit"
                            loading={isPending}
                            style={{
                                backgroundColor: '#97A97C',
                            }}
                        >
                            Sign in
                        </Button>
                    </form>

                    <Divider label="OR" labelPosition="center" my="lg" />

                    <Button
                        fullWidth
                        variant="outline"
                        leftSection={
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.96H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.04l3.007-2.332z" />
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                            </svg>
                        }
                        onClick={() => {
                            window.location.href = 'http://localhost:5000/api/v1/auth/google';
                        }}
                        style={{
                            borderColor: '#dadce0',
                            color: '#3c4043',
                        }}
                    >
                        Continue with Google
                    </Button>
                </Paper>
            </Container>
        </Box >
    );
}

export default LoginPage;