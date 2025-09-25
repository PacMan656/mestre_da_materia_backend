
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const users = await userModel.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado!' });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Senha inválida!' });
    }

    const token = jwt.sign({ id: user.id, nome: user.nome }, 'segredo', {
      expiresIn: '1h',
    });

    res.json({ message: 'Login bem-sucedido!', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login };
    