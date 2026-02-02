import { Ingredient } from "../models/ingredient.model.js";
import { IngredientBatch } from "../models/ingredientbatch.model.js";

const addIngredient = async (req, res) => {
    try {
        const { name, quantity, category, dateAdded, expiryDate } = req.body;

        // console.log("USER:", req.user);
        // console.log("BODY:", req.body);


        let ingredient = await Ingredient.findOne({ 
            userId: req.user.id, 
            name 
        });

        if(!ingredient) {
            ingredient = await Ingredient.create({ 
                userId: req.user.id, 
                name, 
                category 
            });
        }

        const existingIngredientBatch = await IngredientBatch.findOne({
            userId: req.user.id,
            ingredientId: ingredient._id,
            expiryDate
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

        res.status(201).json({ ingredient, ingredientBatch });

    } catch (error) {
        res.status(500).json({ message: "Error saving ingredient." });
    }
};

// retrieve
const getIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find({ userId: req.user.id }).populate({ path: "batches", match: { isUsed: false } });
        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ingredients.", error })
    }
};

const getIngredientsByCategory = async (req, res) => {
    try {
        const ingredients = await Ingredient.find({ 
            userId: req.user.id, 
            category: req.params.category
         });
         res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ingredients by category.", error });
    }
};

const getBatchesPerIngredient = async (req, res) => {
    try {
        const ingredients = await IngredientBatch.find({ 
            userId: req.user.id,
            ingredientId: req.params.ingredientId,
            isUsed: false })
            .sort({ expiryDate: 1 });
        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving all batches of the ingredient" })
    }
};

const getIngredientBatch = async (req, res) => {
    try {
        const ingredientBatch = await IngredientBatch.findOne({ 
            _id: req.params.batchId,
            userId: req.user.id
         }).populate("ingredientId");

         if (!ingredientBatch) {
            return res.status(404).json({ message: "Ingredient batch not found." });
         }

         res.status(200).json(ingredientBatch);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ingredient batch" });
    }
}

// update
const updateIngredient = async (req, res) => {
    try {
        const { name, category } = req.body;
        const updateData = {};
        if (name) updateData.name = name.toLowerCase().trim();
        if (category) updateData.category = category;

        const ingredient = await Ingredient.findOneAndUpdate(
            { userId: req.user.id, _id: req.params.ingredientId},
            updateData,
            { new: true, runValidators: true}
        );

        if(!ingredient) {
            return res.status(404).json({ message: "Ingredient not found." });
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
        const { quantity, expiryDate, isUsed } = req.body;
        const updateData = {};
        if (quantity) updateData.quantity = quantity;
        if (expiryDate) updateData.expiryDate = expiryDate;
        if (typeof isUsed === "boolean") updateData.isUsed = isUsed;

        const ingredientBatch = await IngredientBatch.findOneAndUpdate( 
            { userId: req.user.id, _id: req.params.batchId },
            updateData, 
            { new: true, runValidators: true }
        );

        if(!ingredientBatch) {
            return res.status(404).json({ message: "Ingredient batch not found." });
        }

        res.status(200).json(ingredientBatch);
    } catch (error) {
        res.status(500).json({ message: "Error updating ingredient batch." });
    };
};

// delete
const deleteIngredient = async (req, res) => {
    try {
        const ingredientBatches = await IngredientBatch.deleteMany({ 
            userId: req.user.id, 
            ingredientId: req.params.ingredientId 
        });
        const ingredient = await Ingredient.findOneAndDelete({ 
            userId: req.user.id,
            _id: req.params.ingredientId
        });

        if (!ingredient) {
            return res.status(404).json({ message: "Ingredient not found." });
        }
        res.status(200).json({ message: "Ingredient deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting ingredient.", error});
    }
}

const deleteIngredientBatch = async (req, res) => {
    try { 
        const ingredientBatch = await IngredientBatch.findOneAndDelete({ 
            userId: req.user.id, 
            _id: req.params.batchId 
        });

        if (!ingredientBatch) {
            return res.status(404).json({ message: "Ingredient batch not found." });
        }
        res.status(200).json({ message: "Ingredient batch deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting ingredient batch.", error});
    }
}

// const markIngredientAsUsed = async (req, res) => {
//     try {
//         const batch = await IngredientBatch.findOne({ 
//             _id: req.params.batchId, 
//             userId: req.user._id 
//         });

//         if (!batch) {
//             return res.status(404).json({ message: "Ingredient not found." });
//         }

//         batch.isUsed = true;
//         await batch.save();
//         res.status(200).json(batch);
//     } catch (error) {
//         res.status(500).json({ message: "Error marking ingredient as used." });
//     }
// };

export {
    addIngredient, getIngredients, getIngredientsByCategory, getBatchesPerIngredient, getIngredientBatch, updateIngredient, updateIngredientBatch, deleteIngredient, deleteIngredientBatch
};