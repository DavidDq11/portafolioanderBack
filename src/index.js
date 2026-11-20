require('dotenv').config();

const app = require('./app');
const { pool } = require('./config/db');
const { initDb } = require('./config/initDb');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await initDb();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

startServer();
