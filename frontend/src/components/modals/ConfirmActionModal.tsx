import { Button, Flex, Modal, Stack, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import type { ReactNode } from "react";

interface ConfirmActionModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
    confirmIcon?: ReactNode;
    isLoading?: boolean;
}

type ConfirmActionModalContentProps = Omit<ConfirmActionModalProps, "opened">;

const ConfirmActionModalContent: React.FC<ConfirmActionModalContentProps> = ({
    onClose,
    onConfirm,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmColor = "#e54854",
    confirmIcon,
    isLoading = false,
}) => {
    return (
        <Stack gap="md">
            <Text size="sm" ta="center">
                {message}
            </Text>
            <Flex gap="md">
                <Button
                    leftSection={confirmIcon}
                    onClick={onConfirm}
                    fullWidth
                    loading={isLoading}
                    styles={{
                        root: {
                            backgroundColor: confirmColor,
                        },
                    }}
                >
                    {confirmLabel}
                </Button>
                <Button variant="default" onClick={onClose} fullWidth disabled={isLoading}>
                    {cancelLabel}
                </Button>
            </Flex>
        </Stack>
    );
};

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
    opened,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmColor = "#e54854",
    confirmIcon,
    isLoading = false,
}) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Title order={4}>{title}</Title>}
            centered
            radius="md"
        >
            <ConfirmActionModalContent
                onClose={onClose}
                onConfirm={onConfirm}
                title={title}
                message={message}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                confirmColor={confirmColor}
                confirmIcon={confirmIcon}
                isLoading={isLoading}
            />
        </Modal>
    );
};

type OpenConfirmActionModalParams = Omit<ConfirmActionModalProps, "opened" | "onClose">;

export const openConfirmActionModal = (params: OpenConfirmActionModalParams): void => {
    modals.open({
        centered: true,
        radius: "md",
        title: <Title order={4}>{params.title}</Title>,
        children: (
            <ConfirmActionModalContent
                {...params}
                onClose={() => modals.closeAll()}
                onConfirm={() => {
                    params.onConfirm();
                    modals.closeAll();
                }}
            />
        ),
    });
};
