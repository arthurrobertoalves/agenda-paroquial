require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const db = require('./database/database');
const authRoutes = require('./routes/auth');
const eventosRoutes = require('./routes/eventos');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'agenda-paroquial-secret-key-change-in-production';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PRODUCTION,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE
  }
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const isAuthenticated = req.session?.user ? 'Autenticado' : 'Não autenticado';
    console.log(`[${req.method}] ${req.path} - Sessão: ${isAuthenticated}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventosRoutes);

app.get('/', (req, res) => {
  const user = req.session?.user;
  
  if (!user) {
    return res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
  }

  const dashboardFile = user.tipo === 'paroquiano' ? 'paroquiano.html' : 'fiel.html';
  res.sendFile(path.join(__dirname, '../frontend', dashboardFile));
});

app.get('/login', (req, res) => {
  if (req.session?.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

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
