
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(403).json({ message: 'Token não fornecido!' });
  }

  try {
    const decoded = jwt.verify(token, 'segredo');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token inválido!' });
  }
};

module.exports = verifyToken;
    