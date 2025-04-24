import recipeRepo from '../repositories/recipe.repo';
import skuRepo    from '../repositories/sku.repo';
import unitConversion from '../utils/unitConversion';
import type { Tx }    from '../repositories/rawMaterial.repo';

export async function recalcSkusInTx(rawMaterialId: string, tx: Tx) {
  const affected = await recipeRepo.findIngredientsByMaterial(tx, rawMaterialId);
  for (const { recipeId } of affected) {
    const recipe = await recipeRepo.findRecipeWithIngredients(tx, recipeId);
    if (!recipe) continue;

    const counts = recipe.ingredients.map((ing) => {
      const stockBase = unitConversion.toBaseUnit(
        ing.rawMaterial.stock,
        ing.rawMaterial.unit as any
      );
      const reqBase = unitConversion.toBaseUnit(
        ing.quantity,
        ing.unit as any
      );
      return Math.floor(stockBase / reqBase);
    });
    const newCount = Math.min(...counts);

    for (const sku of recipe.skus) {
      await skuRepo.updateAvailableCount(tx, sku.id, newCount);
    }
  }
}


