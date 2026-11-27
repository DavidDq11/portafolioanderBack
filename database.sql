-- ============================================================================
-- ESQUEMA DE BASE DE DATOS: CATÁLOGO DE PRODUCTOS (PostgreSQL / Neon.tech)
-- ============================================================================

-- 1. Tabla de Usuarios (Administrador del panel)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Categorías (Ej: Camisetas, Electrodomésticos, Calzado, Hogar...)
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50) DEFAULT 'tag', -- Nombre de icono o emoji opcional
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Productos (Catálogo de exhibición, sin manejo complejo de inventario)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    codigo VARCHAR(50),                      -- SKU o referencia opcional (ej: CAM-001)
    nombre VARCHAR(180) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
    precio_anterior NUMERIC(12, 2),          -- Opcional: para mostrar descuento/oferta
    imagen_url TEXT,                         -- URL directa de la imagen alojada en línea (https://...)
    imagenes JSONB DEFAULT '[]'::jsonb,      -- Arreglo JSON de URLs de imágenes del producto
    etiquetas VARCHAR(255),                  -- Ej: "Nuevo, Algodón, Garantía 1 año"
    destacado BOOLEAN DEFAULT FALSE,         -- Para resaltar en la parte superior del catálogo
    disponible BOOLEAN DEFAULT TRUE,         -- Si está visible/disponible para los clientes
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda y filtrado rápido
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_disponible ON productos(disponible);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);

-- ============================================================================
-- DATOS SEMILLA INICIALES (Categorías de ejemplo)
-- ============================================================================
INSERT INTO categorias (nombre, descripcion, icono, orden, activo)
VALUES
    ('Camisetas y Moda', 'Prendas de vestir, camisetas oversize, polos y moda casual', 'shirt', 1, TRUE),
    ('Electrodomésticos', 'Artículos prácticos para la cocina y el hogar moderno', 'tv', 2, TRUE),
    ('Tecnología y Audio', 'Accesorios electrónicos, audífonos, parlantes y gadgets', 'headphones', 3, TRUE),
    ('Hogar y Decoración', 'Elementos decorativos, iluminación y organización', 'home', 4, TRUE)
ON CONFLICT (nombre) DO NOTHING;

