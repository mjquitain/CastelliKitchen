import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Flex,
    Group,
    Paper,
    rem,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import {
    Award,
    Calendar,
    ChefHat,
    Edit,
    Heart,
    Leaf,
    Mail,
    MapPin,
    Phone,
    Settings,
    User,
} from "lucide-react";
import { useState } from "react";

function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);

    const [userData, setUserData] = useState({
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 234 567 8900",
        location: "New York, USA",
        joinDate: "October 2025",
        bio: "Food enthusiast committed to reducing waste and cooking delicious meals!",
    });

    const [editData, setEditData] = useState(userData);

    const handleSave = () => {
        setUserData(editData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData(userData);
        setIsEditing(false);
    };

    const stats = [
        { icon: ChefHat, label: "Recipes Generated", value: "48", color: "#8a9a7b" },
        { icon: Heart, label: "Favorite Recipes", value: "12", color: "#d32f2f" },
        { icon: Leaf, label: "Food Saved", value: "5.2 kg", color: "#6b7c5e" },
        { icon: Award, label: "Days Active", value: "32", color: "#fbc02d" },
    ];

    const achievements = [
        { title: "First Recipe", desc: "Generated your first recipe", unlocked: true },
        { title: "Waste Warrior", desc: "Saved 5kg of food from waste", unlocked: true },
        { title: "Recipe Master", desc: "Generated 50+ recipes", unlocked: false },
        { title: "Zero Waste Week", desc: "No expired ingredients for 7 days", unlocked: false },
    ];

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
                <Group justify="space-between" mb="md">
                    <div>
                        <Title order={2} style={{ color: '#2d3319' }}>
                            My Profile
                        </Title>
                        <Text size="sm" c="dimmed" style={{ color: '#5a6b4f' }}>
                            Manage your account and track your progress
                        </Text>
                    </div>
                    <Button
                        leftSection={<Settings size={18} />}
                        variant="transparent"
                        style={{ color: '#8a9a7b', borderColor: '#8a9a7b' }}
                    >
                        Settings
                    </Button>
                </Group>

                <Paper
                    shadow="sm"
                    p="xl"
                    radius="md"
                    style={{
                        backgroundColor: 'white',
                        border: '2px solid #e8f0e8',
                    }}
                >
                    <Group align="flex-start" wrap="nowrap" gap="lg">
                        <Avatar
                            size={120}
                            radius="md"
                            style={{
                                borderWidth: '2px',
                                borderColor: '#8a9a7b',
                            }}
                        >
                            <User size={60} color="black " />
                        </Avatar>
                        <Box style={{ flex: 1 }}>
                            {!isEditing ? (
                                <>
                                    <Group justify="space-between" align="center" mb="xs">
                                        <Flex direction={"column"}>
                                            <Title order={3} style={{ color: '#2d3319' }}>
                                                {userData.name}
                                            </Title>
                                            <Text size="sm" c="dimmed">
                                                {userData.bio}
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
                                            <Text size="sm">{userData.email}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Phone size={16} color="#8a9a7b" />
                                            <Text size="sm">{userData.phone}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <MapPin size={16} color="#8a9a7b" />
                                            <Text size="sm">{userData.location}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Calendar size={16} color="#8a9a7b" />
                                            <Text size="sm">Joined {userData.joinDate}</Text>
                                        </Group>
                                    </Stack>
                                </>
                            ) : (
                                <Stack gap="md">
                                    <TextInput
                                        label="Name"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
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
                                    <TextInput
                                        label="Phone"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        styles={{
                                            label: { color: '#2d3319', fontWeight: 500 },
                                            input: { borderColor: '#8a9a7b' },
                                        }}
                                    />
                                    <TextInput
                                        label="Location"
                                        value={editData.location}
                                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                        styles={{
                                            label: { color: '#2d3319', fontWeight: 500 },
                                            input: { borderColor: '#8a9a7b' },
                                        }}
                                    />
                                    <TextInput
                                        label="Bio"
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                        styles={{
                                            label: { color: '#2d3319', fontWeight: 500 },
                                            input: { borderColor: '#8a9a7b' },
                                        }}
                                    />
                                    <Group gap="sm" mt="md">
                                        <Button
                                            onClick={handleSave}
                                            styles={{
                                                root: {
                                                    backgroundColor: '#8a9a7b',
                                                    '&:hover': {
                                                        backgroundColor: '#6b7c5e',
                                                    },
                                                },
                                            }}
                                        >
                                            Save Changes
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
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
                                    <Text size="xl" fw={700} style={{ color: '#2d3319' }}>
                                        {stat.value}
                                    </Text>
                                    <Text size="sm" c="dimmed" ta="center">
                                        {stat.label}
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
                    <SimpleGrid cols={2} spacing="md">
                        {achievements.map((achievement, index) => (
                            <Card
                                key={index}
                                padding="md"
                                radius="md"
                                style={{
                                    backgroundColor: achievement.unlocked ? '#e8f0e8' : '#f5f5f5',
                                    border: achievement.unlocked ? '2px solid #8a9a7b' : '2px solid #e0e0e0',
                                    opacity: achievement.unlocked ? 1 : 0.6,
                                }}
                            >
                                <Group gap="md" wrap="nowrap">
                                    <Box
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            backgroundColor: achievement.unlocked ? '#8a9a7b' : '#d0d0d0',
                                        }}
                                    >
                                        <Award size={24} color="white" />
                                    </Box>
                                    <div style={{ flex: 1 }}>
                                        <Group gap="xs" mb={4}>
                                            <Text fw={600} size="sm" style={{ color: '#2d3319' }}>
                                                {achievement.title}
                                            </Text>
                                            {achievement.unlocked && (
                                                <Badge size="xs" color="green" variant="filled">
                                                    Unlocked
                                                </Badge>
                                            )}
                                        </Group>
                                        <Text size="xs" c="dimmed">
                                            {achievement.desc}
                                        </Text>
                                    </div>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
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
                        >
                            Change Password
                        </Button>
                        <Button
                            variant="transparent"
                            style={{ color: '#8a9a7b', borderColor: '#8a9a7b' }}
                        >
                            Notification Settings
                        </Button>
                        <Button
                            variant="transparent"
                            style={{ color: '#8a9a7b', borderColor: '#8a9a7b' }}
                        >
                            Privacy Settings
                        </Button>
                        <Button
                            variant="light"
                            color="red"
                        >
                            Delete Account
                        </Button>
                    </Group>
                </Paper>
            </Stack>
        </Stack>
    );
}

export default ProfilePage;