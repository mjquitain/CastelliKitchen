import { useRegister } from '@/hooks/useAuth';
import { Anchor, Box, Button, Container, Divider, Flex, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignUpPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const navigate = useNavigate();

    const { mutate: register, isPending, error: apiError } = useRegister();

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        // Reset errors
        setEmailError('');
        setPasswordError('');

        // Validate email
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address (e.g., user@domain.com)');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters long');
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        register({ firstname: firstName, lastname: lastName, username, email, password }, {
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
                        Join Us! 🌿
                    </Title>

                    <Text c="dimmed" size="sm" ta="center" mb={30} style={{ color: '#5a6b4f' }}>
                        Start your journey to reduce food waste 🥗
                    </Text>

                    {apiError && (
                        <Text color="red" size="sm" ta="center" mb="md">
                            {(apiError as any).response?.data?.message || "Registration failed"}
                        </Text>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextInput
                            mb="md"
                            label="First Name"
                            value={firstName}
                            placeholder="Enter your first name"
                            required
                            onChange={(e) => setFirstName(e.currentTarget.value)}
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

                        <TextInput
                            mb="md"
                            label="Last Name"
                            value={lastName}
                            placeholder="Enter your last name"
                            required
                            onChange={(e) => setLastName(e.currentTarget.value)}
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

                        <TextInput
                            mb="md"
                            label="Username"
                            value={username}
                            placeholder="Enter your preferred username"
                            required
                            onChange={(e) => setUsername(e.currentTarget.value)}
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

                        <TextInput
                            mb="md"
                            label="Email"
                            value={email}
                            placeholder="your@email.com"
                            required
                            onChange={(e) => {
                                setEmail(e.currentTarget.value);
                                setEmailError('');
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
                            placeholder="At least 6 characters"
                            required
                            onChange={(e) => {
                                setPassword(e.currentTarget.value);
                                setPasswordError('');
                            }}
                            error={passwordError}
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
                            label="Confirm Password"
                            value={confirmPassword}
                            placeholder="Re-enter your password"
                            required
                            onChange={(e) => {
                                setConfirmPassword(e.currentTarget.value);
                                setPasswordError('');
                            }}
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
                            Sign up
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

                    <Flex direction="row" justify="center" align="center">
                        <Text mt="md" size="sm" style={{ color: '#666' }}>
                            Already have an account?{' '}
                            <Anchor
                                type="button"
                                mt="md"
                                size="sm"
                                onClick={() => navigate({ to: '/login' })}
                                style={{ color: '#97A97C' }}
                            >
                                Sign in
                            </Anchor>
                        </Text>
                    </Flex>
                </Paper>
            </Container>
        </Box>
    );
}

export default SignUpPage;
