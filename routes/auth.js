const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/database');

// POST - Registrar novo usuário
router.post('/register', async (req, res) => {
  const { nome, email, senha, tipo, igreja } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ error: 'Nome, email, senha e tipo são obrigatórios' });
  }

  if (tipo !== 'fiel' && tipo !== 'paroquiano') {
    return res.status(400).json({ error: 'Tipo deve ser "fiel" ou "paroquiano"' });
  }

  try {
    // Verificar se email já existe
    const checkEmail = 'SELECT id FROM usuarios WHERE email = ?';
    db.getDb().get(checkEmail, [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (row) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(senha, 10);

      // Inserir usuário
      const sql = 'INSERT INTO usuarios (nome, email, senha, tipo, igreja) VALUES (?, ?, ?, ?, ?)';
      db.getDb().run(sql, [nome, email, hashedPassword, tipo, igreja || null], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
          message: 'Usuário criado com sucesso',
          userId: this.lastID
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar registro' });
  }
});

// POST - Login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const sql = 'SELECT id, nome, email, senha, tipo, igreja FROM usuarios WHERE email = ?';
  db.getDb().get(sql, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    try {
      const match = await bcrypt.compare(senha, user.senha);
      if (!match) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // Criar sessão
      req.session.user = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        igreja: user.igreja
      };

      res.json({ 
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo,
          igreja: user.igreja
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar login' });
    }
  });
});

// GET - Verificar sessão atual
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Não autenticado' });
  }
});

// POST - Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

module.exports = router;

