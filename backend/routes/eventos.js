const express = require('express');
const db = require('../database/database');

const router = express.Router();
const USER_TYPES = {
  FIEL: 'fiel',
  PAROQUIANO: 'paroquiano'
};

const requireAuth = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
};

const requireParoquiano = (req, res, next) => {
  const user = req.session?.user;
  if (user && user.tipo === USER_TYPES.PAROQUIANO) {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado. Apenas paroquianos podem realizar esta ação.' });
};

const buildEventosQuery = (user) => {
  if (user.tipo === USER_TYPES.FIEL) {
    if (!user.igreja) {
      return { sql: null, params: null };
    }
    return {
      sql: 'SELECT * FROM eventos WHERE igreja = ? ORDER BY data_evento ASC, hora_evento ASC',
      params: [user.igreja]
    };
  }
  return {
    sql: 'SELECT * FROM eventos ORDER BY data_evento ASC, hora_evento ASC',
    params: []
  };
};

const buildEventoByIdQuery = (user, id) => {
  if (user.tipo === USER_TYPES.FIEL) {
    if (!user.igreja) {
      return { sql: null, params: null };
    }
    return {
      sql: 'SELECT * FROM eventos WHERE id = ? AND igreja = ?',
      params: [id, user.igreja]
    };
  }
  return {
    sql: 'SELECT * FROM eventos WHERE id = ?',
    params: [id]
  };
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const query = buildEventosQuery(user);
    
    if (!query.sql) {
      return res.json({ eventos: [] });
    }

    const pool = db.getDb();
    const [rows] = await pool.query(query.sql, query.params);
    
    res.json({ eventos: rows || [] });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    const query = buildEventoByIdQuery(user, id);
    
    if (!query.sql) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const pool = db.getDb();
    const [rows] = await pool.query(query.sql, query.params);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    res.json({ evento: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', requireAuth, requireParoquiano, async (req, res) => {
  try {
    const user = req.session.user;
    const { titulo, descricao, data_evento, hora_evento, tipo_evento, local_evento, responsavel, observacoes } = req.body;

    if (!titulo || !data_evento) {
      return res.status(400).json({ error: 'Título e data são obrigatórios' });
    }

    const pool = db.getDb();
    const [result] = await pool.query(
      `INSERT INTO eventos (titulo, descricao, data_evento, hora_evento, tipo_evento, local_evento, responsavel, observacoes, igreja, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    res.status(201).json({ 
      message: 'Evento criado com sucesso',
      evento: {
        id: result.insertId,
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
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

router.put('/:id', requireAuth, requireParoquiano, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, data_evento, hora_evento, tipo_evento, local_evento, responsavel, observacoes } = req.body;

    if (!titulo || !data_evento) {
      return res.status(400).json({ error: 'Título e data são obrigatórios' });
    }

    const pool = db.getDb();
    const [result] = await pool.query(
      `UPDATE eventos 
       SET titulo = ?, descricao = ?, data_evento = ?, hora_evento = ?, tipo_evento = ?, local_evento = ?, responsavel = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [titulo, descricao || null, data_evento, hora_evento || null, tipo_evento || null, local_evento || null, responsavel || null, observacoes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    res.json({ 
      message: 'Evento atualizado com sucesso',
      changes: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

router.delete('/:id', requireAuth, requireParoquiano, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = db.getDb();
    
    const [result] = await pool.query('DELETE FROM eventos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    res.json({ 
      message: 'Evento deletado com sucesso',
      changes: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ error: 'Erro ao deletar evento' });
  }
});

module.exports = router;
