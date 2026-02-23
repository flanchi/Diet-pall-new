// Simple, extensible meal planning rules engine.
// Input: { age, weight, conditions: ["diabetes"], allergies: ["peanut"], calorieGoal }
// Output: { meals: [ { name, ingredients, notes } ] }

function generatePlan(profile) {
  const { conditions = [], allergies = [], calorieGoal } = profile || {};

  // Base ingredient pool (can be extended / replaced by DB)
  const allMeals = [
    { name: 'Grilled Fish with Callaloo', ingredients: ['fish', 'callaloo', 'brown rice'] },
    { name: 'Stewed Lentils and Dasheen', ingredients: ['lentils', 'dasheen', 'onion', 'garlic'] },
    { name: 'Chicken Pelau (light)', ingredients: ['chicken', 'pigeon peas', 'brown rice'] },
    { name: 'Vegetable Roti', ingredients: ['roti', 'pumpkin', 'eggplant', 'channa'] },
    { name: 'Pumpkin Soup', ingredients: ['pumpkin', 'onion', 'garlic', 'herbs'] }
  ];

  // Filtering by allergies
  const filtered = allMeals.filter(meal =>
    !meal.ingredients.some(ing => allergies.includes(ing))
  );

  // Simple adaptation for conditions
  const adapted = filtered.map(meal => {
    const notes = [];
    if (conditions.includes('diabetes')) {
      // prefer fiber and lean protein, avoid added sugars and white rice
      if (meal.ingredients.includes('brown rice') || meal.ingredients.includes('lentils') || meal.ingredients.includes('callaloo')) {
        notes.push('Good for blood sugar control: fiber-rich.');
      }
      if (meal.ingredients.includes('white rice')) {
        notes.push('Consider swapping white rice for brown rice.');
      }
    }
    if (conditions.includes('hypertension')) {
      notes.push('Low-salt preparation recommended.');
    }
    return { ...meal, notes };
  });

  // Pick a simple 3-meal plan: breakfast, lunch, dinner (cycle suggestions)
  const meals = [
    adapted[0 % adapted.length],
    adapted[1 % adapted.length],
    adapted[2 % adapted.length]
  ].map((m, i) => ({
    slot: ['breakfast', 'lunch', 'dinner'][i],
    name: m.name,
    ingredients: m.ingredients,
    notes: m.notes
  }));

  return { meals, meta: { source: 'simple-rules-v1' } };
}

module.exports = { generatePlan };
