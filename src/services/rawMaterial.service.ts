import prisma from '../config/database';
import eventBus from '../config/queue';
import rawMaterialRepo, { Tx } from '../repositories/rawMaterial.repo';
import { recalcSkusInTx } from './skuAvailability.service';

class RawMaterialService {
  async updateStock(id: string, newStock: number): Promise<void> {
    if (newStock < 0) {
      const err = new Error('Stock cannot be negative');
      (err as any).status = 400;
      throw err;
    }

    await prisma.$transaction(async (tx: Tx) => {
      await rawMaterialRepo.lockForUpdate(tx, id);
      await rawMaterialRepo.updateStock(tx, id, newStock);
      await recalcSkusInTx(id, tx);
    });

    eventBus.emit('materialStockUpdated', { rawMaterialId: id });
  }
}

export default new RawMaterialService();
