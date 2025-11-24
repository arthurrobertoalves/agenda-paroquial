const API_URL = 'http://localhost:3000/api/auth';

// Elementos do DOM
const loginTab = document.querySelector('[data-tab="login"]');
const registerTab = document.querySelector('[data-tab="register"]');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

// Verificar se já está logado
checkAuth();

// Event Listeners
loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);

function switchTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        clearErrors();
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        clearErrors();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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

    if (senha.length < 6) {
        showError(registerError, 'A senha deve ter no mínimo 6 caracteres');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ nome, email, senha, tipo, igreja })
        });

        const data = await response.json();

        if (response.ok) {
            showError(registerError, 'Cadastro realizado! Faça login para continuar.', 'success');
            setTimeout(() => {
                switchTab('login');
                document.getElementById('login-email').value = email;
            }, 1500);
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
        element.style.background = '#f0fdf4';
        element.style.borderColor = '#86efac';
        element.style.color = '#10b981';
    }
}

function clearErrors() {
    loginError.classList.remove('show');
    registerError.classList.remove('show');
    loginError.style.background = '';
    loginError.style.borderColor = '';
    loginError.style.color = '';
    registerError.style.background = '';
    registerError.style.borderColor = '';
    registerError.style.color = '';
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
        // Não autenticado, continuar na página de login
    }
}

