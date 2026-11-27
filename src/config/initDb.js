const bcrypt = require('bcryptjs');
const db = require('./db');

const INITIAL_CATEGORIES = [
  {
    nombre: 'Camisetas y Moda',
    descripcion: 'Prendas de vestir, camisetas oversize, polos y moda casual',
    icono: 'shirt',
    orden: 1,
    activo: true,
  },
  {
    nombre: 'Electrodomésticos',
    descripcion: 'Artículos prácticos para la cocina y el hogar moderno',
    icono: 'tv',
    orden: 2,
    activo: true,
  },
  {
    nombre: 'Tecnología y Audio',
    descripcion: 'Accesorios electrónicos, audífonos, parlantes y gadgets',
    icono: 'headphones',
    orden: 3,
    activo: true,
  },
  {
    nombre: 'Hogar y Decoración',
    descripcion: 'Elementos decorativos, iluminación y organización',
    icono: 'home',
    orden: 4,
    activo: true,
  },
];

const INITIAL_PRODUCTS = [
  {
    categoriaNombre: 'Camisetas y Moda',
    codigo: 'CAM-001',
    nombre: 'Camiseta Oversize Heavyweight Negra',
    descripcion:
      'Camiseta 100% algodón peruano peinado de 240g, corte boxy relajado y cuello acanalado de alta durabilidad.',
    precio: 65000,
    precio_anterior: 85000,
    imagen_url:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    etiquetas: 'Algodón 240g, Oversize, Tallas S-XL',
    destacado: true,
    disponible: true,
  },
  {
    categoriaNombre: 'Electrodomésticos',
    codigo: 'ELE-104',
    nombre: 'Freidora de Aire Digital 5.5 Litros Inox',
    descripcion:
      'Panel táctil LED con 8 programas preestablecidos, canasta antiadherente libre de BPA y cocción sin aceite.',
    precio: 289000,
    precio_anterior: 350000,
    imagen_url:
      'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    etiquetas: '5.5 Litros, Digital, Garantía 1 Año',
    destacado: true,
    disponible: true,
  },
  {
    categoriaNombre: 'Camisetas y Moda',
    codigo: 'CAM-002',
    nombre: 'Camiseta Básica Essential Blanca',
    descripcion:
      'Diseño minimalista ideal para cualquier ocasión. Costuras reforzadas y tacto frío ultra suave.',
    precio: 55000,
    precio_anterior: null,
    imagen_url:
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    etiquetas: 'Básica, Algodón, Unisex',
    destacado: false,
    disponible: true,
  },
  {
    categoriaNombre: 'Electrodomésticos',
    codigo: 'ELE-205',
    nombre: 'Cafetera Espresso Italiana & Espumador',
    descripcion:
      'Bomba de presión de 15 bares para preparar espresso, cappuccino y latte con espuma cremosa en segundos.',
    precio: 420000,
    precio_anterior: 490000,
    imagen_url:
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
    etiquetas: '15 Bares, Acero Inox, Hogar',
    destacado: true,
    disponible: true,
  },
  {
    categoriaNombre: 'Tecnología y Audio',
    codigo: 'TEC-301',
    nombre: 'Audífonos Inalámbricos ANC Pro',
    descripcion:
      'Cancelación activa de ruido híbrida, hasta 40 horas de batería continua y carga rápida USB-C.',
    precio: 195000,
    precio_anterior: 240000,
    imagen_url:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    etiquetas: 'Bluetooth 5.3, ANC, 40h Batería',
    destacado: true,
    disponible: true,
  },
  {
    categoriaNombre: 'Electrodomésticos',
    codigo: 'ELE-310',
    nombre: 'Licuadora de Alta Potencia Vaso de Vidrio',
    descripcion:
      'Motor de 800W con cuchillas de acero inoxidable de 6 aspas para triturar hielo y preparar batidos perfectos.',
    precio: 175000,
    precio_anterior: null,
    imagen_url:
      'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
    etiquetas: '800W, Vaso Vidrio, 1.5L',
    destacado: false,
    disponible: true,
  },
  {
    categoriaNombre: 'Camisetas y Moda',
    codigo: 'CAM-009',
    nombre: 'Polo Clásico Piqué Azul Navy',
    descripcion:
      'Tejido piqué transpirable con cuello tejido y botones nacarados. Corte slim moderno.',
    precio: 78000,
    precio_anterior: 95000,
    imagen_url:
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
    etiquetas: 'Polo, Slim Fit, Elegante',
    destacado: false,
    disponible: true,
  },
  {
    categoriaNombre: 'Hogar y Decoración',
    codigo: 'HOG-401',
    nombre: 'Lámpara Nórdica de Escritorio LED',
    descripcion:
      'Iluminación cálida y neutra regulable en 3 niveles con acabado mate minimalista.',
    precio: 110000,
    precio_anterior: null,
    imagen_url:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    etiquetas: 'LED, Dimerizable, Nórdica',
    destacado: false,
    disponible: true,
  },
];

