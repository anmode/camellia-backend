import skuRepo from '../repositories/sku.repo';

class SkuService {
  async getSkuById(id: string) {
    return skuRepo.findById(id);
  }
}

export default new SkuService();
