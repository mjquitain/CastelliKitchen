
import { mealdbApi } from '@/api/recipes';
import { openRecipeActionModal } from "@/components/modals/ActionModal";
import { openRecipeDetailModal } from "@/components/modals/RecipeModal";
import { RecipeCard } from "@/components/RecipeCard";
import { useRecipes } from "@/hooks/useRecipes";
import api from "@/lib/api";
import {
    Badge,
    Box,
    Button,
    Divider,
    FileButton,
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
    Textarea,
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
        handleSave,
        handleFavorite,
        handleDelete,
        handleUpdate
    } = useRecipes();

    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [recipes, setRecipes] = useState<MealRecipe[]>([]);
    const [isInternalLoading, setIsInternalLoading] = useState(false);
    const [savedSearch, setSavedSearch] = useState("");
    const [savedCategory, setSavedCategory] = useState<string | null>(null);
    const [favSearch, setFavSearch] = useState("");
    const [favCategory, setFavCategory] = useState<string | null>(null);
    const [RecipeFormOpened, setRecipeFormOpened] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>("generated recipes");
    const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
    const [isIngredientsLoading, setIsIngredientsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecipe, setIsEditingRecipe] = useState<MealRecipe | null>(null);
    const [editIngredientsInput, setEditIngredientsInput] = useState('');
    const [isInsertImage, setIsInsertImage] = useState<File | null>(null);
    const [recipeFormErrors, setRecipeFormErrors] = useState<Record<string, string>>({});
    const [editRecipeFormErrors, setEditRecipeFormErrors] = useState<Record<string, string>>({});

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

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const availableIngredients = ingredients.filter((ingredient: any) => {
                    if (!ingredient.batches || ingredient.batches.length === 0) return false;
                    return ingredient.batches.some((batch: any) => {
                        if (batch.isUsed || batch.isDeleted) return false;
                        const expiry = new Date(batch.expiryDate);
                        expiry.setHours(0, 0, 0, 0);
                        return expiry >= today;
                    });
                });

                setIngredientsList(availableIngredients);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setIsIngredientsLoading(false);
            }
        };
        fetchUserIngredients();
    }, []);

    useEffect(() => {
        if (!RecipeFormOpened) {
            setNewRecipe({
                strMeal: '',
                strCategory: '',
                strArea: '',
                strInstructions: '',
                strIngredients: '',
                strYoutube: '',
                strMealThumb: ''
            });
            setIsInsertImage(null);
            setRecipeFormErrors({});
        }
    }, [RecipeFormOpened]);

    useEffect(() => {
        if (!isEditModalOpen) {
            setIsInsertImage(null);
            setEditRecipeFormErrors({});
        }
    }, [isEditModalOpen]);

    const [newRecipe, setNewRecipe] = useState({
        strMeal: '',
        strCategory: '',
        strArea: '',
        strInstructions: '',
        strIngredients: '',
        strYoutube: '',
        strMealThumb: ''
    });

    const getValidImageUrl = (url: string): string => {
        if (!url || url.trim() === '') {
            return "https://placehold.co/600x400?text=My+Recipe";
        }
        const trimmedUrl = url.trim();
        try {
            new URL(trimmedUrl);
            return trimmedUrl;
        } catch {
            return "https://placehold.co/600x400?text=My+Recipe";
        }
    };

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
            return;
        }

        setIsInternalLoading(true);

        try {
            const primaryQuery = selectedIngredients[0];
            const response = await mealdbApi.filterByIngredient(primaryQuery);
            const filterData = response.data;

            if (!filterData.meals) {
                setRecipes([]);
                return;
            }

            const detailedRecipes = await Promise.all(
                filterData.meals.map(async (meal: any) => {
                    const detailRes = await mealdbApi.lookupById(meal.idMeal);
                    const detailData = detailRes.data;
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
                const response = await mealdbApi.lookupById(idMeal);
                const data = response.data;
                if (data.meals && data.meals.length > 0) {
                    recipe = data.meals[0];
                }
            }

            if (recipe) {
                openRecipeDetailModal(recipe);
            }

        } catch (error) {
            console.error("Error fetching recipe details:", error);
        }
    };

    const openActionModal = (recipe: MealRecipe, action: ActionType) => {
        openRecipeActionModal({
            recipeToActOn: recipe,
            currentActionType: action,
            isRecipeSaved,
            isRecipeFavorite,
            handleSave,
            handleFavorite,
            handleDelete,
        });
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

    const openEditModal = (recipe: MealRecipe) => {
        const ingredientsList = Array.from({ length: 20 }, (_, i) => i + 1)
            .map(i => {
                const ingredient = recipe[`strIngredient${i}`];
                const measure = recipe[`strMeasure${i}`];
                if (ingredient && ingredient.trim() !== "") {
                    return measure && measure.trim() !== ""
                        ? `${measure} - ${ingredient}`
                        : ingredient;
                }
                return null;
            })
            .filter(Boolean)
            .join(', ');

        setIsEditingRecipe(recipe);
        setEditIngredientsInput(ingredientsList);
        setIsEditModalOpen(true);
    }

    const handleUpdateRecipe = async (updatedRecipe: MealRecipe, imageFile?: File | null) => {
        await handleUpdate(updatedRecipe, imageFile);
        setIsEditModalOpen(false);
        setIsEditingRecipe(null);
        setEditIngredientsInput('');
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
                <Tabs value={activeTab} onChange={setActiveTab} color="#8a9a7b">
                    <Tabs.List grow>
                        <Tabs.Tab value="generated recipes" style={{ fontSize: '16px' }}>
                            <Group justify='center'>
                                <Blocks size={16} />
                                <Text style={{ fontSize: '16px', color: '#2d3319' }}>Generate Recipe</Text>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="saved recipes" style={{ fontSize: '16px' }}>
                            <Group justify='center'>
                                <Save size={16} />
                                <Text style={{ fontSize: '16px', color: '#2d3319' }}>Saved Recipe</Text>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="favorite recipes" style={{ fontSize: '16px' }}>
                            <Group justify='center'>
                                <BookHeart size={16} />
                                <Text style={{ fontSize: '16px', color: '#2d3319' }}>Favorite Recipe</Text>
                            </Group>
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="generated recipes" pt="lg">
                        <Flex direction={{ base: 'column', sm: 'row' }} align="flex-start" gap="lg">
                            <Paper
                                shadow="md"
                                p="lg"
                                radius={"lg"}
                                style={{
                                    backgroundColor: 'white',
                                    border: '2px solid #8a9a7b',
                                    flex: '0 0 350px',
                                    alignSelf: 'flex-start',
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
                                    flex: 1,
                                    minWidth: 0,
                                    minHeight: '400px',
                                    height: recipes.length > 0 ? 'auto' : 'clamp(320px, 55vh, 700px)',
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
                        </Flex>
                    </Tabs.Panel>

                    <Tabs.Panel value="saved recipes" pt="xl">
                        <Flex justify={"flex-end"} gap={"md"} mb={"xl"} wrap="wrap">
                            <TextInput
                                placeholder="Search saved recipes..."
                                style={{ flex: 1, minWidth: '220px', maxWidth: "700px" }}
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
                            <Button leftSection={<Plus size={18} />} w={{ base: '100%', sm: '160px' }} radius={"md"} styles={{
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
                                            isCustom={recipe.isCustom}
                                            onDelete={() => handleDelete(recipe)}
                                            onEdit={() => openEditModal(recipe)}
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
                        <Flex justify={"flex-end"} gap={"md"} wrap="wrap">
                            <TextInput
                                placeholder="Search favorite recipes..."
                                style={{ flex: 1, minWidth: '220px', maxWidth: '700px' }}
                                mb="xl"
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

                {/* Change to ModalsProvider */}
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
                        <Stack gap="xs">
                            <Flex direction="row" gap="sm" align='flex-end' justify="space-between">
                                <TextInput
                                    label="Image URL (optional)"
                                    placeholder="Enter an image URL for the recipe"
                                    value={newRecipe.strMealThumb}
                                    onChange={(e) => setNewRecipe({ ...newRecipe, strMealThumb: e.currentTarget.value })}
                                    description="Leave empty to use default placeholder image"
                                    style={{ flex: 1 }}
                                />
                                <FileButton onChange={setIsInsertImage} accept="image/png,image/jpeg,image/webp">
                                    {(props) => <Button {...props} size="sm" variant="outline">Upload Image</Button>}
                                </FileButton>
                            </Flex>
                            {isInsertImage && (
                                <Text size="sm" c="teal" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ✓ File selected: {isInsertImage.name}
                                </Text>
                            )}
                        </Stack>
                        <TextInput
                            label="Recipe Name"
                            placeholder="Enter the name of the recipe"
                            value={newRecipe.strMeal}
                            onChange={(e) => { setNewRecipe({ ...newRecipe, strMeal: e.currentTarget.value }); if (recipeFormErrors.strMeal) setRecipeFormErrors(prev => ({ ...prev, strMeal: '' })); }}
                            withAsterisk
                            error={recipeFormErrors.strMeal}
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
                            onChange={(val) => { setNewRecipe({ ...newRecipe, strCategory: val || '' }); if (recipeFormErrors.strCategory) setRecipeFormErrors(prev => ({ ...prev, strCategory: '' })); }}
                            withAsterisk
                            error={recipeFormErrors.strCategory}
                        />
                        <TextInput
                            label="Area"
                            placeholder="Enter the area/cuisine of the recipe"
                            value={newRecipe.strArea}
                            onChange={(e) => setNewRecipe({ ...newRecipe, strArea: e.currentTarget.value })}
                        />
                        <Textarea
                            label="Ingredients"
                            placeholder="Enter each ingredient on a new line or separate with commas&#10;e.g.&#10;2 cups - Flour&#10;1 tsp - Salt&#10;Eggs"
                            value={newRecipe.strIngredients}
                            onChange={(e) => { setNewRecipe({ ...newRecipe, strIngredients: e.currentTarget.value }); if (recipeFormErrors.strIngredients) setRecipeFormErrors(prev => ({ ...prev, strIngredients: '' })); }}
                            minRows={3}
                            withAsterisk
                            error={recipeFormErrors.strIngredients}
                        />
                        <Textarea
                            label="Instructions"
                            placeholder="Enter the cooking instructions"
                            value={newRecipe.strInstructions}
                            onChange={(e) => { setNewRecipe({ ...newRecipe, strInstructions: e.currentTarget.value }); if (recipeFormErrors.strInstructions) setRecipeFormErrors(prev => ({ ...prev, strInstructions: '' })); }}
                            minRows={4}
                            withAsterisk
                            error={recipeFormErrors.strInstructions}
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
                                const errors: Record<string, string> = {};
                                if (!newRecipe.strMeal.trim()) errors.strMeal = 'Recipe name is required';
                                if (!newRecipe.strCategory) errors.strCategory = 'Category is required';
                                if (!newRecipe.strIngredients.trim()) errors.strIngredients = 'Ingredients are required';
                                if (!newRecipe.strInstructions.trim()) errors.strInstructions = 'Instructions are required';
                                if (Object.keys(errors).length > 0) {
                                    setRecipeFormErrors(errors);
                                    return;
                                }
                                setRecipeFormErrors({});

                                const ingredientsArray = newRecipe.strIngredients
                                    .split(/[\n,]+/)
                                    .map(ing => ing.trim())
                                    .filter(ing => ing !== '');

                                const customRecipe: MealRecipe = {
                                    idMeal: `custom-${Date.now()}`,
                                    strMeal: newRecipe.strMeal,
                                    strCategory: newRecipe.strCategory,
                                    strArea: newRecipe.strArea,
                                    strInstructions: newRecipe.strInstructions,
                                    strYoutube: newRecipe.strYoutube,
                                    strMealThumb: getValidImageUrl(newRecipe.strMealThumb),
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

                                await handleSave(customRecipe, isInsertImage);
                                setNewRecipe({
                                    strMeal: '',
                                    strCategory: '',
                                    strArea: '',
                                    strInstructions: '',
                                    strIngredients: '',
                                    strYoutube: '',
                                    strMealThumb: ''
                                });
                                setRecipeFormOpened(false);
                                setActiveTab("saved recipes");
                            }}
                        >
                            Add Recipe
                        </Button>
                    </Flex>
                </Modal>

                <Modal
                    opened={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title={<Text fw={"500"} size="lg"> Edit Custom Recipe </Text>}
                    overlayProps={{
                        backgroundOpacity: 0.55,
                        blur: 3,
                    }}
                    radius={"lg"}
                    padding={"lg"}
                    centered
                >
                    <Flex direction="column" gap="sm">
                        <Stack gap="xs">
                            <Flex direction="row" gap="sm" align="flex-end" justify="space-between">
                                <TextInput
                                    label="Image URL (optional)"
                                    placeholder="Enter an image URL for the recipe"
                                    value={editingRecipe?.strMealThumb || ''}
                                    onChange={(e) => setIsEditingRecipe(prev => prev ? { ...prev, strMealThumb: e.target.value } : null)}
                                    description="Leave empty to use default placeholder image"
                                    style={{ flex: 1 }}
                                />
                                <FileButton onChange={setIsInsertImage} accept="image/png,image/jpeg,image/webp">
                                    {(props) => <Button {...props} size="sm" variant="outline">Upload Image</Button>}
                                </FileButton>
                            </Flex>
                            {isInsertImage && (
                                <Text size="sm" c="teal" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ✓ File selected: {isInsertImage.name}
                                </Text>
                            )}
                        </Stack>
                        <TextInput
                            label="Recipe Name"
                            placeholder="Enter the name of the recipe"
                            value={editingRecipe?.strMeal || ''}
                            onChange={(e) => { setIsEditingRecipe(prev => prev ? { ...prev, strMeal: e.target.value } : null); if (editRecipeFormErrors.strMeal) setEditRecipeFormErrors(prev => ({ ...prev, strMeal: '' })); }}
                            withAsterisk
                            error={editRecipeFormErrors.strMeal}
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
                            value={editingRecipe?.strCategory || ''}
                            onChange={(val) => { setIsEditingRecipe(prev => prev ? { ...prev, strCategory: val || '' } : null); if (editRecipeFormErrors.strCategory) setEditRecipeFormErrors(prev => ({ ...prev, strCategory: '' })); }}
                            withAsterisk
                            error={editRecipeFormErrors.strCategory}
                        />
                        <TextInput
                            label="Area"
                            placeholder="Enter the area/cuisine of the recipe"
                            value={editingRecipe?.strArea || ''}
                            onChange={(e) => setIsEditingRecipe(prev => prev ? { ...prev, strArea: e.target.value } : null)}
                        />
                        <Textarea
                            label="Ingredients"
                            placeholder="Enter each ingredient on a new line or separate with commas&#10;e.g.&#10;2 cups - Flour&#10;1 tsp - Salt&#10;Eggs"
                            value={editIngredientsInput}
                            onChange={(e) => { setEditIngredientsInput(e.target.value); if (editRecipeFormErrors.strIngredients) setEditRecipeFormErrors(prev => ({ ...prev, strIngredients: '' })); }}
                            minRows={3}
                            withAsterisk
                            error={editRecipeFormErrors.strIngredients}
                        />
                        <Textarea
                            label="Instructions"
                            placeholder="Enter the cooking instructions"
                            value={editingRecipe?.strInstructions || ''}
                            onChange={(e) => { setIsEditingRecipe(prev => prev ? { ...prev, strInstructions: e.target.value } : null); if (editRecipeFormErrors.strInstructions) setEditRecipeFormErrors(prev => ({ ...prev, strInstructions: '' })); }}
                            minRows={4}
                            withAsterisk
                            error={editRecipeFormErrors.strInstructions}
                        />
                        <TextInput
                            label="YouTube Link"
                            placeholder="Enter a YouTube link for the recipe (optional)"
                            value={editingRecipe?.strYoutube || ''}
                            onChange={(e) => setIsEditingRecipe(prev => prev ? { ...prev, strYoutube: e.target.value } : null)}
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
                                if (!editingRecipe) return;

                                const errors: Record<string, string> = {};
                                if (!editingRecipe.strMeal.trim()) errors.strMeal = 'Recipe name is required';
                                if (!editingRecipe.strCategory) errors.strCategory = 'Category is required';
                                if (!editIngredientsInput.trim()) errors.strIngredients = 'Ingredients are required';
                                if (!editingRecipe.strInstructions.trim()) errors.strInstructions = 'Instructions are required';
                                if (Object.keys(errors).length > 0) {
                                    setEditRecipeFormErrors(errors);
                                    return;
                                }
                                setEditRecipeFormErrors({});

                                const ingredientsArray = editIngredientsInput
                                    .split(/[\n,]+/)
                                    .map(ing => ing.trim())
                                    .filter(ing => ing !== '');

                                const updatedRecipe: MealRecipe = {
                                    ...editingRecipe,
                                    strMeal: editingRecipe.strMeal,
                                    strCategory: editingRecipe.strCategory,
                                    strArea: editingRecipe.strArea,
                                    strInstructions: editingRecipe.strInstructions,
                                    strYoutube: editingRecipe.strYoutube,
                                    strMealThumb: getValidImageUrl(editingRecipe.strMealThumb || ''),
                                };

                                for (let i = 1; i <= 20; i++) {
                                    delete updatedRecipe[`strIngredient${i}`];
                                    delete updatedRecipe[`strMeasure${i}`];
                                }
                                delete updatedRecipe['strIngredients'];

                                ingredientsArray.forEach((ingredient, index) => {
                                    const dashIndex = ingredient.indexOf(' - ');
                                    if (dashIndex > 0) {
                                        updatedRecipe[`strMeasure${index + 1}`] = ingredient.substring(0, dashIndex).trim();
                                        updatedRecipe[`strIngredient${index + 1}`] = ingredient.substring(dashIndex + 3).trim();
                                    } else {
                                        updatedRecipe[`strIngredient${index + 1}`] = ingredient;
                                        updatedRecipe[`strMeasure${index + 1}`] = '';
                                    }
                                });

                                await handleUpdateRecipe(updatedRecipe, isInsertImage);
                            }}
                        >
                            Update Recipe
                        </Button>
                    </Flex>
                </Modal>
            </Stack>
        </Stack >
    );
}

export default RecipePage;