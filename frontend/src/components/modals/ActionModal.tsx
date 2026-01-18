// import type { ActionType, MealRecipe } from "@/pages/recipe";
// import { Button, Modal, Stack, Text, Title } from "@mantine/core";
// import { Heart, Save, Trash2 } from "lucide-react";

// interface RecipeActionModalProps {
//     opened: boolean;
//     onClose: () => void;
//     recipeToActOn: MealRecipe | null;
//     currentActionType: ActionType;
//     isRecipeSaved: (idMeal: string) => boolean;
//     isRecipeFavorite: (idMeal: string) => boolean;
//     handleSaveRecipe: (recipe: MealRecipe) => void;
//     handleUnsaveRecipe: (idMeal: string) => void;
//     handleFavoriteRecipe: (recipe: MealRecipe) => void;
//     handleUnfavoriteRecipe: (idMeal: string) => void;
// }

// export const RecipeActionModal: React.FC<RecipeActionModalProps> = ({
//     opened,
//     onClose,
//     recipeToActOn,
//     currentActionType,
//     isRecipeSaved,
//     isRecipeFavorite,
//     handleSaveRecipe,
//     handleUnsaveRecipe,
//     handleFavoriteRecipe,
//     handleUnfavoriteRecipe,
// }) => {
//     if (!recipeToActOn) return null;

//     const isSaved = isRecipeSaved(recipeToActOn.idMeal);
//     const isFavorited = isRecipeFavorite(recipeToActOn.idMeal);
//     const isRemoveAction = (currentActionType === 'save' && isSaved) || (currentActionType === 'favorite' && isFavorited);
//     const actionColor = currentActionType === 'save' ? "#8a9a7b" : "#e54854";
//     const actionLabel = currentActionType === 'save' ? 'Saved Recipes' : 'Favorite Recipes';

//     const getActionModalTitle = () => {
//         if (isRemoveAction) {
//             return `Remove recipe from ${actionLabel}?`;
//         } else {
//             return `Add recipe to ${actionLabel}?`;
//         }
//     };

//     const getConfirmationText = () => {
//         if (isRemoveAction) {
//             return (
//                 <Text size="sm" ta="center">
//                     Are you sure you want to remove "{recipeToActOn.strMeal}" from {actionLabel}?
//                 </Text>
//             );
//         } else if (currentActionType === 'favorite' && isSaved) {
//             return (
//                 <Text size="sm" ta="center" color="orange">
//                     Favoriting "{recipeToActOn.strMeal}" will automatically remove it from your Saved Recipes section. Continue?
//                 </Text>
//             );
//         } else {
//             return (
//                 <Text size="sm" ta="center">
//                     Confirm you want to {currentActionType} this recipe.
//                 </Text>
//             );
//         }
//     };

//     const handleActionClick = () => {
//         if (currentActionType === 'save') {
//             isSaved ? handleUnsaveRecipe(recipeToActOn.idMeal) : handleSaveRecipe(recipeToActOn);
//         } else {
//             isFavorited ? handleUnfavoriteRecipe(recipeToActOn.idMeal) : handleFavoriteRecipe(recipeToActOn);
//         }
//     };

//     return (
//         <Modal
//             opened={opened}
//             onClose={onClose}
//             title={<Title order={4}>{getActionModalTitle()}</Title>}
//             centered
//             radius={"md"}
//         >
//             <Stack gap="md">
//                 {getConfirmationText()}
//                 <Button
//                     leftSection={isRemoveAction ? <Trash2 size={20} /> : (currentActionType === 'save' ? <Save size={20} /> : <Heart size={20} />)}
//                     color={actionColor}
//                     onClick={handleActionClick}
//                     fullWidth
//                     styles={{
//                         root: {
//                             backgroundColor: isRemoveAction ? '#e54854' : actionColor,
//                         }
//                     }}
//                 >
//                     {isRemoveAction ? 'Yes, Remove It' : `Yes, ${currentActionType === 'save' ? 'Save' : 'Favorite'}`}
//                 </Button>
//                 <Button variant="default" onClick={onClose} fullWidth>
//                     Cancel
//                 </Button>
//             </Stack>
//         </Modal>
//     );
// };