async function initDb() {
  if (
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes('PEGA_AQUI_TU_CONEXION')
  ) {
    throw new Error(
      'Falta configurar DATABASE_URL en el archivo .env con tu cadena de conexión de Neon.tech.'
    );
  }

  // 1. Crear tablas e índices (esquema exacto de database.sql)
  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      activo BOOLEAN DEFAULT TRUE,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE,
      descripcion TEXT,
      icono VARCHAR(50) DEFAULT 'tag',
      activo BOOLEAN DEFAULT TRUE,
      orden INT DEFAULT 0,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
      codigo VARCHAR(50),
      nombre VARCHAR(180) NOT NULL,
      descripcion TEXT,
      precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
      precio_anterior NUMERIC(12, 2),
      imagen_url TEXT,
      imagenes JSONB DEFAULT '[]'::jsonb,
      etiquetas VARCHAR(255),
      destacado BOOLEAN DEFAULT FALSE,
      disponible BOOLEAN DEFAULT TRUE,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(
    `ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagenes JSONB DEFAULT '[]'::jsonb;`
  );

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);`
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_productos_disponible ON productos(disponible);`
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);`
  );

  // 2. Seed de usuario administrador por defecto si no existe ninguno
  const { rows: userCountRows } = await db.query(
    'SELECT COUNT(*)::int AS count FROM usuarios'
  );
  if (userCountRows[0].count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, activo)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador', 'admin@catalogo.com', passwordHash]
    );
    console.log('✅ Usuario administrador inicial creado: admin@catalogo.com');
  }

  // 3. Seed de categorías iniciales si la tabla categorias está vacía
  const { rows: catCountRows } = await db.query(
    'SELECT COUNT(*)::int AS count FROM categorias'
  );
  if (catCountRows[0].count === 0) {
    for (const cat of INITIAL_CATEGORIES) {
      await db.query(
        `INSERT INTO categorias (nombre, descripcion, icono, orden, activo)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (nombre) DO NOTHING`,
        [cat.nombre, cat.descripcion, cat.icono, cat.orden, cat.activo]
      );
    }
    console.log(`✅ Categorías iniciales insertadas: ${INITIAL_CATEGORIES.length}`);
  }

  // 4. Seed de productos de ejemplo si la tabla productos está vacía
  const { rows: prodCountRows } = await db.query(
    'SELECT COUNT(*)::int AS count FROM productos'
  );
  if (prodCountRows[0].count === 0) {
    const { rows: existingCats } = await db.query(
      'SELECT id, nombre FROM categorias'
    );
    const categoryIdByName = Object.fromEntries(
      existingCats.map((c) => [c.nombre, c.id])
    );

    for (const prod of INITIAL_PRODUCTS) {
      const categoriaId = categoryIdByName[prod.categoriaNombre] || null;
      await db.query(
        `INSERT INTO productos (
          categoria_id, codigo, nombre, descripcion, precio, precio_anterior,
          imagen_url, imagenes, etiquetas, destacado, disponible
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)`,
        [
          categoriaId,
          prod.codigo,
          prod.nombre,
          prod.descripcion,
          prod.precio,
          prod.precio_anterior,
          prod.imagen_url,
          JSON.stringify(prod.imagen_url ? [prod.imagen_url] : []),
          prod.etiquetas,
          prod.destacado,
          prod.disponible,
        ]
      );
    }
    console.log(`✅ Productos de ejemplo insertados: ${INITIAL_PRODUCTS.length}`);
  }

  console.log('✅ Base de datos PostgreSQL (Neon.tech) verificada y lista');
}

module.exports = { initDb };
