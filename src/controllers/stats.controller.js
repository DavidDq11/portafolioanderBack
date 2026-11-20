const db = require('../config/db');

async function getStats(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM productos) AS total_productos,
        (SELECT COUNT(*)::int FROM productos WHERE disponible = TRUE) AS productos_disponibles,
        (SELECT COUNT(*)::int FROM productos WHERE destacado = TRUE) AS productos_destacados,
        (SELECT COUNT(*)::int FROM categorias) AS total_categorias
    `);

    const row = rows[0] || {};
    return res.status(200).json({
      totalProductos: Number(row.total_productos ?? 0),
      productosDisponibles: Number(row.productos_disponibles ?? 0),
      productosDestacados: Number(row.productos_destacados ?? 0),
      totalCategorias: Number(row.total_categorias ?? 0),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getStats };
