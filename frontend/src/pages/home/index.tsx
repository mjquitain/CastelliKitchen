import { mealdbApi } from '@/api/recipes';
import { RecipeDetailModal } from "@/components/modals/RecipeModal";
import { RecipeCard } from "@/components/RecipeCard";
import { useRecipes } from '@/hooks/useRecipes';
import api, { getToken } from '@/lib/api';
import { type ActionType, type MealRecipe } from '@/pages/recipe';
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
import { useRouterState } from '@tanstack/react-router';
import { Blocks, ChefHat, Heart, Leaf, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';

interface QuickStat {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}

function HomePage() {
    const {
        savedRecipes,
        favoriteRecipes,
        handleSave,
        handleFavorite,
        handleDelete
    } = useRecipes();

    const [recipes, setRecipes] = useState<any[]>([]);
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [currentIngredient, setCurrentIngredient] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [expiringIngredients, setExpiringIngredients] = useState<string[]>([]);
    const [suggestedRecipes, setSuggestedRecipes] = useState<any[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<MealRecipe | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [userIngredients, setUserIngredients] = useState<any[]>([]);
    const [totalMealDBCount, setTotalMealDBCount] = useState<number>(0);
    useRouterState()
    const isLoggedIn = !!getToken()
    const [activeTab, setActiveTab] = useState<string>(
        isLoggedIn ? "Suggested Recipe" : "Generated Recipes"
    );


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
            const response = await mealdbApi.filterByIngredient(query);
            const data = response.data;

            if (!data.meals) {
                setRecipes([]);
                return;
            }

            if (ingredients.length > 1) {
                const detailedRecipes = await Promise.all(
                    data.meals.slice(0, 10).map(async (meal: any) => {
                        const detailRes = await mealdbApi.lookupById(meal.idMeal);
                        const detailData = detailRes.data;
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

            let ingredients = userIngredients;
            if (ingredients.length === 0) {
                const response = await api.get('/ingredients');
                const data = response.data;
                ingredients = Array.isArray(data) ? data : (data.ingredients || data.data || []);
            }

            const today = new Date();
            const soonExpiringIngredients: string[] = [];

            ingredients.forEach((ingredient: any) => {
                if (ingredient.batches && ingredient.batches.length > 0) {
                    const hasExpiringBatch = ingredient.batches.some((batch: any) => {
                        if (batch.isUsed || batch.isDeleted) return false;

                        const expiry = new Date(batch.expiryDate);
                        const daysToExpire = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                        return daysToExpire <= 3 && daysToExpire >= 0;
                    });

                    if (hasExpiringBatch) {
                        soonExpiringIngredients.push(ingredient.name.toLowerCase());
                    }
                }
            });

            setExpiringIngredients(soonExpiringIngredients);

            if (soonExpiringIngredients.length === 0) {
                setSuggestedRecipes([]);
                return;
            }

            const allMeals: any[] = [];
            for (const ingredient of soonExpiringIngredients) {
                const response = await mealdbApi.filterByIngredient(ingredient);
                const data = response.data;
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
        mealdbApi.search('').then(res => {
            const meals = res.data?.meals;
            if (Array.isArray(meals)) setTotalMealDBCount(meals.length);
        }).catch(() => { });

        if (isLoggedIn) {
            fetchSuggestedRecipes();
            fetchUserIngredients();
        }
    }, []);

    const fetchUserIngredients = async () => {
        try {
            const response = await api.get('/ingredients');
            const data = response.data;

            let ingredients = [];
            if (Array.isArray(data)) {
                ingredients = data;
            } else if (data.ingredients) {
                ingredients = data.ingredients;
            } else if (data.data) {
                ingredients = data.data;
            }

            const availableIngredients = ingredients.filter((ingredient: any) => {
                if (!ingredient.batches || ingredient.batches.length === 0) return false;
                return ingredient.batches.some((batch: any) =>
                    !batch.isUsed && !batch.isDeleted
                );
            });

            setUserIngredients(availableIngredients);
        } catch (error) {
            console.error("Error fetching user ingredients:", error);
            setUserIngredients([]);
        }
    };

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

    const customRecipesCount = savedRecipes.filter((r: any) => r.isCustom).length;
    const recipesFound = totalMealDBCount + customRecipesCount;
    const ingredientsAvailable = userIngredients.length;
    const foundSavedRecipes = savedRecipes.length;

    const quickStats: QuickStat[] = [
        { icon: ChefHat, label: "Recipes Found", value: recipesFound.toString(), color: "#8a9a7b" },
        { icon: Heart, label: "Saved & Favorite Recipes", value: foundSavedRecipes.toString(), color: "#8a9a7b" },
        { icon: Leaf, label: "Ingredients Available", value: ingredientsAvailable.toString(), color: "#8a9a7b" },
    ];

    const openRecipeModal = async (idMeal: string) => {
        try {
            let recipe = savedRecipes.find(r => r.idMeal === idMeal) || favoriteRecipes.find(r => r.idMeal === idMeal);

            if (!recipe) {
                const response = await mealdbApi.lookupById(idMeal);
                const data = response.data;
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

    const handleSaveRecipe = async (recipe: MealRecipe) => {
        await handleSave(recipe);
    };

    const handleUnsaveRecipe = async (recipe: MealRecipe) => {
        await handleDelete(recipe);
    };

    const handleFavoriteRecipe = async (recipe: MealRecipe) => {
        await handleFavorite(recipe);
    };

    const handleUnfavoriteRecipe = async (recipe: MealRecipe) => {
        await handleFavorite(recipe);
    };

    const isRecipeSaved = (id: string) => savedRecipes.some(r => r.idMeal === id);
    const isRecipeFavorite = (id: string) =>
        savedRecipes.some(
            r => r.idMeal === id && r.isFavorite === true
        );

    const openActionModal = (recipe: MealRecipe, action: ActionType) => {
        if (!isLoggedIn) {
            modals.open({
                title: <Title size="lg">Sign in required</Title>,
                centered: true,
                radius: "md",
                children: (
                    <Stack gap="md">
                        <Text size="sm" ta="center" c="dimmed">
                            You need to be logged in to {action === 'save' ? 'save' : 'favorite'} recipes.
                        </Text>
                        <Group justify="center" gap="sm">
                            <Button
                                component="a"
                                href="/login"
                                color="#8a9a7b"
                                onClick={() => modals.closeAll()}
                            >
                                Sign In
                            </Button>
                            <Button
                                component="a"
                                href="/signup"
                                variant="outline"
                                color="#8a9a7b"
                                onClick={() => modals.closeAll()}
                            >
                                Sign Up
                            </Button>
                        </Group>
                    </Stack>
                ),
            });
            return;
        }

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
                    isSaved ? handleUnsaveRecipe(recipe) : handleSaveRecipe(recipe);
                } else {
                    isFavorited ? handleUnfavoriteRecipe(recipe) : handleFavoriteRecipe(recipe);
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
                                        setRecipes([]);
                                        setCurrentIngredient("");
                                        setHasSearched(false);
                                        setActiveTab(isLoggedIn ? "Suggested Recipe" : "Generated Recipes");
                                    }}
                                >
                                    Clear Results
                                </Button>
                            </>
                        )}

                    </Stack>
                </Paper>

                <Tabs value={activeTab} onChange={(val) => val && setActiveTab(val)}>
                    <Tabs.List justify='center' grow>
                        {isLoggedIn && (
                            <Tabs.Tab value="Suggested Recipe" color={"#8a9a7b"}>
                                <Group justify='center'>
                                    <ShoppingBag size={16} />
                                    <Text style={{ fontSize: '16px', color: '#2d3319' }}>Suggested Recipe</Text>
                                </Group>
                            </Tabs.Tab>
                        )}
                        <Tabs.Tab value="Generated Recipes" color={"#8a9a7b"}>
                            <Group justify='center'>
                                <Blocks size={16} />
                                <Text style={{ fontSize: '16px', color: '#2d3319' }}>Generated Recipes</Text>
                            </Group>
                        </Tabs.Tab>
                    </Tabs.List>

                    {isLoggedIn && (
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
                    )}

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
                            <Box w="100%">
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
                            </Box>
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