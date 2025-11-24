const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./database/database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'agenda-paroquial-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));


app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[${req.method}] ${req.path} - Sessão:`, req.session?.user ? 'Autenticado' : 'Não autenticado');
  }
  next();
});

app.use(express.static('public'));

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
};

// Middleware para verificar se é paroquiano
const requireParoquiano = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.tipo === 'paroquiano') {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado. Apenas paroquianos podem realizar esta ação.' });
};

// Rotas de autenticação
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Rotas da API de eventos
const eventosRoutes = require('./routes/eventos');
app.use('/api/eventos', eventosRoutes);

// Rotas de páginas
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.tipo === 'paroquiano') {
      return res.sendFile(path.join(__dirname, 'public', 'paroquiano.html'));
    } else {
      return res.sendFile(path.join(__dirname, 'public', 'fiel.html'));
    }
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Inicializar banco de dados e iniciar servidor
async function startServer() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();
