import { notificationApi, type Notification } from "@/api/notifications";
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Group,
    Loader,
    Paper,
    rem,
    Stack,
    Text,
    Title
} from "@mantine/core";
import { AlertTriangle, Bell, BookHeart, Calendar, Check, Heart, Package, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

function NotificationPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await notificationApi.getAll();
            setNotifications(response.data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const dismissNotification = async (id: string) => {
        try {
            await notificationApi.delete(id);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await notificationApi.clearAll();
            setNotifications([]);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const expiredNotifications = notifications.filter(n => n.type === 'ingredient_expired');
    const expiringNotifications = notifications.filter(n => n.type === 'ingredient_expiring');
    const ingredientNotifications = notifications.filter(n =>
        ['ingredient_added', 'ingredient_deleted', 'ingredient_used', 'ingredient_edited'].includes(n.type)
    );
    const recipeNotifications = notifications.filter(n =>
        ['recipe_added', 'recipe_saved', 'recipe_favorited', 'recipe_unfavorited'].includes(n.type)
    ); const unreadCount = notifications.filter(n => !n.isRead).length;
    const totalNotifications = notifications.length;

    const getNotificationIcon = (type: string) => {
        const iconMap: { [key: string]: any } = {
            ingredient_expired: AlertTriangle,
            ingredient_expiring: Calendar,
            ingredient_added: Plus,
            ingredient_deleted: Trash2,
            ingredient_used: Check,
            ingredient_edited: Package,
            recipe_added: Plus,
            recipe_saved: Save,
            recipe_favorited: Heart,
            recipe_unfavorited: Save
        };
        return iconMap[type] || Bell;
    };

    const getNotificationColor = (type: string) => {
        const colorMap: { [key: string]: string } = {
            ingredient_expired: '#d32f2f',
            ingredient_expiring: '#f57c00',
            ingredient_added: '#8a9a7b',
            ingredient_deleted: '#757575',
            ingredient_used: '#388e3c',
            ingredient_edited: '#8a9a7b',
            recipe_added: '#8a9a7b',
            recipe_saved: '#8a9a7b',
            recipe_favorited: '#e54854',
            recipe_unfavorited: '#8a9a7b'
        };
        return colorMap[type] || '#8a9a7b';
    };

    const getNotificationBgColor = (type: string) => {
        const bgColorMap: { [key: string]: string } = {
            ingredient_expired: '#ffebee',
            ingredient_expiring: '#fff3e0',
            ingredient_added: '#e8f0e8',
            ingredient_deleted: '#f5f5f5',
            ingredient_used: '#e8f5e9',
            ingredient_edited: '#e8f0e8',
            recipe_added: '#e8f0e8',
            recipe_saved: '#e8f0e8',
            recipe_favorited: '#ffebee',
            recipe_unfavorited: '#e8f0e8'
        };
        return bgColorMap[type] || '#f8f9f8';
    };

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

        return notificationDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const NotificationCard = ({ notification }: { notification: Notification }) => {
        const Icon = getNotificationIcon(notification.type);
        const color = getNotificationColor(notification.type);
        const bgColor = getNotificationBgColor(notification.type);

        return (
            <Card
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{
                    borderColor: notification.isRead ? '#e0e0e0' : color,
                    borderWidth: '2px',
                    backgroundColor: notification.isRead ? 'white' : bgColor,
                    opacity: notification.isRead ? 0.7 : 1
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
                            <Icon size={24} color={color} />
                        </Box>
                        <div style={{ flex: 1 }}>
                            <Text fw={notification.isRead ? 400 : 600} size="md" style={{ color: '#2d3319' }}>
                                {notification.message}
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>
                                {formatTimeAgo(notification.createdAt)}
                            </Text>
                        </div>
                    </Group>
                    <Group gap="xs">
                        {!notification.isRead && (
                            <ActionIcon
                                variant="light"
                                color="green"
                                size="lg"
                                onClick={() => markAsRead(notification._id)}
                                title="Mark as read"
                            >
                                <Check size={18} />
                            </ActionIcon>
                        )}
                        <ActionIcon
                            variant="light"
                            color="gray"
                            size="lg"
                            onClick={() => dismissNotification(notification._id)}
                            title="Dismiss notification"
                        >
                            <X size={18} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Card>
        );
    };

    if (isLoading) {
        return (
            <Stack align="center" justify="center" mih="100vh" w="100%">
                <Loader size="lg" color="#8a9a7b" />
            </Stack>
        );
    }

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
                            {unreadCount > 0 && (
                                <Badge size="lg" color="red" variant="filled" circle>
                                    {unreadCount}
                                </Badge>
                            )}
                        </Group>
                        <Text size="sm" c="dimmed" style={{ color: '#5a6b4f' }}>
                            Track your ingredients, recipes, and prevent food waste
                        </Text>
                    </div>
                    <Group gap="sm">
                        {unreadCount > 0 && (
                            <Button
                                variant="light"
                                color="green"
                                leftSection={<Check size={16} />}
                                onClick={markAllAsRead}
                            >
                                Mark All Read
                            </Button>
                        )}
                        {totalNotifications > 0 && (
                            <Button
                                variant="light"
                                color="gray"
                                leftSection={<X size={16} />}
                                onClick={clearAllNotifications}
                            >
                                Clear All
                            </Button>
                        )}
                    </Group>
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
                                    You have no notifications at the moment
                                </Text>
                            </div>
                        </Stack>
                    </Paper>
                ) : (
                    <Stack gap="lg">
                        {expiredNotifications.length > 0 && (
                            <div>
                                <Group gap="sm" mb="sm">
                                    <AlertTriangle size={20} color="#d32f2f" />
                                    <Text fw={600} size="lg" style={{ color: '#2d3319' }}>
                                        Expired Ingredients
                                    </Text>
                                    <Badge size="lg" color="red" variant="filled">
                                        {expiredNotifications.length}
                                    </Badge>
                                </Group>
                                <Stack gap="sm">
                                    {expiredNotifications.map(notification => (
                                        <NotificationCard key={notification._id} notification={notification} />
                                    ))}
                                </Stack>
                            </div>
                        )}

                        {expiringNotifications.length > 0 && (
                            <div>
                                <Group gap="sm" mb="sm">
                                    <Calendar size={20} color="#f57c00" />
                                    <Text fw={600} size="lg" style={{ color: '#2d3319' }}>
                                        Expiring Soon
                                    </Text>
                                    <Badge size="lg" color="orange" variant="filled">
                                        {expiringNotifications.length}
                                    </Badge>
                                </Group>
                                <Stack gap="sm">
                                    {expiringNotifications.map(notification => (
                                        <NotificationCard key={notification._id} notification={notification} />
                                    ))}
                                </Stack>
                            </div>
                        )}

                        {ingredientNotifications.length > 0 && (
                            <div>
                                <Group gap="sm" mb="sm">
                                    <Package size={20} color="#8a9a7b" />
                                    <Text fw={600} size="lg" style={{ color: '#2d3319' }}>
                                        Ingredient Updates
                                    </Text>
                                    <Badge size="lg" color="green" variant="filled">
                                        {ingredientNotifications.length}
                                    </Badge>
                                </Group>
                                <Stack gap="sm">
                                    {ingredientNotifications.map(notification => (
                                        <NotificationCard key={notification._id} notification={notification} />
                                    ))}
                                </Stack>
                            </div>
                        )}

                        {recipeNotifications.length > 0 && (
                            <div>
                                <Group gap="sm" mb="sm">
                                    <BookHeart size={20} color="#8a9a7b" />
                                    <Text fw={600} size="lg" style={{ color: '#2d3319' }}>
                                        Recipe Activity
                                    </Text>
                                    <Badge size="lg" color="green" variant="filled">
                                        {recipeNotifications.length}
                                    </Badge>
                                </Group>
                                <Stack gap="sm">
                                    {recipeNotifications.map(notification => (
                                        <NotificationCard key={notification._id} notification={notification} />
                                    ))}
                                </Stack>
                            </div>
                        )}
                    </Stack>
                )}
            </Stack>
        </Stack>
    );
}

export default NotificationPage;
