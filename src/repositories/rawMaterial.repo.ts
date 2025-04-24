import { Prisma, PrismaClient } from '@prisma/client';

export type Tx = Prisma.TransactionClient;

class RawMaterialRepo {
  lockForUpdate(tx: Tx, id: string): Promise<unknown> {
    return tx.$executeRawUnsafe(
      `SELECT id FROM "RawMaterial" WHERE id = $1 FOR UPDATE`,
      id
    );
  }
  updateStock(tx: Tx, id: string, stock: number) {
    return tx.rawMaterial.update({
      where: { id },
      data: { stock },
    });
  }
}

export default new RawMaterialRepo();
