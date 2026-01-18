import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Paper,
    rem,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { AlertTriangle, Bell, Calendar, Check, Package, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ingredients } from "../../data/mock_ingredients_data";

interface Ingredient {
    id: number;
    quantity: string;
    name: string;
    category: string;
    dateAdded: string;
    expiryDate: string;
}

const getDaysUntilExpiry = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

function NotificationPage() {
    const [dismissedNotifications, setDismissedNotifications] = useState<number[]>([]);

    const expiredIngredients = ingredients.filter((item: Ingredient) => {
        const days = getDaysUntilExpiry(item.expiryDate);
        return days < 0 && !dismissedNotifications.includes(item.id);
    });

    const expiringSoonIngredients = ingredients.filter((item: Ingredient) => {
        const days = getDaysUntilExpiry(item.expiryDate);
        return days >= 0 && days <= 3 && !dismissedNotifications.includes(item.id);
    });

    const expiringThisWeekIngredients = ingredients.filter((item: Ingredient) => {
        const days = getDaysUntilExpiry(item.expiryDate);
        return days > 3 && days <= 7 && !dismissedNotifications.includes(item.id);
    });

    const dismissNotification = (id: number) => {
        setDismissedNotifications([...dismissedNotifications, id]);
    };

    const clearAllNotifications = () => {
        const allIds = [
            ...expiredIngredients,
            ...expiringSoonIngredients,
            ...expiringThisWeekIngredients
        ].map(item => item.id);
        setDismissedNotifications(allIds);
    };

    const totalNotifications = expiredIngredients.length + expiringSoonIngredients.length + expiringThisWeekIngredients.length;

    const IngredientNotificationCard = ({ item, status }: { item: Ingredient; status: 'expired' | 'expiring-soon' | 'expiring-week' }) => {
        const days = getDaysUntilExpiry(item.expiryDate);
        const isExpired = days < 0;

        const statusConfig = {
            'expired': { color: '#d32f2f', bgColor: '#ffebee', label: `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`, icon: AlertTriangle },
            'expiring-soon': { color: '#f57c00', bgColor: '#fff3e0', label: days === 0 ? 'Expires today!' : `Expires in ${days} day${days !== 1 ? 's' : ''}`, icon: AlertTriangle },
            'expiring-week': { color: '#fbc02d', bgColor: '#fffde7', label: `Expires in ${days} days`, icon: Calendar }
        };

        const config = statusConfig[status];
        const Icon = config.icon;

        return (
            <Card
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{
                    borderColor: config.color,
                    borderWidth: '2px',
                    backgroundColor: config.bgColor,
                }}
            >
                <Group justify="space-between" wrap="nowrap">
                    <Group gap="md" style={{ flex: 1 }}>
                        <Box
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                backgroundColor: 'white',
                            }}
                        >
                            <Icon size={24} color={config.color} />
                        </Box>
                        <div style={{ flex: 1 }}>
                            <Group gap="xs" mb={4}>
                                <Text fw={600} size="md" style={{ color: '#2d3319' }}>
                                    {item.name}
                                </Text>
                                <Badge size="sm" variant="light" color="gray">
                                    {item.category}
                                </Badge>
                            </Group>
                            <Group gap="md">
                                <Text size="sm" c="dimmed">
                                    <Package size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                    {item.quantity}
                                </Text>
                                <Text size="sm" style={{ color: config.color, fontWeight: 500 }}>
                                    {config.label}
                                </Text>
                            </Group>
                            <Text size="xs" c="dimmed" mt={4}>
                                Expiry: {new Date(item.expiryDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </Text>
                        </div>
                    </Group>
                    <Group gap="xs">
                        {isExpired && (
                            <ActionIcon
                                variant="light"
                                color="red"
                                size="lg"
                                title="Remove from pantry"
                            >
                                <Trash2 size={18} />
                            </ActionIcon>
                        )}
                        <ActionIcon
                            variant="light"
                            color="gray"
                            size="lg"
                            onClick={() => dismissNotification(item.id)}
                            title="Dismiss notification"
                        >
                            <X size={18} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Card>
        );
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
                <Group justify="space-between" mb="md">
                    <div>
                        <Group gap="sm" mb={4}>
                            <Bell size={28} color="#8a9a7b" />
                            <Title order={2} style={{ color: '#2d3319' }}>
                                Notifications
                            </Title>
                        </Group>
                        <Text size="sm" c="dimmed" style={{ color: '#5a6b4f' }}>
                            Track your ingredients and prevent food waste
                        </Text>
                    </div>
                    {totalNotifications > 0 && (
                        <Button
                            variant="light"
                            color="gray"
                            leftSection={<Check size={16} />}
                            onClick={clearAllNotifications}
                        >
                            Clear All
                        </Button>
                    )}
                </Group>

                {totalNotifications === 0 ? (
                    <Paper
                        shadow="sm"
                        p="xl"
                        radius="md"
                        style={{
                            backgroundColor: 'white',
                            border: '2px solid #e8f0e8',
                            textAlign: 'center'
                        }}
                    >
                        <Stack align="center" gap="md" py="xl">
                            <Box
                                style={{
                                    padding: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: '#e8f0e8',
                                }}
                            >
                                <Check size={48} color="#8a9a7b" />
                            </Box>
                            <div>
                                <Text fw={500} size="lg" style={{ color: '#2d3319' }}>
                                    All Clear! 🎉
                                </Text>
                                <Text size="sm" c="dimmed" mt="xs">
                                    You have no expiring or expired ingredients at the moment
                                </Text>
                            </div>
                        </Stack>
                    </Paper>
                ) : (
                    <Alert
                        icon={<AlertTriangle size={20} />}
                        title="Ingredient Status Overview"
                        color="orange"
                        styles={{
                            root: {
                                backgroundColor: '#fff3e0',
                                borderColor: '#f57c00',
                            },
                        }}
                    >
                        <Group gap="lg">
                            {expiredIngredients.length > 0 && (
                                <Text size="sm">
                                    <Badge color="red" variant="filled" mr={6}>
                                        {expiredIngredients.length}
                                    </Badge>
                                    Expired
                                </Text>
                            )}
                            {expiringSoonIngredients.length > 0 && (
                                <Text size="sm">
                                    <Badge color="orange" variant="filled" mr={6}>
                                        {expiringSoonIngredients.length}
                                    </Badge>
                                    Expiring in 3 days or less
                                </Text>
                            )}
                            {expiringThisWeekIngredients.length > 0 && (
                                <Text size="sm">
                                    <Badge color="yellow" variant="filled" mr={6}>
                                        {expiringThisWeekIngredients.length}
                                    </Badge>
                                    Expiring this week
                                </Text>
                            )}
                        </Group>
                    </Alert>
                )}

                {expiredIngredients.length > 0 && (
                    <Paper
                        shadow="sm"
                        p="lg"
                        radius="md"
                        style={{
                            backgroundColor: 'white',
                            border: '2px solid #e8f0e8',
                        }}
                    >
                        <Group mb="md">
                            <Badge color="red" variant="filled" size="lg">
                                {expiredIngredients.length}
                            </Badge>
                            <Title order={4} style={{ color: '#d32f2f' }}>
                                Expired Ingredients
                            </Title>
                        </Group>
                        <Divider mb="md" />
                        <Stack gap="sm">
                            {expiredIngredients.map((item: Ingredient) => (
                                <IngredientNotificationCard
                                    key={item.id}
                                    item={item}
                                    status="expired"
                                />
                            ))}
                        </Stack>
                    </Paper>
                )}

                {expiringSoonIngredients.length > 0 && (
                    <Paper
                        shadow="sm"
                        p="lg"
                        radius="md"
                        style={{
                            backgroundColor: 'white',
                            border: '2px solid #e8f0e8',
                        }}
                    >
                        <Group mb="md">
                            <Badge color="orange" variant="filled" size="lg">
                                {expiringSoonIngredients.length}
                            </Badge>
                            <Title order={4} style={{ color: '#f57c00' }}>
                                Expiring Soon (3 days or less)
                            </Title>
                        </Group>
                        <Divider mb="md" />
                        <Stack gap="sm">
                            {expiringSoonIngredients.map((item: Ingredient) => (
                                <IngredientNotificationCard
                                    key={item.id}
                                    item={item}
                                    status="expiring-soon"
                                />
                            ))}
                        </Stack>
                    </Paper>
                )}

                {expiringThisWeekIngredients.length > 0 && (
                    <Paper
                        shadow="sm"
                        p="lg"
                        radius="md"
                        style={{
                            backgroundColor: 'white',
                            border: '2px solid #e8f0e8',
                        }}
                    >
                        <Group mb="md">
                            <Badge color="yellow" variant="filled" size="lg">
                                {expiringThisWeekIngredients.length}
                            </Badge>
                            <Title order={4} style={{ color: '#fbc02d' }}>
                                Expiring This Week (4-7 days)
                            </Title>
                        </Group>
                        <Divider mb="md" />
                        <Stack gap="sm">
                            {expiringThisWeekIngredients.map((item: Ingredient) => (
                                <IngredientNotificationCard
                                    key={item.id}
                                    item={item}
                                    status="expiring-week"
                                />
                            ))}
                        </Stack>
                    </Paper>
                )}
            </Stack>
        </Stack>
    );
}

export default NotificationPage;