const API_URL = 'http://localhost:3000/api/auth';
const MIN_PASSWORD_LENGTH = 6;
const SUCCESS_DELAY = 1500;

const loginTab = document.querySelector('[data-tab="login"]');
const registerTab = document.querySelector('[data-tab="register"]');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

const SUCCESS_STYLES = {
  background: '#f0fdf4',
  borderColor: '#86efac',
  color: '#10b981'
};

checkAuth();

loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);

function switchTab(tab) {
  const isLogin = tab === 'login';
  
  loginTab.classList.toggle('active', isLogin);
  registerTab.classList.toggle('active', !isLogin);
  loginForm.classList.toggle('active', isLogin);
  registerForm.classList.toggle('active', !isLogin);
  
  clearErrors();
}

async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = '/';
    } else {
      showError(loginError, data.error || 'Erro ao fazer login');
    }
  } catch (error) {
    showError(loginError, 'Erro ao conectar com o servidor');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearErrors();

  const nome = document.getElementById('register-nome').value;
  const email = document.getElementById('register-email').value;
  const senha = document.getElementById('register-senha').value;
  const tipo = document.getElementById('register-tipo').value;
  const igreja = document.getElementById('register-igreja').value;

  if (!nome || !email || !senha || !tipo) {
    showError(registerError, 'Preencha todos os campos obrigatórios');
    return;
  }

  if (senha.length < MIN_PASSWORD_LENGTH) {
    showError(registerError, `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, email, senha, tipo, igreja })
    });

    const data = await response.json();

    if (response.ok) {
      showError(registerError, 'Cadastro realizado! Faça login para continuar.', 'success');
      setTimeout(() => {
        switchTab('login');
        document.getElementById('login-email').value = email;
      }, SUCCESS_DELAY);
    } else {
      showError(registerError, data.error || 'Erro ao cadastrar');
    }
  } catch (error) {
    showError(registerError, 'Erro ao conectar com o servidor');
  }
}

function showError(element, message, type = 'error') {
  element.textContent = message;
  element.classList.add('show');
  
  if (type === 'success') {
    Object.assign(element.style, SUCCESS_STYLES);
  }
}

function clearErrors() {
  [loginError, registerError].forEach(errorEl => {
    errorEl.classList.remove('show');
    errorEl.style.background = '';
    errorEl.style.borderColor = '';
    errorEl.style.color = '';
  });
}

async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/me`, {
      credentials: 'include'
    });

    if (response.ok) {
      window.location.href = '/';
    }
  } catch (error) {
  }
}
