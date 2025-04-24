import { Router } from 'express';
import rawMaterialService from '../services/rawMaterial.service';

const router = Router();

router.put('/:id/stock', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    await rawMaterialService.updateStock(id, stock);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
