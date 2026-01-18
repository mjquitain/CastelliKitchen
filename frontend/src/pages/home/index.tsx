import { RecipeDetailModal } from "@/components/modals/RecipeModal";
import { RecipeCard } from "@/components/RecipeCard";
import { ingredients as mockIngredients } from '@/data/mock_ingredients_data';
import { FAVORITE_KEY, SAVED_KEY, type ActionType, type MealRecipe } from '@/pages/recipe';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    TextInput,
    Title,
    rem
} from '@mantine/core';
import { modals } from "@mantine/modals";
import { Blocks, ChefHat, Heart, Leaf, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';

interface QuickStat {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}

const loadFromLocalStorage = (key: string): MealRecipe[] => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error(`Error loading state from Local Storage for key: ${key}`, error);
        return [];
    }
};

function HomePage() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [defaultRecipes, setDefaultRecipes] = useState<any[]>([]);
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [currentIngredient, setCurrentIngredient] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [expiringIngredients, setExpiringIngredients] = useState();
    const [suggestedRecipes, setSuggestedRecipes] = useState<any[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<MealRecipe | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Suggested Recipe");
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

    const fetchRecipes = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await fetch("https://www.themealdb.com/api/json/v1/1/filter.php?i=");
            const data = await response.json();

            if (data.meals) {
                setDefaultRecipes(data.meals);
                setRecipes([]);
            } else {
                setDefaultRecipes([]);
                setRecipes([]);
            }
        } catch (error) {
            console.error("Error fetching recipes:", error);
            setDefaultRecipes([]);
            setRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecipesByIngredients = async (): Promise<void> => {
        setHasSearched(true);
        setActiveTab("Generated Recipes");
        setIsDetailModalOpen(false);
        setRecipes([]);

        if (ingredients.length === 0) {
            setRecipes([]);
            return;
        }

        try {
            setIsLoading(true);

            const query = ingredients[0].trim().toLowerCase();
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${query}`);
            const data = await response.json();

            if (!data.meals) {
                setRecipes([]);
                return;
            }

            if (ingredients.length > 1) {
                const detailedRecipes = await Promise.all(
                    data.meals.slice(0, 10).map(async (meal: any) => {
                        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
                        const detailData = await detailRes.json();
                        return detailData.meals ? detailData.meals[0] : null;
                    })
                );

                const filtered = detailedRecipes.filter((recipe) => {
                    if (!recipe) return false;
                    const recipeIngredients = Array.from({ length: 20 }, (_, i) => recipe[`strIngredient${i + 1}`])
                        .filter(Boolean)
                        .map((ing) => ing.toLowerCase());

                    return ingredients.every((ing) =>
                        recipeIngredients.some((ri) => ri.includes(ing.toLowerCase()))
                    );
                });

                setRecipes(filtered);
            } else {
                setRecipes(data.meals);
            }

        } catch (error) {
            console.error("Error fetching recipes by ingredients:", error);
            setRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSuggestedRecipes = async (): Promise<void> => {
        setActiveTab("Suggested Recipe");

        try {
            setIsLoading(true);

            const today = new Date();
            const soonExpiring = mockIngredients
                .filter(item => {
                    const expiry = new Date(item.expiryDate);
                    const daysToExpire = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                    return daysToExpire <= 5 && daysToExpire >= 0;
                })
                .map(item => item.name.toLowerCase());

            setExpiringIngredients(soonExpiring);

            if (soonExpiring.length === 0) {
                setSuggestedRecipes([]);
                return;
            }

            const allMeals: any[] = [];
            for (const ingredient of soonExpiring) {
                const response = await fetch(
                    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
                );
                const data = await response.json();
                if (data.meals) allMeals.push(...data.meals);
            }

            const uniqueMeals = Array.from(
                new Map(allMeals.map(meal => [meal.idMeal, meal])).values()
            );

            setSuggestedRecipes(uniqueMeals);
        } catch (error) {
            console.error("Error fetching suggested recipes:", error);
            setSuggestedRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
        fetchSuggestedRecipes();
    }, []);

    const addIngredient = (): void => {
        if (currentIngredient.trim() !== "") {
            setIngredients((prev) => [...prev, currentIngredient.trim()]);
            setCurrentIngredient("");
        }
    };

    const removeIngredient = (index: number): void => {
        setIngredients((prev) => prev.filter((_, i) => i !== index));
        if (hasSearched) {
            setRecipes([]);
        }
    };

    const recipesFound = defaultRecipes.length;
    const ingredientsAvailable = mockIngredients.length;
    const foundSavedRecipes = SAVED_KEY ? JSON.parse(localStorage.getItem(SAVED_KEY) || '[]').length : 0;

    const quickStats: QuickStat[] = [
        { icon: ChefHat, label: "Recipes Found", value: recipesFound.toString(), color: "#8a9a7b" },
        { icon: Heart, label: "Saved Recipes", value: foundSavedRecipes.toString(), color: "#8a9a7b" },
        { icon: Leaf, label: "Ingredients Available", value: ingredientsAvailable.toString(), color: "#8a9a7b" },
    ];

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

    return (
        <Stack
            align={"center"}
            mih={"100vh"}
            w={"100%"}
            style={{ backgroundColor: "#f8f9f8" }}
        >
            <Stack
                w={"100%"}
                maw={rem(1655)}
                p={"xl"}
                gap={"xs"}
            >
                <SimpleGrid cols={3} spacing="lg" mb={"lg"}>
                    {quickStats.map((stat, index) => (
                        <Card
                            key={index}
                            shadow="sm"
                            padding="lg"
                            radius="md"
                            withBorder
                            style={{ borderColor: '#e8f0e8' }}
                        >
                            <Group>
                                <Box
                                    style={{
                                        backgroundColor: stat.color + '20',
                                        padding: '12px',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <stat.icon size={24} color={stat.color} />
                                </Box>
                                <div>
                                    <Text size="xl" fw={700} style={{ color: '#2d3319' }}>
                                        {stat.value}
                                    </Text>
                                    <Text size="sm" c="dimmed" style={{ color: '#5a6b4f' }}>
                                        {stat.label}
                                    </Text>
                                </div>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
                <Paper
                    shadow="sm"
                    p="xl"
                    radius="md"
                    withBorder
                    style={{
                        backgroundColor: 'white',
                        borderColor: '#8a9a7b',
                        borderWidth: '2px',
                    }}
                    mb={"lg"}
                >
                    <Stack gap="md">
                        <div>
                            <Title order={3} style={{ color: '#2d3319', marginBottom: 8 }}>
                                What ingredients do you have? 🥗
                            </Title>
                            <Text size="sm" c="dimmed" style={{ color: '#5a6b4f' }}>
                                Enter the ingredients you have at home and we'll suggest delicious recipes
                            </Text>
                        </div>

                        <Group>
                            <TextInput
                                placeholder="e.g., chicken, tomatoes, pasta..."
                                value={currentIngredient}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setCurrentIngredient(e.currentTarget.value)
                                }
                                style={{ flex: 1 }}
                                styles={{
                                    input: {
                                        borderColor: '#8a9a7b',
                                        '&:focus': {
                                            borderColor: '#6b7c5e',
                                        },
                                    },
                                }}
                            />
                            <Button
                                onClick={addIngredient}
                                leftSection={<Plus size={16} />}
                                color='#6b7c5e'
                            >
                                Add Ingredient
                            </Button>
                        </Group>

                        {ingredients.length > 0 && (
                            <Box>
                                <Text size="sm" fw={500} mb="xs" style={{ color: '#2d3319' }}>
                                    Your ingredients ({ingredients.length}):
                                </Text>
                                <Group gap="xs">
                                    {ingredients.map((ingredient, index) => (
                                        <Badge
                                            key={index}
                                            size="lg"
                                            variant="light"
                                            style={{
                                                backgroundColor: '#8a9a7b20',
                                                color: '#2d3319',
                                                paddingRight: 3,
                                            }}
                                            rightSection={
                                                <ActionIcon
                                                    size="xs"
                                                    color="gray"
                                                    radius="xl"
                                                    variant="transparent"
                                                    onClick={() => removeIngredient(index)}
                                                >
                                                    <X size={14} />
                                                </ActionIcon>
                                            }
                                        >
                                            {ingredient}
                                        </Badge>
                                    ))}
                                </Group>
                            </Box>
                        )}

                        {ingredients.length > 0 && (
                            <>
                                <Button
                                    size="md"
                                    fullWidth
                                    leftSection={<Search size={20} />}
                                    loading={isLoading}
                                    onClick={fetchRecipesByIngredients}
                                    color='#6b7c5e'
                                >
                                    Generate Recipe
                                </Button>

                                <Button
                                    size="md"
                                    variant="light"
                                    color="gray"
                                    fullWidth
                                    onClick={() => {
                                        setIngredients([]);
                                        setRecipes(defaultRecipes);
                                        setCurrentIngredient("");
                                        setHasSearched(false);
                                        setActiveTab("Suggested Recipe");
                                    }}
                                >
                                    Clear Results
                                </Button>
                            </>
                        )}

                    </Stack>
                </Paper>

                <Tabs value={activeTab} onTabChange={setActiveTab}>
                    <Tabs.List justify='center' grow>
                        <Tabs.Tab value="Suggested Recipe" color={"#8a9a7b"}>
                            <Group justify='center'>
                                <ShoppingBag size={16} />
                                <Text style={{ fontSize: '16px', color: '#2d3319' }}>Suggested Recipe</Text>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="Generated Recipes" color={"#8a9a7b"}>
                            <Group justify='center'>
                                <Blocks size={16} />
                                <Text style={{ fontSize: '16px', color: '#2d3319' }}>Generated Recipes</Text>
                            </Group>
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="Suggested Recipe" pt="lg">
                        <Paper
                            p="xl"
                            style={{
                                backgroundColor: 'white',
                                border: '2px dashed #e8f0e8',
                                borderRadius: '10px',
                                textAlign: 'center',
                                minHeight: '400px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {isLoading ? (
                                <Text ta="center" c="dimmed">
                                    Loading suggested recipes...
                                </Text>
                            ) : suggestedRecipes.length > 0 ? (
                                <Box w="100%">
                                    <Text size="md" fw={500} mb="md" style={{ color: "#2d3319" }}>
                                        Suggested recipes based on expiring ingredients: ({suggestedRecipes.length})
                                    </Text>
                                    <SimpleGrid cols={5} spacing="md">
                                        {suggestedRecipes.map((recipe) => (
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
                                </Box>
                            ) : (
                                <Text ta="center" c="dimmed" mt="sm">
                                    No recipes found for your expiring ingredients.
                                </Text>
                            )}
                        </Paper>
                    </Tabs.Panel>

                    <Tabs.Panel value="Generated Recipes" pt="lg">
                        <Paper
                            p="xl"
                            style={{
                                backgroundColor: 'white',
                                border: '2px dashed #e8f0e8',
                                borderRadius: '10px',
                                textAlign: 'center',
                                minHeight: '400px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start'
                            }}
                        >
                            <Text ta="center" c="dimmed">
                                {!hasSearched && ingredients.length === 0 && (
                                    <Text ta="center" c="dimmed">
                                        Generate recipes based on your ingredients!
                                    </Text>
                                )}

                                {isLoading && (
                                    <Text ta="center" c="dimmed" mt="sm">
                                        Loading recipes...
                                    </Text>
                                )}
                                {hasSearched && !isLoading && recipes.length > 0 && (
                                    <Box w="100%">
                                        <Text size="md" fw={500} mb="md" style={{ color: "#2d3319" }}>
                                            Recipes found: {recipes.length}
                                        </Text>

                                        <SimpleGrid cols={5} spacing="md">
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
                                    </Box>
                                )}

                                {hasSearched && !isLoading && recipes.length === 0 && ingredients.length > 0 && (
                                    <Text ta="center" c="dimmed" mt="sm">
                                        No recipes found for your selected ingredients.
                                    </Text>
                                )}
                            </Text>
                        </Paper>
                    </Tabs.Panel>
                </Tabs>
                <RecipeDetailModal
                    opened={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    selectedRecipe={selectedRecipe}
                />
            </Stack>
        </Stack>
    );
}

export default HomePage;