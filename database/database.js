const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'agenda_paroquial.db');

let db = null;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        reject(err);
        return;
      }
      console.log('Conectado ao banco de dados SQLite');
      createTables();
      resolve();
    });
  });
};

const createTables = () => {
  // Tabela de usuários
  const usuariosSql = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('fiel', 'paroquiano')),
      igreja TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(usuariosSql, (err) => {
    if (err) {
      console.error('Erro ao criar tabela de usuários:', err);
    } else {
      console.log('Tabela de usuários criada/verificada com sucesso');
    }
  });

  // Tabela de eventos
  const eventosSql = `
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      data_evento DATE NOT NULL,
      hora_evento TIME,
      tipo_evento TEXT,
      local_evento TEXT,
      responsavel TEXT,
      observacoes TEXT,
      igreja TEXT,
      usuario_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `;

  db.run(eventosSql, (err) => {
    if (err) {
      console.error('Erro ao criar tabela de eventos:', err);
    } else {
      console.log('Tabela de eventos criada/verificada com sucesso');
      // Adicionar colunas que podem não existir em bancos antigos
      addMissingColumns();
    }
  });
};

const addMissingColumns = () => {
  // Verificar e adicionar coluna igreja se não existir
  const checkIgreja = "SELECT COUNT(*) as count FROM pragma_table_info('eventos') WHERE name='igreja'";
  db.get(checkIgreja, [], (err, row) => {
    if (err) {
      console.error('Erro ao verificar coluna igreja:', err);
      return;
    }
    if (row.count === 0) {
      console.log('Adicionando coluna igreja à tabela eventos...');
      db.run('ALTER TABLE eventos ADD COLUMN igreja TEXT', (err) => {
        if (err) {
          console.error('Erro ao adicionar coluna igreja:', err);
        } else {
          console.log('Coluna igreja adicionada com sucesso');
        }
      });
    }
  });

  // Verificar e adicionar coluna usuario_id se não existir
  const checkUsuarioId = "SELECT COUNT(*) as count FROM pragma_table_info('eventos') WHERE name='usuario_id'";
  db.get(checkUsuarioId, [], (err, row) => {
    if (err) {
      console.error('Erro ao verificar coluna usuario_id:', err);
      return;
    }
    if (row.count === 0) {
      console.log('Adicionando coluna usuario_id à tabela eventos...');
      db.run('ALTER TABLE eventos ADD COLUMN usuario_id INTEGER', (err) => {
        if (err) {
          console.error('Erro ao adicionar coluna usuario_id:', err);
        } else {
          console.log('Coluna usuario_id adicionada com sucesso');
        }
      });
    }
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Banco de dados não inicializado');
  }
  return db;
};

const close = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Conexão com banco de dados fechada');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  init,
  getDb,
  close
};

