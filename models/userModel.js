
const pool = require('../config/db');

const getUsers = async () => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM users', (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

const createUser = async (nome, email, senha) => {
  return new Promise((resolve, reject) => {
    pool.query(
      'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senha],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};

module.exports = { getUsers, createUser };
    