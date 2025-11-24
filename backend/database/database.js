require('dotenv').config();

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agenda_paroquial',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const DB_NAME = process.env.DB_NAME || 'agenda_paroquial';

let pool = null;

const init = async () => {
  try {
    pool = mysql.createPool(DB_CONFIG);

    const connection = await pool.getConnection();
    console.log('Conectado ao banco de dados MySQL');
    connection.release();

    await createDatabaseIfNotExists();
    await createTables();

    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
};

const createDatabaseIfNotExists = async () => {
  try {
    const tempPool = mysql.createPool({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      waitForConnections: true,
      connectionLimit: 1
    });

    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await tempPool.end();
    console.log(`Banco de dados '${DB_NAME}' verificado/criado`);
  } catch (error) {
    console.error('Erro ao criar banco de dados:', error);
  }
};

const createTables = async () => {
  try {
    const usuariosTable = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        tipo ENUM('fiel', 'paroquiano') NOT NULL,
        igreja VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await pool.query(usuariosTable);
    console.log('Tabela de usuários criada/verificada com sucesso');

    const eventosTable = `
      CREATE TABLE IF NOT EXISTS eventos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        data_evento DATE NOT NULL,
        hora_evento TIME,
        tipo_evento VARCHAR(100),
        local_evento VARCHAR(255),
        responsavel VARCHAR(255),
        observacoes TEXT,
        igreja VARCHAR(255),
        usuario_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await pool.query(eventosTable);
    console.log('Tabela de eventos criada/verificada com sucesso');

    await addMissingColumns();
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  }
};

const addMissingColumns = async () => {
  try {
    const [igrejaColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'eventos' 
      AND COLUMN_NAME = 'igreja'
    `, [DB_NAME]);

    if (igrejaColumns.length === 0) {
      await pool.query('ALTER TABLE eventos ADD COLUMN igreja VARCHAR(255)');
      console.log('Coluna igreja adicionada à tabela eventos');
    }

    const [usuarioIdColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'eventos' 
      AND COLUMN_NAME = 'usuario_id'
    `, [DB_NAME]);

    if (usuarioIdColumns.length === 0) {
      await pool.query('ALTER TABLE eventos ADD COLUMN usuario_id INT');
      await pool.query('ALTER TABLE eventos ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL');
      console.log('Coluna usuario_id adicionada à tabela eventos');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar colunas:', error);
  }
};

const getDb = () => {
  if (!pool) {
    throw new Error('Banco de dados não inicializado');
  }
  return pool;
};

const close = async () => {
  if (pool) {
    await pool.end();
    console.log('Conexão com banco de dados fechada');
  }
};

module.exports = {
  init,
  getDb,
  close
};
