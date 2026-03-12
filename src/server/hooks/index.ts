import * as express from 'express';
import { updateProduct } from './product';
import * as multer from 'multer';
import { listenInventory } from './inventory';

const router: express.Router = express.Router();

router.post('/product',  multer().none() ,updateProduct);
router.post('/inventory',  multer().none() ,listenInventory);

export {
  router
};
