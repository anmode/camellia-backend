import express from 'express';
import bodyParser from 'body-parser';
import rawMaterialRouter from './controllers/rawMaterial.controller';
import skuRouter         from './controllers/sku.controller';
import errorHandler      from './middlewares/errorHandler';

const app = express();
app.use(bodyParser.json());

app.use('/api/raw-materials', rawMaterialRouter);
app.use('/api/skus',         skuRouter);

app.use(errorHandler);
export default app;
