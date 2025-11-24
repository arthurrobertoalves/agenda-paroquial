const API_URL = 'http://localhost:3000/api';
const USER_TYPE_FIEL = 'fiel';

let eventos = [];

const searchInput = document.getElementById('search-input');
const eventosContainer = document.getElementById('eventos-container');
const userNameElement = document.getElementById('user-name');

checkAuth();
searchInput.addEventListener('input', filtrarEventos);

async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include'
    });

    if (!response.ok) {
      redirectToLogin();
      return;
    }

    const data = await response.json();
    
    if (data.user.tipo !== USER_TYPE_FIEL) {
      window.location.href = '/';
      return;
    }

    userNameElement.textContent = data.user.nome;
    carregarEventos();
  } catch (error) {
    redirectToLogin();
  }
}

async function carregarEventos() {
  try {
    eventosContainer.innerHTML = '<div class="loading">Carregando eventos...</div>';

    const response = await fetch(`${API_URL}/eventos`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || 'Erro ao carregar eventos');
    }

    const data = await response.json();
    eventos = data.eventos || [];
    exibirEventos(eventos);
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    eventosContainer.innerHTML = `
      <div class="empty-state">
        <p>Erro ao carregar eventos: ${error.message}</p>
      </div>
    `;
  }
}

function exibirEventos(eventosParaExibir) {
  if (eventosParaExibir.length === 0) {
    eventosContainer.innerHTML = `
      <div class="empty-state">
        <p>Nenhum evento cadastrado ainda.</p>
      </div>
    `;
    return;
  }

  eventosContainer.innerHTML = eventosParaExibir.map(criarCardEvento).join('');
}

function criarCardEvento(evento) {
  const dataFormatada = formatarData(evento.data_evento);
  const horaFormatada = evento.hora_evento ? formatarHora(evento.hora_evento) : 'Não informada';

  return `
    <div class="evento-card">
      <div class="evento-header">
        <div>
          <div class="evento-titulo">${escapeHtml(evento.titulo)}</div>
          ${evento.tipo_evento ? `<div class="evento-tipo">${escapeHtml(evento.tipo_evento)}</div>` : ''}
        </div>
      </div>
      <div class="evento-info">
        <div class="info-item">
          <strong>Data:</strong> ${dataFormatada}
        </div>
        <div class="info-item">
          <strong>Hora:</strong> ${horaFormatada}
        </div>
        ${evento.local_evento ? `
        <div class="info-item">
          <strong>Local:</strong> ${escapeHtml(evento.local_evento)}
        </div>
        ` : ''}
        ${evento.responsavel ? `
        <div class="info-item">
          <strong>Responsável:</strong> ${escapeHtml(evento.responsavel)}
        </div>
        ` : ''}
      </div>
      ${evento.descricao ? `
      <div class="evento-descricao">
        ${escapeHtml(evento.descricao)}
      </div>
      ` : ''}
      ${evento.observacoes ? `
      <div class="evento-descricao" style="margin-top: 8px; font-style: italic; color: var(--text-light);">
        <strong>Observações:</strong> ${escapeHtml(evento.observacoes)}
      </div>
      ` : ''}
    </div>
  `;
}

function filtrarEventos() {
  const termo = searchInput.value.toLowerCase().trim();

  if (!termo) {
    exibirEventos(eventos);
    return;
  }

  const eventosFiltrados = eventos.filter(evento => {
    const searchableFields = [
      evento.titulo,
      evento.descricao,
      evento.tipo_evento,
      evento.local_evento,
      evento.responsavel
    ];

    return searchableFields.some(field => 
      field && field.toLowerCase().includes(termo)
    );
  });

  exibirEventos(eventosFiltrados);
}

function formatarData(data) {
  if (!data) return 'Não informada';
  const date = new Date(data + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

function formatarHora(hora) {
  if (!hora) return 'Não informada';
  return hora.substring(0, 5);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function redirectToLogin() {
  window.location.href = '/login';
}
