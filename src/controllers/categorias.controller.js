const db = require('../config/db');

function formatCategoria(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    icono: row.icono ?? 'tag',
    activo: Boolean(row.activo),
    orden: Number(row.orden ?? 0),
    total_productos: Number(row.total_productos ?? 0),
    creado_en: row.creado_en,
  };
}

async function getCategorias(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT c.*, COUNT(p.id)::int AS total_productos
      FROM categorias c
      LEFT JOIN productos p ON p.categoria_id = c.id
      GROUP BY c.id
      ORDER BY c.orden ASC, c.id ASC
    `);

    return res.status(200).json(rows.map(formatCategoria));
  } catch (err) {
    return next(err);
  }
}

async function createCategoria(req, res, next) {
  try {
    const { nombre, descripcion, icono, orden, activo } = req.body || {};

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({
        message: 'El nombre de la categoría es obligatorio.',
      });
    }

    const cleanNombre = String(nombre).trim();
    const cleanDescripcion =
      descripcion !== undefined && descripcion !== null
        ? String(descripcion).trim()
        : '';
    const cleanIcono = icono && String(icono).trim() ? String(icono).trim() : 'tag';
    const parsedOrden =
      orden !== undefined && orden !== null && orden !== ''
        ? Number(orden)
        : 0;
    const cleanActivo = activo === undefined ? true : Boolean(activo);

    if (Number.isNaN(parsedOrden)) {
      return res.status(400).json({
        message: 'El campo orden debe ser un número válido.',
      });
    }

    const { rows } = await db.query(
      `INSERT INTO categorias (nombre, descripcion, icono, orden, activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *, 0::int AS total_productos`,
      [cleanNombre, cleanDescripcion, cleanIcono, parsedOrden, cleanActivo]
    );

    return res.status(201).json(formatCategoria(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'Ya existe una categoría con ese nombre.',
      });
    }
    return next(err);
  }
}

async function updateCategoria(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID de categoría inválido.' });
    }

    const { nombre, descripcion, icono, orden, activo } = req.body || {};

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({
        message: 'El nombre de la categoría es obligatorio.',
      });
    }

    const cleanNombre = String(nombre).trim();
    const cleanDescripcion =
      descripcion !== undefined && descripcion !== null
        ? String(descripcion).trim()
        : '';
    const cleanIcono = icono && String(icono).trim() ? String(icono).trim() : 'tag';
    const parsedOrden =
      orden !== undefined && orden !== null && orden !== ''
        ? Number(orden)
        : 0;
    const cleanActivo = activo === undefined ? true : Boolean(activo);

    if (Number.isNaN(parsedOrden)) {
      return res.status(400).json({
        message: 'El campo orden debe ser un número válido.',
      });
    }

    const { rows } = await db.query(
      `UPDATE categorias
       SET nombre = $1,
           descripcion = $2,
           icono = $3,
           orden = $4,
           activo = $5
       WHERE id = $6
       RETURNING *`,
      [cleanNombre, cleanDescripcion, cleanIcono, parsedOrden, cleanActivo, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }

    const { rows: countRows } = await db.query(
      'SELECT COUNT(*)::int AS total_productos FROM productos WHERE categoria_id = $1',
      [id]
    );

    return res.status(200).json(
      formatCategoria({
        ...rows[0],
        total_productos: countRows[0].total_productos,
      })
    );
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'Ya existe otra categoría con ese nombre.',
      });
    }
    return next(err);
  }
}

async function deleteCategoria(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID de categoría inválido.' });
    }

    const { rowCount } = await db.query(
      'DELETE FROM categorias WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }

    return res.status(200).json({
      message: 'Categoría eliminada correctamente',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
};
