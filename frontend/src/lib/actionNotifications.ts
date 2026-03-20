import { notifications } from "@mantine/notifications";

type ActionNotificationOptions = {
    title: string;
    message: string;
};

export const showActionSuccess = ({ title, message }: ActionNotificationOptions): void => {
    notifications.show({
        title,
        message,
        color: "green",
        withBorder: true,
        autoClose: 2500,
    });
};

export const showActionError = ({ title, message }: ActionNotificationOptions): void => {
    notifications.show({
        title,
        message,
        color: "red",
        withBorder: true,
        autoClose: 3500,
    });
};
