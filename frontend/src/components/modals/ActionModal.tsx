import type { ActionType, MealRecipe } from "@/pages/recipe";
import { Button, Flex, Modal, Stack, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { Heart, Save, Trash2 } from "lucide-react";

interface RecipeActionModalProps {
    opened: boolean;
    onClose: () => void;
    recipeToActOn: MealRecipe | null;
    currentActionType: ActionType;
    isRecipeSaved: (idMeal: string) => boolean;
    isRecipeFavorite: (idMeal: string) => boolean;
    handleSave: (recipe: MealRecipe) => Promise<void>;
    handleFavorite: (recipe: MealRecipe) => Promise<void>;
    handleDelete: (recipe: MealRecipe) => Promise<void>;
}

type RecipeActionModalContentProps = Omit<RecipeActionModalProps, "opened">;

const RecipeActionModalContent: React.FC<RecipeActionModalContentProps> = ({
    onClose,
    recipeToActOn,
    currentActionType,
    isRecipeSaved,
    isRecipeFavorite,
    handleSave,
    handleFavorite,
    handleDelete,
}) => {
    if (!recipeToActOn) return null;

    const isSaved = isRecipeSaved(recipeToActOn.idMeal);
    const isFavorited = isRecipeFavorite(recipeToActOn.idMeal);
    const isRemoveAction = (currentActionType === 'save' && isSaved) || (currentActionType === 'favorite' && isFavorited);
    const actionColor = currentActionType === 'save' ? "#8a9a7b" : "#e54854";
    const actionLabel = currentActionType === 'save' ? 'Saved Recipes' : 'Favorite Recipes';

    const getConfirmationText = () => {
        if (isRemoveAction) {
            return (
                <Text size="sm" ta="center">
                    Are you sure you want to remove "{recipeToActOn.strMeal}" from {actionLabel}?
                </Text>
            );
        } else if (currentActionType === 'favorite' && isSaved) {
            return (
                <Text size="sm" ta="center" color="orange">
                    Favoriting "{recipeToActOn.strMeal}" will automatically remove it from your Saved Recipes section. Continue?
                </Text>
            );
        } else {
            return (
                <Text size="sm" ta="center">
                    Confirm you want to {currentActionType} this recipe.
                </Text>
            );
        }
    };

    const handleActionClick = async () => {
        if (!recipeToActOn) return;

        try {
            if (currentActionType === 'save') {
                isSaved
                    ? await handleDelete(recipeToActOn)
                    : await handleSave(recipeToActOn);
            } else {
                await handleFavorite(recipeToActOn);
            }
        } catch (error) {
            console.error("Failed to update recipe status", error);
        } finally {
            onClose();
        }
    };

    return (
        <Stack gap="md">
            {getConfirmationText()}
            <Flex gap="md">
                <Button
                    leftSection={isRemoveAction ? <Trash2 size={20} /> : (currentActionType === 'save' ? <Save size={20} /> : <Heart size={20} />)}
                    color={actionColor}
                    onClick={handleActionClick}
                    fullWidth
                    styles={{
                        root: {
                            backgroundColor: isRemoveAction ? '#e54854' : actionColor,
                        }
                    }}
                >
                    {isRemoveAction ? 'Yes, Remove It' : `Yes, ${currentActionType === 'save' ? 'Save' : 'Favorite'} It`}
                </Button>
                <Button variant="default" onClick={onClose} fullWidth>
                    Cancel
                </Button>
            </Flex>
        </Stack>
    );
};

export const RecipeActionModal: React.FC<RecipeActionModalProps> = ({ opened, ...props }) => {
    return (
        <Modal
            opened={opened}
            onClose={props.onClose}
            title={<Title order={4}>{(() => {
                if (!props.recipeToActOn) return "Action";
                const isSaved = props.isRecipeSaved(props.recipeToActOn.idMeal);
                const isFavorited = props.isRecipeFavorite(props.recipeToActOn.idMeal);
                const isRemoveAction = (props.currentActionType === 'save' && isSaved) || (props.currentActionType === 'favorite' && isFavorited);
                const actionLabel = props.currentActionType === 'save' ? 'Saved Recipes' : 'Favorite Recipes';
                return isRemoveAction ? `Remove recipe from ${actionLabel}?` : `Add recipe to ${actionLabel}?`;
            })()}</Title>}
            centered
            radius={"md"}
        >
            <RecipeActionModalContent {...props} />
        </Modal>
    );
};

type OpenRecipeActionModalParams = Omit<RecipeActionModalProps, "opened" | "onClose">;

export const openRecipeActionModal = (params: OpenRecipeActionModalParams): void => {
    const { recipeToActOn, currentActionType, isRecipeSaved, isRecipeFavorite } = params;

    if (!recipeToActOn) {
        return;
    }

    const isSaved = isRecipeSaved(recipeToActOn.idMeal);
    const isFavorited = isRecipeFavorite(recipeToActOn.idMeal);
    const isRemoveAction = (currentActionType === 'save' && isSaved) || (currentActionType === 'favorite' && isFavorited);
    const actionLabel = currentActionType === 'save' ? 'Saved Recipes' : 'Favorite Recipes';
    const title = isRemoveAction
        ? `Remove recipe from ${actionLabel}?`
        : `Add recipe to ${actionLabel}?`;

    modals.open({
        centered: true,
        radius: "md",
        title: <Title order={4}>{title}</Title>,
        children: (
            <RecipeActionModalContent
                {...params}
                onClose={() => modals.closeAll()}
            />
        ),
    });
};