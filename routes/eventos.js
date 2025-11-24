const express = require('express');
const router = express.Router();
const db = require('../database/database');

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  console.log('Requisição não autenticada. Sessão:', req.session);
  res.status(401).json({ error: 'Não autenticado' });
};

// Middleware para verificar se é paroquiano
const requireParoquiano = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.tipo === 'paroquiano') {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado. Apenas paroquianos podem realizar esta ação.' });
};

// GET - Listar eventos (filtrado por igreja para fieis)
router.get('/', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    let sql, params;

    if (user.tipo === 'fiel') {
      // Fiel vê apenas eventos da sua igreja
      if (!user.igreja) {
        // Se não tem igreja, retorna array vazio
        return res.json({ eventos: [] });
      }
      sql = 'SELECT * FROM eventos WHERE igreja = ? ORDER BY data_evento ASC, hora_evento ASC';
      params = [user.igreja];
    } else {
      // Paroquiano vê todos os eventos
      sql = 'SELECT * FROM eventos ORDER BY data_evento ASC, hora_evento ASC';
      params = [];
    }

    const database = db.getDb();
    if (!database) {
      console.error('Banco de dados não inicializado');
      return res.status(500).json({ error: 'Banco de dados não disponível' });
    }

    database.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Erro ao buscar eventos:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ eventos: rows || [] });
    });
  } catch (error) {
    console.error('Erro na rota de eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Buscar evento por ID
router.get('/:id', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const id = req.params.id;
    let sql, params;

    if (user.tipo === 'fiel') {
      if (!user.igreja) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      sql = 'SELECT * FROM eventos WHERE id = ? AND igreja = ?';
      params = [id, user.igreja];
    } else {
      sql = 'SELECT * FROM eventos WHERE id = ?';
      params = [id];
    }

    db.getDb().get(sql, params, (err, row) => {
      if (err) {
        console.error('Erro ao buscar evento:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      res.json({ evento: row });
    });
  } catch (error) {
    console.error('Erro na rota de eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar novo evento (apenas paroquianos)
router.post('/', requireAuth, requireParoquiano, (req, res) => {
  const user = req.session.user;
  const { titulo, descricao, data_evento, hora_evento, tipo_evento, local_evento, responsavel, observacoes } = req.body;

  if (!titulo || !data_evento) {
    res.status(400).json({ error: 'Título e data são obrigatórios' });
    return;
  }

  const sql = `
    INSERT INTO eventos (titulo, descricao, data_evento, hora_evento, tipo_evento, local_evento, responsavel, observacoes, igreja, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.getDb().run(sql, [
    titulo, 
    descricao || null, 
    data_evento, 
    hora_evento || null, 
    tipo_evento || null, 
    local_evento || null, 
    responsavel || null, 
    observacoes || null,
    user.igreja || null,
    user.id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      message: 'Evento criado com sucesso',
      evento: {
        id: this.lastID,
        titulo,
        descricao,
        data_evento,
        hora_evento,
        tipo_evento,
        local_evento,
        responsavel,
        observacoes
      }
    });
  });
});

// PUT - Atualizar evento (apenas paroquianos)
router.put('/:id', requireAuth, requireParoquiano, (req, res) => {
  const id = req.params.id;
  const { titulo, descricao, data_evento, hora_evento, tipo_evento, local_evento, responsavel, observacoes } = req.body;

  if (!titulo || !data_evento) {
    res.status(400).json({ error: 'Título e data são obrigatórios' });
    return;
  }

  const sql = `
    UPDATE eventos 
    SET titulo = ?, descricao = ?, data_evento = ?, hora_evento = ?, tipo_evento = ?, local_evento = ?, responsavel = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.getDb().run(sql, [titulo, descricao || null, data_evento, hora_evento || null, tipo_evento || null, local_evento || null, responsavel || null, observacoes || null, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Evento não encontrado' });
      return;
    }
    res.json({ 
      message: 'Evento atualizado com sucesso',
      changes: this.changes
    });
  });
});

// DELETE - Deletar evento (apenas paroquianos)
router.delete('/:id', requireAuth, requireParoquiano, (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM eventos WHERE id = ?';

  db.getDb().run(sql, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Evento não encontrado' });
      return;
    }
    res.json({ 
      message: 'Evento deletado com sucesso',
      changes: this.changes
    });
  });
});

module.exports = router;
