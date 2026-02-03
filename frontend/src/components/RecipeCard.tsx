import { ActionIcon, Button, Card, Flex, Image, Text } from "@mantine/core";
import { Eye, Heart, Save } from "lucide-react";

interface MealRecipe {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strCategory: string;
    strArea: string;
    strInstructions: string;
    strYoutube: string;
    [key: string]: any;
}

type ActionType = 'save' | 'favorite';

interface RecipeCardProps {
    recipe: MealRecipe;
    onView: (idMeal: string) => void;
    onAction: (recipe: MealRecipe, action: ActionType) => void;
    isSaved: boolean;
    isFavorite: boolean;
    showSaveButton?: boolean;
}

export const RecipeCard = ({
    recipe,
    onView,
    onAction,
    isSaved,
    isFavorite,
    showSaveButton = true,
}: RecipeCardProps) => {

    const actionIconStyle = { zIndex: 10, backdropFilter: 'blur(3px)' };

    return (
        <Card
            key={recipe.idMeal}
            shadow="sm"
            radius="md"
            withBorder
            style={{ borderColor: "#e8f0e8", position: "relative" }}
            p="md"
        >
            <Image
                src={recipe.strMealThumb}
                alt={recipe.strMeal}
                height={160}
                fit="cover"
                radius="md"
            />

            <Text fw={500} lineClamp={2} style={{ color: "#2d3319" }} mt="md" mb="xs">
                {recipe.strMeal}
            </Text>

            <Flex justify="space-between" align={"center"} mt="auto" gap={"sm"}>
                <Button
                    w={"100%"}
                    leftSection={<Eye size={18} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(recipe.idMeal);
                    }}
                    color='#8a9a7b'
                    style={{ backgroundColor: '#8a9a7b' }}
                >
                    View Recipe
                </Button>
                {showSaveButton && !isFavorite && (
                    <ActionIcon
                        variant={isSaved ? "filled" : "transparent"}
                        color={isSaved ? "#8a9a7b" : "white"}
                        radius="md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction(recipe, 'save');
                        }}
                        style={{ ...actionIconStyle, backgroundColor: isSaved ? 'rgba(138, 154, 123, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}
                    >
                        <Save
                            size={22}
                            stroke={isSaved ? "white" : "#8a9a7b"}
                        />
                    </ActionIcon>
                )}
                <ActionIcon
                    variant={isFavorite ? "filled" : "transparent"}
                    color={isFavorite ? "#e54854" : "white"}
                    radius="md"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction(recipe, 'favorite');
                    }}
                    style={{ ...actionIconStyle, backgroundColor: isFavorite ? 'rgba(229, 72, 84, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}
                >
                    <Heart
                        size={22}
                        stroke={isFavorite ? "white" : "#e54854"}
                    />
                </ActionIcon>
            </Flex>
        </Card>
    );
};