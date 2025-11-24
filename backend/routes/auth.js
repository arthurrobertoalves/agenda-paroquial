const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/database');

const router = express.Router();
const SALT_ROUNDS = 10;
const USER_TYPES = ['fiel', 'paroquiano'];

const validateUserType = (tipo) => {
  return USER_TYPES.includes(tipo);
};

const createUserSession = (user) => {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    igreja: user.igreja
  };
};

router.post('/register', async (req, res) => {
  const { nome, email, senha, tipo, igreja } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ error: 'Nome, email, senha e tipo são obrigatórios' });
  }

  if (!validateUserType(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser "fiel" ou "paroquiano"' });
  }

  try {
    const pool = db.getDb();
    const [existingUsers] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, tipo, igreja) VALUES (?, ?, ?, ?, ?)',
      [nome, email, hashedPassword, tipo, igreja || null]
    );

    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao processar registro' });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const pool = db.getDb();
    const [users] = await pool.query(
      'SELECT id, nome, email, senha, tipo, igreja FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(senha, user.senha);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    req.session.user = createUserSession(user);

    res.json({ 
      message: 'Login realizado com sucesso',
      user: createUserSession(user)
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

router.get('/me', (req, res) => {
  if (req.session?.user) {
    return res.json({ user: req.session.user });
  }
  res.status(401).json({ error: 'Não autenticado' });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

module.exports = router;
