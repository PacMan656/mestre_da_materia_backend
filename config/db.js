
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'senha',
  database: 'mestre_da_materia',
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erro de conexão:', err.stack);
  } else {
    console.log('Conectado ao banco de dados MySQL com sucesso!');
    connection.release();
  }
});

module.exports = pool;
    