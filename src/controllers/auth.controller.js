const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { getJwtSecret } = require('../middlewares/auth.middleware');

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: 'Debes ingresar correo electrónico y contraseña.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { rows } = await db.query(
      `SELECT id, nombre, email, password_hash, activo
       FROM usuarios
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Credenciales incorrectas.',
      });
    }

    const user = rows[0];

    if (user.activo === false) {
      return res.status(403).json({
        message: 'Tu cuenta de administrador está desactivada.',
      });
    }

    const passwordValid = await bcrypt.compare(
      String(password),
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: 'Credenciales incorrectas.',
      });
    }

    const usuario = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
    };

    const token = jwt.sign(usuario, getJwtSecret(), { expiresIn: '7d' });

    return res.status(200).json({
      token,
      usuario,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login };
