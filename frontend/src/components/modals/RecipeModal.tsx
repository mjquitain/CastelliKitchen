import { type MealRecipe } from "@/pages/recipe";
import { Anchor, Box, Group, Image, Modal, ScrollArea, Text } from "@mantine/core";

interface RecipeDetailModalProps {
    opened: boolean;
    onClose: () => void;
    selectedRecipe: MealRecipe | null;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
    opened,
    onClose,
    selectedRecipe,
}) => {
    if (!selectedRecipe) {
        return null;
    }

    const ingredientsList = Array.from({ length: 20 }, (_, i) => i + 1)
        .map(i => {
            const ingredient = selectedRecipe[`strIngredient${i}`];
            const measure = selectedRecipe[`strMeasure${i}`];
            return ingredient && ingredient.trim() !== "" ? (
                <li key={i}>{ingredient} - {measure}</li>
            ) : null;
        })
        .filter(Boolean);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Text tt="capitalize" fw={500} size="xl">{selectedRecipe.strMeal}</Text>}
            size="lg"
            centered
            radius={"lg"}
            scrollAreaComponent={ScrollArea.Autosize}
        >
            <Box>
                <Image
                    src={selectedRecipe.strMealThumb}
                    alt={selectedRecipe.strMeal}
                    style={{ width: "100%", height: "400px", objectFit: "cover", borderRadius: "10px", marginBottom: "10px" }}
                />
                <Group gap={"xs"}>
                    <Text fw={500} style={{ color: "#2d3319" }}>Category:</Text>
                    <Text size="sm" style={{ color: "grey.3" }}>{selectedRecipe.strCategory}</Text>
                </Group>

                <Group gap={"xs"}>
                    <Text fw={500} style={{ color: "#2d3319" }}>Area:</Text>
                    <Text size="sm" style={{ color: "grey.3" }}>{selectedRecipe.strArea}</Text>
                </Group>

                <Group gap={"1px"} mb={"xs"} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <Text fw={600} style={{ color: "#2d3319" }}>Ingredients:</Text>
                    <Text size="sm" style={{ color: "grey.3", paddingLeft: "20px" }}>
                        {ingredientsList}
                    </Text>
                </Group>

                <Group mb={"xs"} gap={"1px"} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <Text fw={600} style={{ color: "#2d3319" }}>Instructions:</Text>
                    <Text size="sm" style={{ whiteSpace: "pre-line", color: "grey.3" }}>
                        {selectedRecipe.strInstructions}
                    </Text>
                </Group>
                {selectedRecipe.strYoutube && (
                    <Group gap={"1px"} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                        <Text fw={600} style={{ color: "#2d3319" }}>Watch Tutorial:</Text>
                        <Anchor href={selectedRecipe.strYoutube} target="_blank" underline="hover" style={{ color: "black" }}>
                            {selectedRecipe.strYoutube}
                        </Anchor>
                    </Group>
                )}
            </Box>
        </Modal>
    );
};