const { Router } = require('express');
const {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} = require('../controllers/categorias.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', getCategorias);
router.post('/', authMiddleware, createCategoria);
router.put('/:id', authMiddleware, updateCategoria);
router.delete('/:id', authMiddleware, deleteCategoria);

module.exports = router;
