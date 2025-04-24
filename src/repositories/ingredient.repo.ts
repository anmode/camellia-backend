import prisma from '../config/database';

class IngredientRepo {
  async findByRecipe(recipeId: string) {
    return prisma.recipeIngredient.findMany({
      where: { recipeId },
      include: { rawMaterial: true },
    });
  }
}

export default new IngredientRepo();
