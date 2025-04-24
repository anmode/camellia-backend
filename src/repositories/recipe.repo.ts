import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import type { Tx } from './rawMaterial.repo';

class RecipeRepo {

  findIngredientsByMaterial(tx: Tx, rawMaterialId: string) {
    return tx.recipeIngredient.findMany({
      where: { rawMaterialId },
      select: { recipeId: true },
    });
  }

  findRecipeWithIngredients(tx: Tx, recipeId: string) {
    return tx.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { include: { rawMaterial: true } },
        skus: true,
      },
    });
  }

  findIngredientsByMaterialGlobal(rawMaterialId: string) {
    return prisma.recipeIngredient.findMany({
      where: { rawMaterialId },
      select: { recipeId: true },
    });
  }

  findRecipeWithIngredientsGlobal(recipeId: string) {
    return prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { include: { rawMaterial: true } },
        skus: true,
      },
    });
  }
}

export default new RecipeRepo();
