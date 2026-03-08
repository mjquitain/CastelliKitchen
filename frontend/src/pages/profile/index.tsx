import { logoutRequest } from "@/api/user";
import { useProfile } from "@/hooks/useAuth";
import { clearToken } from "@/lib/api";
import {
    Avatar,
    Box,
    Button,
    Card,
    Center,
    Divider,
    FileButton,
    Flex,
    Group,
    Loader,
    Modal,
    Paper,
    rem,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import {
    Award,
    Calendar,
    ChefHat,
    Edit,
    Heart,
    Leaf,
    LogOut,
    Mail,
    X
} from "lucide-react";
import { useEffect, useState } from "react";

interface EditData {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
}

function ProfilePage() {
    const [file, setFile] = useState<File | null>(null);
    const imageURL = file ? URL.createObjectURL(file) : null;
    const { data: profileData, isLoading, isError, updateProfile, isUpdating, uploadAvatar, isUploadingAvatar, deleteAccount, isDeletingAccount } = useProfile();

    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editData, setEditData] = useState<EditData>({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
    });

    useEffect(() => {
        if (profileData) {
            setEditData({
                firstname: profileData.firstname ?? '',
                lastname: profileData.lastname ?? '',
                username: profileData.username ?? '',
                email: profileData.email ?? '',
            });
        }
    }, [profileData]);

    const handleSave = () => {
        setSaveError(null);
        updateProfile(editData, {
            onSuccess: () => {
                setIsEditing(false);
                setSaveError(null);
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to save. Please try again.';
                setSaveError(msg);
                console.error('Profile update error:', err?.response ?? err);
            },
        });
    };

    const handleCancel = () => {
        if (profileData) {
            setEditData({
                firstname: profileData.firstname ?? '',
                lastname: profileData.lastname ?? '',
                username: profileData.username ?? '',
                email: profileData.email ?? '',
            });
        }
        setIsEditing(false);
    };

    const stats = [
        { icon: ChefHat, label: "Recipes Generated", color: "#8a9a7b" },
        { icon: Heart, label: "Favorite Recipes", color: "#d32f2f" },
        { icon: Leaf, label: "Food Saved", color: "#6b7c5e" },
        { icon: Award, label: "Days Active", color: "#fbc02d" },
    ];

    const joinDate = profileData?.createdAt
        ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : null;

    const navigate = useNavigate()

    const handleLogout = () => {
        if (profileData?.email) {
            logoutRequest(profileData.email).finally(() => {
                clearToken();
                navigate({ to: '/home' });
            });
        } else {
            clearToken();
            navigate({ to: '/home' });
        }
    };

    const handleDeleteAccount = () => {
        deleteAccount(undefined, {
            onSuccess: () => {
                clearToken();
                navigate({ to: '/home' });
            },
        });
    };

    return (
        <Stack
            align="center"
            mih="100vh"
            w="100%"
            style={{ backgroundColor: "#f8f9f8" }}
        >
            <Stack
                w="100%"
                maw={rem(1655)}
                p="xl"
                gap="xs"
            >
                <div>
                    <Title order={2} style={{ color: '#2d3319' }}>
                        My Profile
                    </Title>
                    <Text size="sm" c="dimmed" style={{ color: '#5a6b4f' }}>
                        Manage your account and track your progress
                    </Text>
                </div>

                <Paper
                    shadow="sm"
                    p="xl"
                    radius="md"
                    style={{
                        backgroundColor: 'white',
                        border: '2px solid #e8f0e8',
                    }}
                >
                    {isLoading ? (
                        <Center py="xl"><Loader color="#8a9a7b" /></Center>
                    ) : isError ? (
                        <Center py="xl">
                            <Text c="red" size="sm">Failed to load profile. Please try again.</Text>
                        </Center>
                    ) : (
                        <Group align="flex-start" wrap="nowrap" gap="lg">
                            <Flex direction="column" align="center" gap="md">
                                <Avatar
                                    size={120}
                                    radius="md"
                                    src={imageURL ?? profileData?.avatar ?? undefined}
                                    style={{ borderWidth: '2px', borderColor: '#8a9a7b' }}
                                />
                            </Flex>
                            <Box style={{ flex: 1 }}>
                                {!isEditing ? (
                                    <>
                                        <Group justify="space-between" align="center" mb="xs">
                                            <Flex direction="column">
                                                <Title order={3} style={{ color: '#2d3319' }}>
                                                    {profileData?.firstname} {profileData?.lastname}
                                                </Title>
                                                <Text size="sm" c="dimmed">
                                                    @{profileData?.username}
                                                </Text>
                                            </Flex>
                                            <Button
                                                size="sm"
                                                variant="filled"
                                                color="#8a9a7b"
                                                leftSection={<Edit size={16} />}
                                                onClick={() => setIsEditing(true)}
                                                style={{ color: 'white' }}
                                            >
                                                Edit Profile
                                            </Button>
                                        </Group>
                                        <Stack gap="xs">
                                            <Group gap="xs">
                                                <Mail size={16} color="#8a9a7b" />
                                                <Text size="sm">{profileData?.email}</Text>
                                            </Group>
                                            {joinDate && (
                                                <Group gap="xs">
                                                    <Calendar size={16} color="#8a9a7b" />
                                                    <Text size="sm">Joined {joinDate}</Text>
                                                </Group>
                                            )}
                                        </Stack>
                                    </>
                                ) : (
                                    <Stack gap="md">
                                        <SimpleGrid cols={2} spacing="md">
                                            <TextInput
                                                label="First Name"
                                                value={editData.firstname}
                                                onChange={(e) => setEditData({ ...editData, firstname: e.target.value })}
                                                styles={{
                                                    label: { color: '#2d3319', fontWeight: 500 },
                                                    input: { borderColor: '#8a9a7b' },
                                                }}
                                            />
                                            <TextInput
                                                label="Last Name"
                                                value={editData.lastname}
                                                onChange={(e) => setEditData({ ...editData, lastname: e.target.value })}
                                                styles={{
                                                    label: { color: '#2d3319', fontWeight: 500 },
                                                    input: { borderColor: '#8a9a7b' },
                                                }}
                                            />
                                        </SimpleGrid>
                                        <TextInput
                                            label="Username"
                                            value={editData.username}
                                            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                            styles={{
                                                label: { color: '#2d3319', fontWeight: 500 },
                                                input: { borderColor: '#8a9a7b' },
                                            }}
                                        />
                                        <TextInput
                                            label="Email"
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            styles={{
                                                label: { color: '#2d3319', fontWeight: 500 },
                                                input: { borderColor: '#8a9a7b' },
                                            }}
                                        />
                                        {saveError && (
                                            <Text size="sm" c="red" mt="xs">{saveError}</Text>
                                        )}
                                        <Group gap="sm" mt="md">
                                            <Button
                                                onClick={handleSave}
                                                loading={isUpdating}
                                                styles={{
                                                    root: {
                                                        backgroundColor: '#8a9a7b',
                                                        '&:hover': { backgroundColor: '#6b7c5e' },
                                                    },
                                                }}
                                            >
                                                Save Changes
                                            </Button>
                                            <FileButton onChange={(selectedFile) => {
                                                setFile(selectedFile);
                                                if (selectedFile) uploadAvatar(selectedFile, { onSuccess: () => setFile(null) });
                                            }} accept="image/png,image/jpeg,image/webp">
                                                {(props) => <Button {...props} color="#8a9a7b" loading={isUploadingAvatar}>Change Image</Button>}
                                            </FileButton>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancel}
                                                disabled={isUpdating}
                                                styles={{
                                                    root: {
                                                        borderColor: '#8a9a7b',
                                                        color: '#8a9a7b',
                                                    },
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </Group>
                                    </Stack>
                                )}
                            </Box>
                        </Group>
                    )}
                </Paper>

                <div>
                    <Title order={4} mb="md" style={{ color: '#2d3319' }}>
                        Your Statistics
                    </Title>
                    <SimpleGrid cols={4} spacing="lg">
                        {stats.map((stat, index) => (
                            <Card
                                key={index}
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                style={{ borderColor: '#e8f0e8' }}
                            >
                                <Stack align="center" gap="xs">
                                    <Box
                                        style={{
                                            padding: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: stat.color + '20',
                                        }}
                                    >
                                        <stat.icon size={24} color={stat.color} />
                                    </Box>
                                    <Text size="sm" c="dimmed" ta="center">
                                        {stat.label}
                                    </Text>
                                    <Text size="xs" c="dimmed" ta="center" fs="italic">
                                        Coming soon
                                    </Text>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                </div>

                <Paper
                    shadow="sm"
                    p="lg"
                    radius="md"
                    style={{
                        backgroundColor: 'white',
                        border: '2px solid #e8f0e8',
                    }}
                >
                    <Title order={4} mb="md" style={{ color: '#2d3319' }}>
                        Achievements
                    </Title>
                    <Divider mb="md" color="#e8f0e8" />
                    <Center py="lg">
                        <Stack align="center" gap="xs">
                            <Award size={40} color="#c8d8c0" />
                            <Text size="sm" c="dimmed">Achievements are coming soon!</Text>
                        </Stack>
                    </Center>
                </Paper>

                <Paper
                    shadow="sm"
                    p="lg"
                    radius="md"
                    style={{
                        backgroundColor: 'white',
                        border: '2px solid #e8f0e8',
                    }}
                >
                    <Title order={4} mb="md" style={{ color: '#2d3319' }}>
                        Quick Actions
                    </Title>
                    <Group gap="md" grow>
                        <Button
                            variant="transparent"
                            style={{ color: '#8a9a7b', borderColor: '#8a9a7b' }}
                            leftSection={<Edit size={16} />}
                        >
                            Change Password
                        </Button>
                        <Button
                            variant="transparent"
                            onClick={handleLogout}
                            leftSection={<LogOut size={16} />}
                            style={{ color: '#8a9a7b', borderColor: '#8a9a7b' }}
                        >
                            Logout
                        </Button>
                        {!showDeleteConfirm ? (
                            <Button
                                variant="light"
                                color="red"
                                leftSection={<X size={16} />}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                Delete Account
                            </Button>
                        ) : (
                            <Modal opened={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} centered radius="md" title={<Title size="lg">Confirm Account Deletion</Title>}>
                                <Text size="sm" c="red">
                                    This action cannot be undone. Are you sure you want to delete your account?
                                </Text>
                                <Group mt="md" gap="xs">
                                    <Button color="red" onClick={handleDeleteAccount} loading={isDeletingAccount}>
                                        Yes, Delete My Account
                                    </Button>
                                    <Button variant="outline" disabled={isDeletingAccount} onClick={() => setShowDeleteConfirm(false)}>
                                        Cancel
                                    </Button>
                                </Group>
                            </Modal>
                        )}
                    </Group>
                </Paper>
            </Stack>
        </Stack>
    );
}

export default ProfilePage;
