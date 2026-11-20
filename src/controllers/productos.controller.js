const db = require('../config/db');

const PRODUCTO_SELECT = `
  SELECT
    p.id,
    p.categoria_id,
    c.nombre AS categoria_nombre,
    c.icono AS categoria_icono,
    p.codigo,
    p.nombre,
    p.descripcion,
    p.precio,
    p.precio_anterior,
    p.imagen_url,
    p.etiquetas,
    p.destacado,
    p.disponible,
    p.creado_en,
    p.actualizado_en
  FROM productos p
  LEFT JOIN categorias c ON p.categoria_id = c.id
`;

function formatProducto(row) {
  return {
    id: row.id,
    categoria_id: row.categoria_id !== null ? Number(row.categoria_id) : null,
    categoria_nombre: row.categoria_nombre ?? null,
    categoria_icono: row.categoria_icono ?? null,
    codigo: row.codigo ?? '',
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    precio: Number(row.precio ?? 0),
    precio_anterior:
      row.precio_anterior !== null && row.precio_anterior !== undefined
        ? Number(row.precio_anterior)
        : null,
    imagen_url: row.imagen_url ?? '',
    etiquetas: row.etiquetas ?? '',
    destacado: Boolean(row.destacado),
    disponible: Boolean(row.disponible),
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
  };
}

function parseProductoPayload(body = {}) {
  const {
    categoria_id,
    codigo,
    nombre,
    descripcion,
    precio,
    precio_anterior,
    imagen_url,
    etiquetas,
    destacado,
    disponible,
  } = body;

  if (!nombre || !String(nombre).trim()) {
    return { error: 'El nombre del producto es obligatorio.' };
  }

  const parsedPrecio =
    precio !== undefined && precio !== null && precio !== ''
      ? Number(precio)
      : 0;
  if (Number.isNaN(parsedPrecio) || parsedPrecio < 0) {
    return { error: 'El precio debe ser un número mayor o igual a 0.' };
  }

  let parsedPrecioAnterior = null;
  if (
    precio_anterior !== undefined &&
    precio_anterior !== null &&
    precio_anterior !== ''
  ) {
    parsedPrecioAnterior = Number(precio_anterior);
    if (Number.isNaN(parsedPrecioAnterior) || parsedPrecioAnterior < 0) {
      return {
        error: 'El precio anterior debe ser un número mayor o igual a 0.',
      };
    }
  }

  let parsedCategoriaId = null;
  if (
    categoria_id !== undefined &&
    categoria_id !== null &&
    categoria_id !== ''
  ) {
    parsedCategoriaId = Number(categoria_id);
    if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
      return { error: 'La categoría seleccionada no es válida.' };
    }
  }

  return {
    data: {
      categoria_id: parsedCategoriaId,
      codigo:
        codigo !== undefined && codigo !== null && String(codigo).trim() !== ''
          ? String(codigo).trim()
          : null,
      nombre: String(nombre).trim(),
      descripcion:
        descripcion !== undefined && descripcion !== null
          ? String(descripcion).trim()
          : '',
      precio: parsedPrecio,
      precio_anterior: parsedPrecioAnterior,
      imagen_url:
        imagen_url !== undefined &&
        imagen_url !== null &&
        String(imagen_url).trim() !== ''
          ? String(imagen_url).trim()
          : null,
      etiquetas:
        etiquetas !== undefined &&
        etiquetas !== null &&
        String(etiquetas).trim() !== ''
          ? String(etiquetas).trim()
          : null,
      destacado: Boolean(destacado),
      disponible: disponible === undefined ? true : Boolean(disponible),
    },
  };
}

async function getProductos(req, res, next) {
  try {
    const { rows } = await db.query(`
      ${PRODUCTO_SELECT}
      ORDER BY p.destacado DESC, p.id DESC
    `);

    return res.status(200).json(rows.map(formatProducto));
  } catch (err) {
    return next(err);
  }
}

async function getProductoById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID de producto inválido.' });
    }

    const { rows } = await db.query(
      `${PRODUCTO_SELECT} WHERE p.id = $1 LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    return res.status(200).json(formatProducto(rows[0]));
  } catch (err) {
    return next(err);
  }
}

async function createProducto(req, res, next) {
  try {
    const { data, error } = parseProductoPayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { rows: inserted } = await db.query(
      `INSERT INTO productos (
        categoria_id, codigo, nombre, descripcion, precio, precio_anterior,
        imagen_url, etiquetas, destacado, disponible
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        data.categoria_id,
        data.codigo,
        data.nombre,
        data.descripcion,
        data.precio,
        data.precio_anterior,
        data.imagen_url,
        data.etiquetas,
        data.destacado,
        data.disponible,
      ]
    );

    const { rows } = await db.query(
      `${PRODUCTO_SELECT} WHERE p.id = $1 LIMIT 1`,
      [inserted[0].id]
    );

    return res.status(201).json(formatProducto(rows[0]));
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({
        message: 'La categoría seleccionada no existe.',
      });
    }
    return next(err);
  }
}

async function updateProducto(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID de producto inválido.' });
    }

    const { data, error } = parseProductoPayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { rowCount } = await db.query(
      `UPDATE productos
       SET categoria_id = $1,
           codigo = $2,
           nombre = $3,
           descripcion = $4,
           precio = $5,
           precio_anterior = $6,
           imagen_url = $7,
           etiquetas = $8,
           destacado = $9,
           disponible = $10,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $11`,
      [
        data.categoria_id,
        data.codigo,
        data.nombre,
        data.descripcion,
        data.precio,
        data.precio_anterior,
        data.imagen_url,
        data.etiquetas,
        data.destacado,
        data.disponible,
        id,
      ]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    const { rows } = await db.query(
      `${PRODUCTO_SELECT} WHERE p.id = $1 LIMIT 1`,
      [id]
    );

    return res.status(200).json(formatProducto(rows[0]));
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({
        message: 'La categoría seleccionada no existe.',
      });
    }
    return next(err);
  }
}

async function deleteProducto(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID de producto inválido.' });
    }

    const { rowCount } = await db.query(
      'DELETE FROM productos WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    return res.status(200).json({
      message: 'Producto eliminado correctamente',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
};
