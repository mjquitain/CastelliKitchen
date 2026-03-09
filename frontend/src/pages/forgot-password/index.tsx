import { useForgotPassword } from '@/hooks/useAuth';
import { Box, Button, Container, Paper, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const navigate = useNavigate();
    const { mutate: sendReset, isPending } = useForgotPassword();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');

        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address (e.g., user@domain.com)');
            return;
        }

        sendReset(email, {
            onSuccess: () => setSubmitted(true),
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
                        Forgot Password
                    </Title>

                    {submitted ? (
                        <>
                            <Text size="sm" ta="center" c="dimmed" mt="md" style={{ color: '#5a6b4f' }}>
                                If an account with that email exists, a reset link has been sent. Check your inbox.
                            </Text>
                            <Button
                                fullWidth
                                mt="xl"
                                variant="outline"
                                style={{ borderColor: '#97A97C', color: '#97A97C' }}
                                onClick={() => navigate({ to: '/login' })}
                            >
                                Back to Login
                            </Button>
                        </>
                    ) : (
                        <>
                            <Text size="sm" ta="center" c="dimmed" mb="xl" style={{ color: '#5a6b4f' }}>
                                Enter your email address and we'll send you a link to reset your password.
                            </Text>
                            <form onSubmit={handleSubmit}>
                                <TextInput
                                    mb="md"
                                    label="Email"
                                    placeholder="your@email.com"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.currentTarget.value)}
                                    error={emailError}
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
                                    Send Reset Link
                                </Button>
                            </form>
                            <Text size="sm" ta="center" mt="md">
                                <Button
                                    variant="transparent"
                                    size="sm"
                                    style={{ color: '#97A97C', padding: 0 }}
                                    onClick={() => navigate({ to: '/login' })}
                                >
                                    Back to Login
                                </Button>
                            </Text>
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}

export default ForgotPasswordPage;
