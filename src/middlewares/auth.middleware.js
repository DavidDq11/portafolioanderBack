const jwt = require('jsonwebtoken');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'catalogo_digital_dev_secret_change_in_prod';
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Acceso no autorizado. Token requerido.',
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: 'Acceso no autorizado. Token vacío.',
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: 'Sesión expirada o token inválido. Inicia sesión nuevamente.',
    });
  }
}

module.exports = { authMiddleware, getJwtSecret };
