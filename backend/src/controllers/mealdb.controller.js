const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export const filterByIngredient = async (req, res) => {
    try {
        const { ingredient } = req.query;
        const url = `${MEALDB_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient || '')}`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error fetching meals by ingredient:', error);
        res.status(500).json({ error: 'Failed to fetch meals by ingredient' });
    }
};

export const searchByName = async (req, res) => {
    try {
        const { s = '' } = req.query;
        const url = `${MEALDB_BASE_URL}/search.php?s=${encodeURIComponent(s)}`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error searching meals by name:', error);
        res.status(500).json({ error: 'Failed to search meals' });
    }
};

export const lookupById = async (req, res) => {
    try {
        const { id } = req.params;
        const url = `${MEALDB_BASE_URL}/lookup.php?i=${id}`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error fetching meal details:', error);
        res.status(500).json({ error: 'Failed to fetch meal details' });
    }
};
