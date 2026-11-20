# Prompt para crear el Backend (`portafolio-back`)

Copia y pega todo el bloque de abajo cuando abras la carpeta `C:\Users\David\OneDrive\Documentos\2026\portafolio-back` en una nueva ventana:

---

```text
Necesito que construyas desde cero el backend completo en Node.js + Express + PostgreSQL (Neon.tech) para un sistema de Catálogo de Productos ("Portafolio / Catálogo Digital"), listo para desplegar en Render y conectarse con un frontend en Angular 17 (desplegado en Vercel) que ya está creado en `../portafolio-front`.

Revisa el archivo `database.sql` que ya está en la raíz de esta carpeta para respetar exactamente los nombres de tablas y columnas.

### 1. Stack Tecnológico y Configuración
- **Runtime**: Node.js con Express.
- **Base de Datos**: PostgreSQL en Neon.tech usando `pg` (`Pool` con `ssl: { rejectUnauthorized: false }` cuando `DATABASE_URL` sea de Neon/producción).
- **Seguridad y Middlewares**:
  - `cors` habilitado para permitir peticiones desde `http://localhost:4200` y dominios `.vercel.app` (o `origin: '*'`).
  - `express.json()` y `express.urlencoded({ extended: true })` (las imágenes de los productos se manejan mediante enlaces URL directos en el campo `imagen_url`).
  - `bcryptjs` para hashear contraseñas y `jsonwebtoken` para autenticación JWT del administrador.
  - `dotenv` para variables de entorno (`PORT`, `DATABASE_URL`, `JWT_SECRET`).

### 2. Inicialización Automática (Seed al arrancar)
Al iniciar el servidor (`src/config/initDb.js` o en `index.js`), el backend debe:
1. Ejecutar las sentencias `CREATE TABLE IF NOT EXISTS` de `database.sql` (`usuarios`, `categorias`, `productos` e índices).
2. Verificar si existe algún usuario en `usuarios`; si está vacía, crear automáticamente el administrador por defecto:
   - **Nombre**: `Administrador`
   - **Email**: `admin@catalogo.com`
   - **Password**: `admin123` (hasheado con bcrypt)
3. Verificar si existen categorías en `categorias`; si está vacía, insertar las categorías iniciales (`Camisetas y Moda`, `Electrodomésticos`, `Tecnología y Audio`, `Hogar y Decoración`) y al menos 6 productos de ejemplo con imágenes reales de Unsplash (camisetas, cafetera/freidora de aire, audífonos, lámpara moderna, etc.) para que el catálogo se vea lleno desde el primer momento.

### 3. Contrato Exacto de Endpoints (API REST bajo `/api`)
El frontend en Angular consume exactamente estas rutas y estructuras JSON:

#### A. Salud y Estadísticas
- `GET /api/health` -> `{ ok: true, message: "API Catálogo funcionando" }`
- `GET /api/stats` -> Devuelve contadores rápidos:
  ```json
  {
    "totalProductos": 12,
    "productosDisponibles": 10,
    "productosDestacados": 4,
    "totalCategorias": 4
  }
  ```

#### B. Autenticación (`/api/auth`)
- `POST /api/auth/login`
  - Recibe: `{ "email": "admin@catalogo.com", "password": "admin123" }`
  - Responde `200 OK`:
    ```json
    {
      "token": "<JWT_TOKEN>",
      "usuario": {
        "id": 1,
        "nombre": "Administrador",
        "email": "admin@catalogo.com"
      }
    }
    ```

#### C. Categorías (`/api/categorias`)
- `GET /api/categorias` (Público)
  - Lista todas las categorías ordenadas por `orden ASC, id ASC`, incluyendo la cantidad de productos asociados (`total_productos`) mediante un `LEFT JOIN` con `productos`:
    ```sql
    SELECT c.*, COUNT(p.id)::int AS total_productos
    FROM categorias c
    LEFT JOIN productos p ON p.categoria_id = c.id
    GROUP BY c.id
    ORDER BY c.orden ASC, c.id ASC
    ```
- `POST /api/categorias` (Protegido con JWT `Authorization: Bearer <token>`)
  - Crea una categoría con `{ nombre, descripcion, icono, orden, activo }` y devuelve la categoría creada.
- `PUT /api/categorias/:id` (Protegido con JWT)
  - Actualiza `{ nombre, descripcion, icono, orden, activo }` de la categoría y la devuelve.
- `DELETE /api/categorias/:id` (Protegido con JWT)
  - Elimina la categoría (los productos asociados quedan con `categoria_id = NULL` gracias a `ON DELETE SET NULL`).

#### D. Productos (`/api/productos`)
- `GET /api/productos` (Público)
  - Lista todos los productos haciendo `LEFT JOIN categorias c ON p.categoria_id = c.id` para incluir `categoria_nombre` y `categoria_icono`.
  - Ordenados por `p.destacado DESC, p.id DESC`.
  - Convierte `precio` y `precio_anterior` a número (`FLOAT`) o asegúrate de devolver todos los campos:
    `id, categoria_id, categoria_nombre, categoria_icono, codigo, nombre, descripcion, precio, precio_anterior, imagen_url, etiquetas, destacado, disponible, creado_en, actualizado_en`.
- `GET /api/productos/:id` (Público)
  - Devuelve el detalle de un producto por su `id` incluyendo `categoria_nombre`.
- `POST /api/productos` (Protegido con JWT)
  - Crea un producto recibiendo `{ categoria_id, codigo, nombre, descripcion, precio, precio_anterior, imagen_url, etiquetas, destacado, disponible }` y devuelve el producto recién creado con su `categoria_nombre`.
- `PUT /api/productos/:id` (Protegido con JWT)
  - Actualiza un producto existente, actualiza `actualizado_en = CURRENT_TIMESTAMP`, y devuelve el producto actualizado.
- `DELETE /api/productos/:id` (Protegido con JWT)
  - Elimina el producto por `id` y responde `{ message: "Producto eliminado correctamente" }`.

### 4. Entregables requeridos
1. Crea `package.json` con `"start": "node src/index.js"` y `"dev": "node --watch src/index.js"`.
2. Crea `.env.example` y `.gitignore`.
3. Crea toda la arquitectura limpia en `src/` (`src/config/db.js`, `src/config/initDb.js`, `src/middlewares/auth.middleware.js`, `src/routes/`, `src/controllers/`, `src/index.js`).
4. Instala las dependencias (`npm install`) y deja el servidor listo para probar con `npm run dev` en el puerto `3000`.
```

