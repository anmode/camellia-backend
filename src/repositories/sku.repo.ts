import prisma from '../config/database';
import { Tx } from './rawMaterial.repo';

class SkuRepo {
  findById(id: string) {
    return prisma.sku.findUnique({ where: { id } });
  }

  updateAvailableCount(tx: Tx, skuId: string, availableCount: number) {
    return tx.sku.update({
      where: { id: skuId },
      data: { availableCount },
    });
  }
}

export default new SkuRepo();
