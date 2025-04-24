import { Router } from 'express';
import skuService from '../services/sku.service';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sku = await skuService.getSkuById(id);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    res.json(sku);
  } catch (err) {
    next(err);
  }
});

export default router;
