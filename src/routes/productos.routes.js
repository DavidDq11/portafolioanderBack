const { Router } = require('express');
const {
  getProductos,
  getProductoById,
  createProducto,
  createProductosBulk,
  updateProducto,
  deleteProducto,
} = require('../controllers/productos.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', getProductos);
router.post('/bulk', authMiddleware, createProductosBulk);
router.get('/:id', getProductoById);
router.post('/', authMiddleware, createProducto);
router.put('/:id', authMiddleware, updateProducto);
router.delete('/:id', authMiddleware, deleteProducto);

module.exports = router;
