import { Ingredient } from "../models/ingredient.model.js";
import { IngredientBatch } from "../models/ingredientbatch.model.js";
import { createNotification, getNotificationMessage } from "../utils/notificationHelper.js";

const isValidDate = (date) => {
  const d = new Date(date);
  return !isNaN(d);
};

const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

const addIngredient = async (req, res) => {
    try {
        const { name, quantity, category, dateAdded, expiryDate } = req.body;
        

        if (!name || !quantity || !category || !dateAdded || !expiryDate) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ message: "Quantity must be a positive number." });
        }

        const addedDate = new Date(dateAdded);
        const expiry = new Date(expiryDate);

        if (isNaN(addedDate) || isNaN(expiry)) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        if (expiry < addedDate) {
            return res.status(400).json({ message: "Expiry date cannot be before date added." });
        }

        const normalizedName = String(name || '').trim().toLowerCase();

        let ingredient = await Ingredient.findOne({
            userId: req.user.id,
            name: normalizedName
        });

        if (!ingredient) {
            ingredient = await Ingredient.create({
                userId: req.user.id,
                name: normalizedName,
                category
            });
        }

        const existingIngredientBatch = await IngredientBatch.findOne({
            userId: req.user.id,
            ingredientId: ingredient._id,
            expiryDate,
            isUsed: false,
            isDeleted: false
        });

        if (existingIngredientBatch) {
            return res.status(409).json({ message: "Ingredient already saved. If there are any changes, update the record instead." });
        }

        const ingredientBatch = await IngredientBatch.create({
            userId: req.user.id,
            ingredientId: ingredient._id,
            quantity,
            dateAdded,
            expiryDate
        });

        try {
            await createNotification(
                req.user.id,
                'ingredient_added',
                getNotificationMessage('ingredient_added', ingredient.name),
                ingredient._id,
                ingredient.name
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(201).json({ ingredient, ingredientBatch });

    } catch (error) {
        res.status(500).json({ message: "Error saving ingredient." });
    }
};

// retrieve
const getIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find({ userId: req.user.id }).populate({ path: "batches", match: { isUsed: false, isDeleted: false } });
        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ingredients." })
    }
};

const getIngredientsByCategory = async (req, res) => {
    try {
        if (!req.params.category) {
            return res.status(400).json({ message: "Category is required." });
        }

        const ingredients = await Ingredient.find({
            userId: req.user.id,
            category: req.params.category
        });
        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ingredients by category." });
    }
};

const getBatchesPerIngredient = async (req, res) => {
    try {
        if (!req.params.ingredientId) {
            return res.status(400).json({ message: "Ingredient ID is required." });
        }

        const ingredients = await IngredientBatch.find({
            userId: req.user.id,
            ingredientId: req.params.ingredientId,
            isUsed: false,
            isDeleted: false
        }).sort({ expiryDate: 1 });

        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving all batches of the ingredient" })
    }
};

const getIngredientBatch = async (req, res) => {
    try {
        if (!req.params.batchId) {
            return res.status(400).json({ message: "Batch ID is required." });
        }

        const ingredientBatch = await IngredientBatch.findOne({
            _id: req.params.batchId,
            userId: req.user.id
        }).populate("ingredientId");

        if (!ingredientBatch) {
            return res.status(404).json({ message: "Ingredient batch not found." });
        }

        res.status(200).json(ingredientBatch);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ingredient batch." });
    }
}

// update
const updateIngredient = async (req, res) => {
    try {
        if (!req.params.ingredientId) {
            return res.status(400).json({ message: "Ingredient ID is required." });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "At least one field is required to update." });
        }

        const { name, category } = req.body;
        const updateData = {};
        if (name) updateData.name = name.toLowerCase().trim();
        if (category) updateData.category = category;

        const ingredient = await Ingredient.findOneAndUpdate(
            { userId: req.user.id, _id: req.params.ingredientId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!ingredient) {
            return res.status(404).json({ message: "Ingredient not found." });
        }

        try {
            await createNotification(
                req.user.id,
                'ingredient_edited',
                getNotificationMessage('ingredient_edited', ingredient.name),
                ingredient._id,
                ingredient.name
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(200).json(ingredient);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Ingredient with this name already exists" });
        }

        res.status(500).json({ message: "Error updating ingredient." });
    }
};

