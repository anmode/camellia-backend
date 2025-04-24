import recipeRepo from '../repositories/recipe.repo';

class RecipeService {
  async getAffectedRecipeIds(materialId: string): Promise<string[]> {
    const rows = await recipeRepo.findIngredientsByMaterialGlobal(materialId);
    return rows.map((r) => r.recipeId);
  }

  async getRecipeDetails(recipeId: string) {
    return recipeRepo.findRecipeWithIngredientsGlobal(recipeId);
  }
}

export default new RecipeService();
