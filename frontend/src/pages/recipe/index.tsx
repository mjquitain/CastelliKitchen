
import { RecipeActionModal } from "@/components/modals/ActionModal";
import { RecipeDetailModal } from "@/components/modals/RecipeModal";
import { RecipeCard } from "@/components/RecipeCard";
import { useRecipes } from "@/hooks/useRecipes";
import api from "@/lib/api";
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

function RecipePage() {
    const {
        savedRecipes = [],
        favoriteRecipes = [],
        isLoading: isApiLoading,
        handleSave,
        handleFavorite,
        handleDelete
    } = useRecipes();

    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [recipes, setRecipes] = useState<MealRecipe[]>([]);
    const [isInternalLoading, setIsInternalLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<MealRecipe | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [savedSearch, setSavedSearch] = useState("");
    const [savedCategory, setSavedCategory] = useState<string | null>(null);
    const [favSearch, setFavSearch] = useState("");
    const [favCategory, setFavCategory] = useState<string | null>(null);
    const [RecipeFormOpened, setRecipeFormOpened] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [recipeToActOn, setRecipeToActOn] = useState<MealRecipe | null>(null);
    const [currentActionType, setCurrentActionType] = useState<ActionType>('save');
    const [activeTab, setActiveTab] = useState<string | null>("generated recipes");
    const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
    const [isIngredientsLoading, setIsIngredientsLoading] = useState(true);

    useEffect(() => {
        const fetchUserIngredients = async () => {
            try {
                setIsIngredientsLoading(true);
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

                const availableIngredients = ingredients.filter(
                    (ingredient: any) => ingredient.batches && ingredient.batches.length > 0
                );

                setIngredientsList(availableIngredients);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setIsIngredientsLoading(false);
            }
        };
        fetchUserIngredients();
    }, []);

    const [newRecipe, setNewRecipe] = useState({
        strMeal: '',
        strCategory: '',
        strArea: '',
        strInstructions: '',
        strIngredients: '',
        strYoutube: ''
    });

    const isRecipeSaved = (id: string) => savedRecipes.some(r => r.idMeal === id);
    const isRecipeFavorite = (id: string) =>
        savedRecipes.some(
            r => r.idMeal === id && r.isFavorite === true
        );

    const toggleIngredient = (ingredientName: string) => {
        setSelectedIngredients((prev) =>
            prev.includes(ingredientName)
                ? prev.filter((name) => name !== ingredientName)
                : [...prev, ingredientName]
        );
    };

    const fetchRecipes = async () => {
        if (selectedIngredients.length === 0) {
            setRecipes([]);
            setHasSearched(false);
            return;
        }

        setHasSearched(true);
        setIsInternalLoading(true);

        try {
            const primaryQuery = selectedIngredients[0];
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryQuery}`);
            const filterData = await response.json();

            if (!filterData.meals) {
                setRecipes([]);
                return;
            }

            const detailedRecipes = await Promise.all(
                filterData.meals.map(async (meal: any) => {
                    const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
                    const detailData = await detailRes.json();
                    return detailData.meals ? detailData.meals[0] : null;
                })
            );

            const requiredIngs = selectedIngredients.map(n => n.toLowerCase());
            const filtered = detailedRecipes.filter(recipe => {
                if (!recipe) return false;
                const recipeIngs = Array.from({ length: 20 }, (_, i) => recipe[`strIngredient${i + 1}`])
                    .filter(Boolean)
                    .map((ing: string) => ing.toLowerCase().trim());
                return requiredIngs.every(req => recipeIngs.some(ri => ri.includes(req)));
            });

            setRecipes(filtered);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsInternalLoading(false);
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

    const openActionModal = (recipe: MealRecipe, action: ActionType) => {
        setRecipeToActOn(recipe);
        setCurrentActionType(action);
        setIsActionModalOpen(true);
    };

    const filteredSavedRecipes = (savedRecipes || []).filter((recipe) => {
        if (!recipe?.strMeal) return false;
        if (recipe.isFavorite === true) return false;

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
                <Tabs value={activeTab} onChange={setActiveTab} color="#8a9a7b">
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
                                        {isIngredientsLoading ? (
                                            <Text size="sm" c="dimmed">Loading your pantry...</Text>
                                        ) : ingredientsList.length > 0 ? (
                                            ingredientsList.map((ingredient) => {
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
                                            })
                                        ) : (
                                            <Stack align="center" gap={4}>
                                                <Text size="sm" c="dimmed">No ingredients found.</Text>
                                                <Button variant="subtle" size="xs" color="gray">Add some to your pantry</Button>
                                            </Stack>
                                        )}
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
                                    {isInternalLoading ? (
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

                <RecipeActionModal
                    opened={isActionModalOpen}
                    onClose={() => setIsActionModalOpen(false)}
                    recipeToActOn={recipeToActOn}
                    currentActionType={currentActionType}
                    isRecipeSaved={isRecipeSaved}
                    isRecipeFavorite={isRecipeFavorite}
                    handleSave={handleSave}
                    handleFavorite={handleFavorite}
                    handleDelete={handleDelete}
                    setActiveTab={setActiveTab}
                />

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
                            value={newRecipe.strMeal}
                            onChange={(e) => setNewRecipe({ ...newRecipe, strMeal: e.currentTarget.value })}
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
                            value={newRecipe.strCategory}
                            onChange={(val) => setNewRecipe({ ...newRecipe, strCategory: val || '' })}
                        />
                        <TextInput
                            label="Area"
                            placeholder="Enter the area/cuisine of the recipe"
                            value={newRecipe.strArea}
                            onChange={(e) => setNewRecipe({ ...newRecipe, strArea: e.currentTarget.value })}
                        />
                        <TextInput
                            label="Ingredients"
                            placeholder="e.g. 2 cups - Flour, 1 tsp - Salt, Eggs"
                            value={newRecipe.strIngredients}
                            onChange={(e) => setNewRecipe({ ...newRecipe, strIngredients: e.currentTarget.value })}
                        />
                        <TextInput
                            label="Instructions"
                            placeholder="Enter the cooking instructions"
                            value={newRecipe.strInstructions}
                            onChange={(e) => setNewRecipe({ ...newRecipe, strInstructions: e.currentTarget.value })}
                        />
                        <TextInput
                            label="YouTube Link"
                            placeholder="Enter a YouTube link for the recipe (optional)"
                            value={newRecipe.strYoutube}
                            onChange={(e) => setNewRecipe({ ...newRecipe, strYoutube: e.currentTarget.value })}
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
                            onClick={async () => {
                                const ingredientsArray = newRecipe.strIngredients
                                    .split(',')
                                    .map(ing => ing.trim())
                                    .filter(ing => ing !== '');

                                const customRecipe: MealRecipe = {
                                    idMeal: `custom-${Date.now()}`,
                                    strMeal: newRecipe.strMeal,
                                    strCategory: newRecipe.strCategory,
                                    strArea: newRecipe.strArea,
                                    strInstructions: newRecipe.strInstructions,
                                    strYoutube: newRecipe.strYoutube,
                                    strMealThumb: "https://placehold.co/600x400?text=My+Recipe",
                                };

                                ingredientsArray.forEach((ingredient, index) => {
                                    const dashIndex = ingredient.indexOf(' - ');
                                    if (dashIndex > 0) {
                                        customRecipe[`strMeasure${index + 1}`] = ingredient.substring(0, dashIndex).trim();
                                        customRecipe[`strIngredient${index + 1}`] = ingredient.substring(dashIndex + 3).trim();
                                    } else {
                                        customRecipe[`strIngredient${index + 1}`] = ingredient;
                                        customRecipe[`strMeasure${index + 1}`] = '';
                                    }
                                });

                                await handleSave(customRecipe);
                                setRecipeFormOpened(false);
                                setActiveTab("saved recipes");
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