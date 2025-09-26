
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
  try {
    const users = await userModel.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createUser = async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    await userModel.createUser(nome, email, hashedPassword);
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, createUser };
    