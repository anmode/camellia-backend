import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

if (!process.env.DATABASE_URL?.includes('_test')) {
  console.error('⚠️  Tests should run against the test DB only! Aborting.');
  process.exit(1);
}

import request from 'supertest';
import { performance } from 'perf_hooks';
import app from '../src/app';
import prisma from '../src/config/database';


describe('Inventory System – Requirements Validation', () => {
  /**
   * Base fixture for TC1, TC2, TC5, TC6, TC7, TC8
   * RawMaterial rmT (1000g), Recipe rT needs 200g, sku skuT
   */

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  beforeAll(async () => {
    await prisma.rawMaterial.create({
      data: { id: 'rmT', name: 'TestMat', stock: 1000, unit: 'g' },
    });
    await prisma.recipe.create({
      data: { id: 'rT', name: 'RecipeT' },
    });
    await prisma.recipeIngredient.create({
      data: {
        id: 'riT',
        recipeId: 'rT',
        rawMaterialId: 'rmT',
        quantity: 200,
        unit: 'g',
      },
    });
    await prisma.sku.create({
      data: {
        id: 'skuT',
        name: 'skuT',
        recipeId: 'rT',
        availableCount: 0,
      },
    });
    // initial calculation
    await request(app)
      .put('/api/raw-materials/rmT/stock')
      .send({ stock: 1000 });
  });

  afterAll(async () => {
    await prisma.sku.deleteMany({});
    await prisma.recipeIngredient.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.rawMaterial.deleteMany({});
    await prisma.$disconnect();
  });

  it('TC1: Strong consistency — PUT then immediate GET yields correct availableCount', async () => {
    await request(app)
      .put('/api/raw-materials/rmT/stock')
      .send({ stock: 500 });
    const res = await request(app).get('/api/skus/skuT');
    expect(res.status).toBe(200);
    expect(res.body.availableCount).toBe(Math.floor(500 / 200)); // =2
  });

  it('TC2: Concurrency safety — two parallel updates do not corrupt state', async () => {
    const p1 = request(app)
      .put('/api/raw-materials/rmT/stock')
      .send({ stock: 800 });
    const p2 = request(app)
      .put('/api/raw-materials/rmT/stock')
      .send({ stock: 600 });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.status).toBe(204);
    expect(r2.status).toBe(204);

    const mat = await prisma.rawMaterial.findUnique({
      where: { id: 'rmT' },
    });
    expect([800, 600]).toContain(mat?.stock);

    const sku = await request(app).get('/api/skus/skuT');
    expect(sku.body.availableCount).toBe(
      Math.floor((mat?.stock ?? 0) / 200)
    );
  });

  it('TC3: No over-commit — negative-stock update is rejected', async () => {
    // Seed isolated fixture
    await prisma.rawMaterial.create({
      data: { id: 'rmNeg', name: 'NegMat', stock: 100, unit: 'g' },
    });
    await prisma.recipe.create({
      data: { id: 'rNeg', name: 'RecipeNeg' },
    });
    await prisma.recipeIngredient.create({
      data: {
        id: 'riNeg',
        recipeId: 'rNeg',
        rawMaterialId: 'rmNeg',
        quantity: 150,
        unit: 'g',
      },
    });
    await prisma.sku.create({
      data: {
        id: 'skuNeg',
        name: 'skuNeg',
        recipeId: 'rNeg',
        availableCount: 0,
      },
    });
    // Trigger initial calc
    await request(app)
      .put('/api/raw-materials/rmNeg/stock')
      .send({ stock: 100 });

    // Attempt to set negative stock
    const res = await request(app)
      .put('/api/raw-materials/rmNeg/stock')
      .send({ stock: -50 });
    expect(res.status).toBe(400);

    const mat = await prisma.rawMaterial.findUnique({
      where: { id: 'rmNeg' },
    });
    // stock should remain >= 0
    expect(mat?.stock).toBeGreaterThanOrEqual(0);

    const sku = await request(app).get('/api/skus/skuNeg');
    expect(sku.body.availableCount).toBe(0);

    // Cleanup negative fixture
    await prisma.sku.delete({ where: { id: 'skuNeg' } });
    await prisma.recipeIngredient.delete({ where: { id: 'riNeg' } });
    await prisma.recipe.delete({ where: { id: 'rNeg' } });
    await prisma.rawMaterial.delete({ where: { id: 'rmNeg' } });
  });

  it('TC4: All dependents updated — one material, two skus', async () => {
    // Seed new material + two recipes + two skus
    await prisma.rawMaterial.create({
      data: { id: 'rmM', name: 'MultiMat', stock: 400, unit: 'g' },
    });
    for (const idx of [1, 2]) {
      await prisma.recipe.create({
        data: { id: `r${idx}`, name: `Recipe${idx}` },
      });
      await prisma.recipeIngredient.create({
        data: {
          id: `ri${idx}`,
          recipeId: `r${idx}`,
          rawMaterialId: 'rmM',
          quantity: 100 * idx, // 100g for r1, 200g for r2
          unit: 'g',
        },
      });
      await prisma.sku.create({
        data: {
          id: `sku${idx}`,
          name: `skuMulti${idx}`,
          recipeId: `r${idx}`,
          availableCount: 0,
        },
      });
    }
    // Trigger update
    await request(app)
      .put('/api/raw-materials/rmM/stock')
      .send({ stock: 400 });

    // Check both skus
    const res1 = await request(app).get('/api/skus/sku1');
    const res2 = await request(app).get('/api/skus/sku2');
    expect(res1.body.availableCount).toBe(Math.floor(400 / 100)); // =4
    expect(res2.body.availableCount).toBe(Math.floor(400 / 200)); // =2

    // Cleanup
    for (const idx of [1, 2]) {
      await prisma.sku.delete({ where: { id: `sku${idx}` } });
      await prisma.recipeIngredient.delete({ where: { id: `ri${idx}` } });
      await prisma.recipe.delete({ where: { id: `r${idx}` } });
    }
    await prisma.rawMaterial.delete({ where: { id: 'rmM' } });
  });

  it('TC5: High-availability reads — GET latency < 20 ms', async () => {
    const t0 = performance.now();
    const res = await request(app).get('/api/skus/skuT');
    const t1 = performance.now();
    expect(res.status).toBe(200);
    expect(t1 - t0).toBeLessThan(20);
  });

  it('TC6: Millisecond-scale update + read — end-to-end < 50 ms', async () => {
    const t0 = performance.now();
    await request(app)
      .put('/api/raw-materials/rmT/stock')
      .send({ stock: 900 });
    const res = await request(app).get('/api/skus/skuT');
    const t1 = performance.now();
    expect(res.status).toBe(200);
    expect(t1 - t0).toBeLessThan(50);
  });

  it('TC7: Restock increases availability correctly', async () => {
    // At this point rmT.stock is 900
    await request(app)
      .put('/api/raw-materials/rmT/stock')
      .send({ stock: 1200 });
    const res = await request(app).get('/api/skus/skuT');
    expect(res.body.availableCount).toBe(Math.floor(1200 / 200)); // =6
  });

  it('TC8: Load-spike resilience — 100 concurrent GETs', async () => {
    const calls = Array.from({ length: 100 }, () =>
      request(app).get('/api/skus/skuT')
    );
    const results = await Promise.all(calls);
    // All should be 200 + correct count
    for (const r of results) {
      expect(r.status).toBe(200);
      expect(r.body.availableCount).toBe(Math.floor(1200 / 200));
    }
  });
});