const updateIngredientBatch = async (req, res) => {
    try {
        if (!req.params.batchId) {
            return res.status(400).json({ message: "Batch ID is required." });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "At least one field is required to update." });
        }

        const { quantity, dateAdded, expiryDate, isUsed } = req.body;
        const updateData = {};

        if (quantity !== undefined) {
            if (!isPositiveNumber(quantity)) {
                return res.status(400).json({ message: "Quantity must be a positive number." });
            }
            updateData.quantity = quantity;
        }

        if (dateAdded) {
            if (!isValidDate(dateAdded)) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            updateData.dateAdded = dateAdded;
        }

        if (expiryDate) {
            if (!isValidDate(expiryDate)) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            updateData.expiryDate = expiryDate;
        }

        if (dateAdded && expiryDate && new Date(expiryDate) < new Date(dateAdded)) {
            return res.status(400).json({ message: "Expiry date cannot be before date added." });
        }

        if (typeof isUsed === "boolean") updateData.isUsed = isUsed;

        const beforeUpdate = await IngredientBatch.findOne({
            userId: req.user.id,
            _id: req.params.batchId
        }).populate('ingredientId');

        const ingredientBatch = await IngredientBatch.findOneAndUpdate(
            { userId: req.user.id, _id: req.params.batchId },
            updateData,
            { new: true, runValidators: true }
        ).populate('ingredientId');

        // const afterUpdate = await IngredientBatch.findOne({
        //     userId: req.user.id,
        //     _id: req.params.batchId
        // });

        if (!ingredientBatch) {
            return res.status(404).json({ message: "Ingredient batch not found." });
        }

        try {
            const ingredientName = ingredientBatch.ingredientId?.name || 'Ingredient';

            if (typeof isUsed === 'boolean' && isUsed === true && beforeUpdate && beforeUpdate.isUsed === false) {
                await createNotification(
                    req.user.id,
                    'ingredient_used',
                    getNotificationMessage('ingredient_used', ingredientName),
                    ingredientBatch.ingredientId?._id,
                    ingredientName
                );
            }
            else if (quantity !== undefined || dateAdded !== undefined || expiryDate !== undefined) {
                await createNotification(
                    req.user.id,
                    'ingredient_edited',
                    getNotificationMessage('ingredient_edited', ingredientName),
                    ingredientBatch.ingredientId?._id,
                    ingredientName
                );
            }
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(200).json(ingredientBatch);
    } catch (error) {
        console.error("Error updating batch:");
        res.status(500).json({ message: "Error updating ingredient batch." });
    };
};

// delete
const deleteIngredient = async (req, res) => {
    try {
        if (!req.params.ingredientId) {
            return res.status(400).json({ message: "Ingredient ID is required." });
        }

        const ingredient = await Ingredient.findOne({
            userId: req.user.id,
            _id: req.params.ingredientId
        });

        if (!ingredient) {
            return res.status(404).json({ message: "Ingredient not found." });
        }

        const ingredientName = ingredient.name;

        await IngredientBatch.deleteMany({
            userId: req.user.id,
            ingredientId: req.params.ingredientId
        });

        await Ingredient.findOneAndDelete({
            userId: req.user.id,
            _id: req.params.ingredientId
        });

        try {
            await createNotification(
                req.user.id,
                'ingredient_deleted',
                getNotificationMessage('ingredient_deleted', ingredientName),
                null,
                ingredientName
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(200).json({ message: "Ingredient deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting ingredient." });
    }
}

const deleteIngredientBatch = async (req, res) => {
    try {
        if (!req.params.batchId) {
            return res.status(400).json({ message: "Batch ID is required." });
        }

        const ingredientBatch = await IngredientBatch.findOneAndUpdate(
            {
                userId: req.user.id,
                _id: req.params.batchId
            },
            { isDeleted: true },
            { new: true }
        ).populate('ingredientId');

        if (!ingredientBatch) {
            return res.status(404).json({ message: "Ingredient batch not found." });
        }

        try {
            await createNotification(
                req.user.id,
                'ingredient_deleted',
                getNotificationMessage('ingredient_deleted', ingredientBatch.ingredientId.name),
                ingredientBatch.ingredientId._id,
                ingredientBatch.ingredientId.name
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(200).json({ message: "Ingredient batch deleted successfully." });
    } catch (error) {
        console.error("Error deleting batch:", error);
        res.status(500).json({ message: "Error deleting ingredient batch." });
    }
}

export {
    addIngredient, deleteIngredient, deleteIngredientBatch, getBatchesPerIngredient, getIngredientBatch, getIngredients, getIngredientsByCategory, updateIngredient, updateIngredientBatch
};

