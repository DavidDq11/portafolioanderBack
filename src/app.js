const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const productosRoutes = require('./routes/productos.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

const extraOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Permitir peticiones sin origin (Postman, curl, health checks de Render)
    if (!origin) return callback(null, true);

    const isAllowedDefault =
      origin === 'http://localhost:4200' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.vercel.app');

    if (
      extraOrigins.length === 0 ||
      extraOrigins.includes('*') ||
      isAllowedDefault ||
      extraOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz (útil para health check de Render)
app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'portafolio-back',
    message: 'API Catálogo funcionando',
  });
});

// Salud de la API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'API Catálogo funcionando',
  });
});

// Rutas del contrato REST bajo /api
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/stats', statsRoutes);

// 404 para rutas no existentes
app.use((req, res) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador central de errores
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'El cuerpo de la petición contiene JSON inválido.',
    });
  }

  console.error('❌ Error en el servidor:', err);
  return res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor.',
  });
});

module.exports = app;
