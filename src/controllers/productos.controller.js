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
    p.imagenes,
    p.etiquetas,
    p.destacado,
    p.disponible,
    p.creado_en,
    p.actualizado_en
  FROM productos p
  LEFT JOIN categorias c ON p.categoria_id = c.id
`;

function extractUrlList(rawImagenes) {
  if (Array.isArray(rawImagenes)) {
    return rawImagenes
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter(Boolean);
  }

  if (typeof rawImagenes === 'string' && rawImagenes.trim()) {
    try {
      const parsed = JSON.parse(rawImagenes);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
          .filter(Boolean);
      }
    } catch {
      return [rawImagenes.trim()];
    }
  }

  return [];
}

function normalizeImagenesForWrite(rawImagenes, rawImagenUrl) {
  const cleanImagenUrl =
    rawImagenUrl !== undefined && rawImagenUrl !== null
      ? String(rawImagenUrl).trim()
      : '';

  const deduped = Array.from(new Set(extractUrlList(rawImagenes)));

  if (cleanImagenUrl && !deduped.includes(cleanImagenUrl)) {
    deduped.unshift(cleanImagenUrl);
  }

  const finalImagenUrl = cleanImagenUrl || deduped[0] || null;

  return {
    imagen_url: finalImagenUrl,
    imagenes: deduped,
  };
}

function normalizeImagenesForRead(rawImagenes, rawImagenUrl) {
  const list = Array.from(new Set(extractUrlList(rawImagenes)));
  const cleanImagenUrl =
    rawImagenUrl !== undefined && rawImagenUrl !== null
      ? String(rawImagenUrl).trim()
      : '';

  if (list.length === 0 && cleanImagenUrl) {
    return [cleanImagenUrl];
  }

  return list;
}

function formatProducto(row) {
  const imagenes = normalizeImagenesForRead(row.imagenes, row.imagen_url);
  const imagenUrl =
    row.imagen_url && String(row.imagen_url).trim()
      ? String(row.imagen_url).trim()
      : imagenes[0] || '';

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
    imagen_url: imagenUrl,
    imagenes,
    etiquetas: row.etiquetas ?? '',
    destacado: Boolean(row.destacado),
    disponible: Boolean(row.disponible),
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
  };
}

function parseProductoPayload(body = {}, options = {}) {
  const { requirePrecio = false, fallbackCategoriaId = undefined } = options;

  const {
    categoria_id,
    codigo,
    nombre,
    descripcion,
    precio,
    precio_anterior,
    imagen_url,
    imagenes,
    etiquetas,
    destacado,
    disponible,
  } = body;

  if (!nombre || !String(nombre).trim()) {
    return { error: 'El nombre del producto es obligatorio.' };
  }

  if (
    requirePrecio &&
    (precio === undefined || precio === null || precio === '')
  ) {
    return { error: 'El precio es obligatorio y debe ser un número mayor o igual a 0.' };
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

  const rawCategoriaId =
    categoria_id !== undefined && categoria_id !== null && categoria_id !== ''
      ? categoria_id
      : fallbackCategoriaId;

  let parsedCategoriaId = null;
  if (
    rawCategoriaId !== undefined &&
    rawCategoriaId !== null &&
    rawCategoriaId !== ''
  ) {
    parsedCategoriaId = Number(rawCategoriaId);
    if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
      return { error: 'La categoría seleccionada no es válida.' };
    }
  }

  if (
    imagenes !== undefined &&
    imagenes !== null &&
    !Array.isArray(imagenes)
  ) {
    return { error: 'El campo imagenes debe ser un arreglo de URLs.' };
  }

  const normalizedMedia = normalizeImagenesForWrite(imagenes, imagen_url);

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
      imagen_url: normalizedMedia.imagen_url,
      imagenes: normalizedMedia.imagenes,
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
        imagen_url, imagenes, etiquetas, destacado, disponible
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
      RETURNING id`,
      [
        data.categoria_id,
        data.codigo,
        data.nombre,
        data.descripcion,
        data.precio,
        data.precio_anterior,
        data.imagen_url,
        JSON.stringify(data.imagenes),
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

async function createProductosBulk(req, res, next) {
  const { categoria_id: rootCategoriaId, productos } = req.body || {};

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      message: 'Debes enviar un arreglo no vacío en el campo "productos".',
    });
  }

  // Validar categoria_id raíz si fue proporcionada
  if (
    rootCategoriaId !== undefined &&
    rootCategoriaId !== null &&
    rootCategoriaId !== ''
  ) {
    const parsedRootCat = Number(rootCategoriaId);
    if (!Number.isInteger(parsedRootCat) || parsedRootCat <= 0) {
      return res.status(400).json({
        message: 'La categoría seleccionada no es válida.',
      });
    }
  }

  // Validar todos los items antes de abrir transacción
  const parsedItems = [];
  for (let i = 0; i < productos.length; i += 1) {
    const item = productos[i];
    if (!item || typeof item !== 'object') {
      return res.status(400).json({
        message: `Producto #${i + 1}: formato inválido.`,
      });
    }

    const { data, error } = parseProductoPayload(item, {
      requirePrecio: true,
      fallbackCategoriaId: rootCategoriaId,
    });

    if (error) {
      return res.status(400).json({
        message: `Producto #${i + 1}: ${error}`,
      });
    }

    parsedItems.push(data);
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const insertedIds = [];
    for (const data of parsedItems) {
      const { rows } = await client.query(
        `INSERT INTO productos (
          categoria_id, codigo, nombre, descripcion, precio, precio_anterior,
          imagen_url, imagenes, etiquetas, destacado, disponible
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
        RETURNING id`,
        [
          data.categoria_id,
          data.codigo,
          data.nombre,
          data.descripcion,
          data.precio,
          data.precio_anterior,
          data.imagen_url,
          JSON.stringify(data.imagenes),
          data.etiquetas,
          data.destacado,
          data.disponible,
        ]
      );
      insertedIds.push(rows[0].id);
    }

    const { rows: fullRows } = await client.query(
      `${PRODUCTO_SELECT}
       WHERE p.id = ANY($1::int[])
       ORDER BY array_position($1::int[], p.id)`,
      [insertedIds]
    );

    await client.query('COMMIT');

    const productosInsertados = fullRows.map(formatProducto);
    return res.status(201).json({
      creados: productosInsertados.length,
      productos: productosInsertados,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') {
      return res.status(400).json({
        message: 'La categoría seleccionada no existe.',
      });
    }
    return next(err);
  } finally {
    client.release();
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
           imagenes = $8::jsonb,
           etiquetas = $9,
           destacado = $10,
           disponible = $11,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $12`,
      [
        data.categoria_id,
        data.codigo,
        data.nombre,
        data.descripcion,
        data.precio,
        data.precio_anterior,
        data.imagen_url,
        JSON.stringify(data.imagenes),
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
  createProductosBulk,
  updateProducto,
  deleteProducto,
};
