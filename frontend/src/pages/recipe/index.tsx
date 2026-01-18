
import { RecipeDetailModal } from "@/components/modals/RecipeModal";
import { RecipeCard } from "@/components/RecipeCard";
import { ingredients } from "@/data/mock_ingredients_data";
import {
    Badge,
    Box,
    Button,
    Divider,
    Flex,
    Group,
    Modal,
    Paper,
    rem,
    Select,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    TextInput,
    Title
} from "@mantine/core";
import { modals } from '@mantine/modals';
import { Blocks, BookHeart, Heart, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface Ingredient {
    id: number | string;
    name: string;
}

export interface MealRecipe {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strCategory: string;
    strArea: string;
    strInstructions: string;
    strYoutube: string;
    [key: string]: any;
}

export type ActionType = 'save' | 'favorite';
export const SAVED_KEY = "userSavedRecipes";
export const FAVORITE_KEY = "userFavoriteRecipes";

const loadFromLocalStorage = (key: string): MealRecipe[] => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error(`Error loading state from Local Storage for key: ${key}`, error);
        return [];
    }
};

function RecipePage() {
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<MealRecipe | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [savedSearch, setSavedSearch] = useState("");
    const [savedCategory, setSavedCategory] = useState<string | null>(null);
    const [favSearch, setFavSearch] = useState("");
    const [favCategory, setFavCategory] = useState<string | null>(null);
    const [RecipeFormOpened, setRecipeFormOpened] = useState(false);

    const [savedRecipes, setSavedRecipes] = useState<MealRecipe[]>(() =>
        loadFromLocalStorage(SAVED_KEY)
    );
    const [favoriteRecipes, setFavoriteRecipes] = useState<MealRecipe[]>(() =>
        loadFromLocalStorage(FAVORITE_KEY)
    );

    useEffect(() => {
        try {
            window.localStorage.setItem(SAVED_KEY, JSON.stringify(savedRecipes));
        } catch (error) {
            console.error("Error saving savedRecipes to Local Storage:", error);
        }
    }, [savedRecipes]);

    useEffect(() => {
        try {
            window.localStorage.setItem(FAVORITE_KEY, JSON.stringify(favoriteRecipes));
        } catch (error) {
            console.error("Error saving favoriteRecipes to Local Storage:", error);
        }
    }, [favoriteRecipes]);

    const toggleIngredient = (ingredientName: string) => {
        setSelectedIngredients((prev) =>
            prev.includes(ingredientName)
                ? prev.filter((name) => name !== ingredientName)
                : [...prev, ingredientName]
        );
    };

    const fetchRecipes = async () => {
        setRecipes([]);
        setSelectedRecipe(null);
        setIsDetailModalOpen(false);

        if (selectedIngredients.length === 0) {
            setHasSearched(false);
            return;
        }

        setHasSearched(true);
        setIsLoading(true);

        try {
            const primaryQuery = selectedIngredients[0];
            const filterUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryQuery}`;
            const response = await fetch(filterUrl);
            const filterData = await response.json();

            if (!filterData.meals) {
                setIsLoading(false);
                return;
            }

            const mealIds = filterData.meals.map((meal: any) => meal.idMeal);
            const mealsToFetch = mealIds.slice(0);

            const detailedRecipes = await Promise.all(
                mealsToFetch.map(async (idMeal: string) => {
                    const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
                    const detailData = await detailRes.json();
                    return detailData.meals ? detailData.meals[0] : null;
                })
            );

            const requiredIngredients = selectedIngredients.map(name => name.toLowerCase());

            const filteredRecipes = detailedRecipes.filter((recipe) => {
                if (!recipe) return false;

                const recipeIngredients = Array.from({ length: 20 }, (_, i) => recipe[`strIngredient${i + 1}`])
                    .filter(Boolean)
                    .map((ing: string) => ing.toLowerCase().trim());

                return requiredIngredients.every((requiredIng) =>
                    recipeIngredients.some((ri) => ri.includes(requiredIng))
                );
            }) as MealRecipe[];

            setRecipes(filteredRecipes);

        } catch (error) {
            console.error("Error fetching recipes:", error);
            setRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openRecipeModal = async (idMeal: string) => {
        try {
            let recipe = savedRecipes.find(r => r.idMeal === idMeal) || favoriteRecipes.find(r => r.idMeal === idMeal);

            if (!recipe) {
                const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
                const data = await response.json();
                if (data.meals && data.meals.length > 0) {
                    recipe = data.meals[0];
                }
            }

            if (recipe) {
                setSelectedRecipe(recipe);
                setIsDetailModalOpen(true);
            }

        } catch (error) {
            console.error("Error fetching recipe details:", error);
        }
    };

    const handleSaveRecipe = (recipe: MealRecipe) => {
        if (
            !savedRecipes.some(r => r.idMeal === recipe.idMeal) &&
            !favoriteRecipes.some(r => r.idMeal === recipe.idMeal)
        ) {
            setSavedRecipes(prev => [...prev, recipe]);
        }
    };

    const handleUnsaveRecipe = (idMeal: string) => {
        setSavedRecipes(prev => prev.filter(r => r.idMeal !== idMeal));
    };

    const handleFavoriteRecipe = (recipe: MealRecipe) => {
        if (!favoriteRecipes.some(r => r.idMeal === recipe.idMeal)) {
            setFavoriteRecipes(prev => [...prev, recipe]);
            setSavedRecipes(prev => prev.filter(r => r.idMeal !== recipe.idMeal));
        }
    };

    const handleUnfavoriteRecipe = (idMeal: string) => {
        const recipeToRestore = favoriteRecipes.find(r => r.idMeal === idMeal);
        setFavoriteRecipes(prev => prev.filter(r => r.idMeal !== idMeal));
        if (recipeToRestore && !savedRecipes.some(r => r.idMeal === idMeal)) {
            setSavedRecipes(prev => [...prev, recipeToRestore]);
        }
    };

    const isRecipeSaved = (idMeal: string) => savedRecipes.some(r => r.idMeal === idMeal);
    const isRecipeFavorite = (idMeal: string) => favoriteRecipes.some(r => r.idMeal === idMeal);

    const openActionModal = (recipe: MealRecipe, action: ActionType) => {
        const isSaved = isRecipeSaved(recipe.idMeal);
        const isFavorited = isRecipeFavorite(recipe.idMeal);

        const isRemoveAction = (action === 'save' && isSaved) || (action === 'favorite' && isFavorited);

        const actionLabel = action === 'save' ? 'Saved Recipes' : 'Favorite Recipes';

        let title: string;
        let messageComponent: React.ReactNode;
        let confirmLabel: string;
        let color: 'green' | 'red' | 'orange';

        if (isRemoveAction) {
            title = `Remove recipe from ${actionLabel}?`;
            messageComponent = (
                <Text size="sm">
                    Are you sure you want to remove "{recipe.strMeal}" from your {actionLabel}?
                </Text>
            );
            confirmLabel = 'Yes, Remove It';
            color = 'red';
        } else {
            title = `Add recipe to ${actionLabel}?`;
            confirmLabel = `Yes, ${action === 'save' ? 'Save' : 'Favorite'}`;

            if (action === 'favorite' && isSaved) {
                messageComponent = (
                    <Text size="sm" c="orange">
                        Favoriting "{recipe.strMeal}" will automatically remove it from your Saved Recipes section. Continue?
                    </Text>
                );
                color = 'green';
            } else {
                messageComponent = (
                    <Text size="sm">
                        Confirm you want to {action} "{recipe.strMeal}".
                    </Text>
                );
                color = action === 'save' ? 'green' : 'red';
            }
        }

        modals.openConfirmModal({
            title: <Title order={4} ta="center">{title}</Title>,
            centered: true,
            confirmProps: { color: color, children: confirmLabel },
            labels: { cancel: 'Cancel', confirm: confirmLabel },
            children: messageComponent,

            onConfirm: () => {
                if (action === 'save') {
                    isSaved ? handleUnsaveRecipe(recipe.idMeal) : handleSaveRecipe(recipe);
                } else {
                    isFavorited ? handleUnfavoriteRecipe(recipe.idMeal) : handleFavoriteRecipe(recipe);
                }
            },
        });
    };

    const filteredSavedRecipes = savedRecipes.filter((recipe) => {
        const matchesSearch = recipe.strMeal
            .toLowerCase()
            .includes(savedSearch.toLowerCase());
        const matchesCategory = savedCategory
            ? recipe.strCategory === savedCategory
            : true;
        return matchesSearch && matchesCategory;
    });

    const filteredFavoriteRecipes = favoriteRecipes.filter((recipe) => {
        const matchesSearch = recipe.strMeal
            .toLowerCase()
            .includes(favSearch.toLowerCase());
        const matchesCategory = favCategory
            ? recipe.strCategory === favCategory
            : true;
        return matchesSearch && matchesCategory;
    });

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
                <Tabs defaultValue="generated recipes" color="#8a9a7b">
                    <Tabs.List justify="space-between">
                        <Tabs.Tab value="generated recipes" leftSection={<Blocks size={16} />} style={{ fontSize: '16px' }}>
                            Generate Recipe
                        </Tabs.Tab>
                        <Tabs.Tab value="saved recipes" leftSection={<Save size={16} />} style={{ fontSize: '16px' }}>
                            Saved Recipe
                        </Tabs.Tab>
                        <Tabs.Tab value="favorite recipes" leftSection={<BookHeart size={16} />} style={{ fontSize: '16px' }}>
                            Favorite Recipe
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="generated recipes" pt="lg">
                        <Group align="flex-start" gap="lg" wrap="nowrap">
                            <Paper
                                shadow="md"
                                p="lg"
                                radius={"lg"}
                                w={350}
                                miw={350}
                                style={{
                                    backgroundColor: 'white',
                                    border: '2px solid #8a9a7b',
                                }}
                            >
                                <Flex h="100%" justify="flex-start" direction="column">
                                    <Box ta="center">
                                        <Title order={4} mb="md" style={{ color: '#2d3319' }}>
                                            Ingredients Available
                                        </Title>
                                        <Divider mb="md" color="#e8f0e8" />
                                    </Box>

                                    <Group gap="xs" mih={300} justify="center" mb="lg" style={{ flexWrap: 'wrap' }}>
                                        {ingredients.map((ingredient: Ingredient) => {
                                            const isSelected = selectedIngredients.includes(ingredient.name);
                                            return (
                                                <Badge
                                                    key={ingredient.id}
                                                    radius="lg"
                                                    size="xl"
                                                    onClick={() => toggleIngredient(ingredient.name)}
                                                    variant={isSelected ? "filled" : "outline"}
                                                    style={{
                                                        backgroundColor: isSelected ? "#8a9a7b" : "transparent",
                                                        color: isSelected ? "white" : "#2d3319",
                                                        borderColor: "#8a9a7b",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                >
                                                    <Text size="sm">{ingredient.name}</Text>
                                                </Badge>
                                            );
                                        })}
                                    </Group>

                                    <Button
                                        fullWidth
                                        size="md"
                                        onClick={fetchRecipes}
                                        disabled={selectedIngredients.length === 0}
                                        styles={{
                                            root: {
                                                backgroundColor: '#8a9a7b',
                                                '&:hover': {
                                                    backgroundColor: '#6b7c5e',
                                                },
                                            },
                                        }}
                                    >
                                        Generate Recipe
                                    </Button>
                                </Flex>
                            </Paper>

                            <Paper
                                p="lg"
                                style={{
                                    backgroundColor: 'white',
                                    border: '2px solid #8a9a7b',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    width: '100%',
                                    minHeight: '400px',
                                    height: recipes.length > 0 ? 'auto' : 'calc(100vh - 250px)',
                                    display: 'flex',
                                    alignItems: recipes.length > 0 ? 'center' : 'center',
                                    justifyContent: recipes.length > 0 ? 'center' : 'center',
                                    flexDirection: 'column',
                                }}
                            >
                                <Box w={"100%"}>
                                    {isLoading ? (
                                        <Text ta="center" c="dimmed" size="lg">
                                            Generating recipes...
                                        </Text>
                                    ) : recipes.length > 0 ? (
                                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                                            {recipes.map((recipe) => (
                                                <RecipeCard
                                                    key={recipe.idMeal}
                                                    recipe={recipe}
                                                    onView={openRecipeModal}
                                                    onAction={openActionModal}
                                                    isSaved={isRecipeSaved(recipe.idMeal)}
                                                    isFavorite={isRecipeFavorite(recipe.idMeal)}
                                                />
                                            ))}
                                        </SimpleGrid>
                                    ) : (
                                        <Text ta="center" c="dimmed" size="lg" mt="xl">
                                            {selectedIngredients.length > 0
                                                ? "No recipes found for these ingredients."
                                                : "Select ingredients and click Generate Recipe."}
                                        </Text>
                                    )}
                                </Box>
                            </Paper>
                        </Group>
                    </Tabs.Panel>

                    <Tabs.Panel value="saved recipes" pt="xl">
                        <Flex justify={"flex-end"} gap={"md"} mb={"xl"}>
                            <TextInput
                                placeholder="Search saved recipes..."
                                style={{ flex: 1, maxWidth: "700px" }}
                                radius={"md"}
                                value={savedSearch}
                                onChange={(e) => setSavedSearch(e.currentTarget.value)}
                            />
                            <Select placeholder="Sort Recipes" data={[
                                'Beef',
                                'Chicken',
                                'Vegetarian',
                                'Vegan',
                                'Dessert',
                                'Lamb',
                                'Miscellaneous',
                                'Pasta',
                                'Seafood',
                                'Side',
                                'Pork',
                                'Breakfast',
                                'Goat',
                                'Starter'
                            ]}
                                style={{ width: 160 }}
                                radius={"md"}
                                checkIconPosition="right"
                                clearable
                                allowDeselect
                                value={savedCategory}
                                onChange={setSavedCategory}
                            />
                            <Button leftSection={<Plus size={18} />} w={"160px"} radius={"md"} styles={{
                                root: {
                                    backgroundColor: '#8a9a7b'
                                }
                            }}
                                onClick={() => setRecipeFormOpened(true)}
                            >
                                Add Recipe
                            </Button>
                        </Flex>
                        <Paper
                            p="xl"
                            style={{
                                backgroundColor: 'white',
                                border: '2px solid #8a9a7b',
                                borderRadius: '10px',
                                textAlign: 'center',
                                minHeight: '400px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {filteredSavedRecipes.length > 0 ? (
                                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" w="100%">
                                    {filteredSavedRecipes.map((recipe) => (
                                        <RecipeCard
                                            key={recipe.idMeal}
                                            recipe={recipe}
                                            onView={openRecipeModal}
                                            onAction={openActionModal}
                                            isSaved={isRecipeSaved(recipe.idMeal)}
                                            isFavorite={isRecipeFavorite(recipe.idMeal)}
                                            showSaveButton={true}
                                        />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Stack align="center" gap="md">
                                    <Save size={48} color="#8a9a7b" />
                                    <div>
                                        <Text fw={500} size="lg" style={{ color: '#2d3319' }}>
                                            Saved Recipes
                                        </Text>
                                        <Text size="sm" c="dimmed" mt="xs">
                                            Your saved recipes will appear here. Click the <Save size={14} style={{ display: 'inline' }} /> icon on a generated recipe to save it.
                                        </Text>
                                    </div>
                                </Stack>
                            )}
                        </Paper>
                    </Tabs.Panel>

                    <Tabs.Panel value="favorite recipes" pt="xl">
                        <Flex justify={"flex-end"} gap={"md"}>
                            <TextInput
                                placeholder="Search favorite recipes..."
                                w={700} mb="xl"
                                radius={"md"}
                                value={favSearch}
                                onChange={(e) => setFavSearch(e.currentTarget.value)}
                            />
                            <Select placeholder="Sort Recipes" data={[
                                'Beef',
                                'Chicken',
                                'Vegetarian',
                                'Vegan',
                                'Dessert',
                                'Lamb',
                                'Miscellaneous',
                                'Pasta',
                                'Seafood',
                                'Side',
                                'Pork',
                                'Breakfast',
                                'Goat',
                                'Starter'
                            ]}
                                style={{ width: 160 }}
                                radius={"md"}
                                checkIconPosition="right"
                                clearable
                                allowDeselect
                                value={favCategory}
                                onChange={setFavCategory}
                            />
                        </Flex>
                        <Paper
                            p="xl"
                            style={{
                                backgroundColor: 'white',
                                border: '2px solid #8a9a7b',
                                borderRadius: '10px',
                                textAlign: 'center',
                                minHeight: '400px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {filteredFavoriteRecipes.length > 0 ? (
                                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" w="100%">
                                    {filteredFavoriteRecipes.map((recipe) => (
                                        <RecipeCard
                                            key={recipe.idMeal}
                                            recipe={recipe}
                                            onView={openRecipeModal}
                                            onAction={openActionModal}
                                            isSaved={isRecipeSaved(recipe.idMeal)}
                                            isFavorite={isRecipeFavorite(recipe.idMeal)}
                                            showSaveButton={false}
                                        />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Stack align="center" gap="md">
                                    <BookHeart size={48} color="#8a9a7b" />
                                    <div>
                                        <Text fw={500} size="lg" style={{ color: '#2d3319' }}>
                                            Favorite Recipes
                                        </Text>
                                        <Text size="sm" c="dimmed" mt="xs">
                                            Your favorite recipes will appear here. Click the <Heart size={14} style={{ display: 'inline', color: '#e54854' }} fill="#e54854" /> icon on a generated recipe to favorite it.
                                        </Text>
                                    </div>
                                </Stack>
                            )}
                        </Paper>
                    </Tabs.Panel>
                </Tabs>
                <RecipeDetailModal
                    opened={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    selectedRecipe={selectedRecipe}
                />
                <Modal
                    opened={RecipeFormOpened}
                    onClose={() => setRecipeFormOpened(false)}
                    title={<Text fw={"500"} size="lg">Add New Recipe</Text>}
                    overlayProps={{
                        backgroundOpacity: 0.55,
                        blur: 3,
                    }}
                    radius={"lg"}
                    padding={"lg"}
                    centered
                >
                    <Flex direction="column" gap="sm">
                        <TextInput
                            label="Recipe Name"
                            placeholder="Enter the name of the recipe"
                        />
                        <Select
                            label="Category"
                            placeholder="Sort Recipes"
                            data={[
                                'Beef',
                                'Chicken',
                                'Vegetarian',
                                'Vegan',
                                'Dessert',
                                'Lamb',
                                'Miscellaneous',
                                'Pasta',
                                'Seafood',
                                'Side',
                                'Pork',
                                'Breakfast',
                                'Goat',
                                'Starter'
                            ]}
                        />
                        <TextInput
                            label="Area"
                            placeholder="Enter the area/cuisine of the recipe"
                        />
                        <TextInput
                            label="Ingredients"
                            placeholder="Enter ingredients separated by commas"
                        />
                        <TextInput
                            label="Instructions"
                            placeholder="Enter the cooking instructions"
                        />
                        <TextInput
                            label="YouTube Link"
                            placeholder="Enter a YouTube link for the recipe (optional)"
                        />
                        <Button
                            mt="md"
                            fullWidth
                            size="md"
                            styles={{
                                root: {
                                    backgroundColor: '#8a9a7b',
                                    '&:hover': {
                                        backgroundColor: '#6b7c5e',
                                    },
                                },
                            }}
                        >
                            Add Recipe
                        </Button>
                    </Flex>
                </Modal>
            </Stack>
        </Stack >
    );
}

export default RecipePage;