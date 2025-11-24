const API_URL = 'http://localhost:3000/api';

let eventos = [];
let editandoId = null;

// Verificar autenticação e carregar dados
checkAuth();

// Event Listeners
const form = document.getElementById('evento-form');
const searchInput = document.getElementById('search-input');
const cancelBtn = document.getElementById('cancel-btn');

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', cancelarEdicao);
searchInput.addEventListener('input', filtrarEventos);

async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = '/login';
            return;
        }

        const data = await response.json();
        if (data.user.tipo !== 'paroquiano') {
            window.location.href = '/';
            return;
        }

        document.getElementById('user-name').textContent = data.user.nome;
        carregarEventos();
    } catch (error) {
        window.location.href = '/login';
    }
}

async function carregarEventos() {
    try {
        document.getElementById('eventos-container').innerHTML = '<div class="loading">Carregando eventos...</div>';

        const response = await fetch(`${API_URL}/eventos`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar eventos');
        }

        const data = await response.json();
        eventos = data.eventos || [];
        exibirEventos(eventos);
    } catch (error) {
        document.getElementById('eventos-container').innerHTML = `
            <div class="empty-state">
                <p>Erro ao carregar eventos</p>
            </div>
        `;
    }
}

function exibirEventos(eventosParaExibir) {
    const container = document.getElementById('eventos-container');

    if (eventosParaExibir.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum evento cadastrado ainda.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = eventosParaExibir.map(evento => criarCardEvento(evento)).join('');

    // Adicionar event listeners
    document.querySelectorAll('.btn-warning').forEach(btn => {
        btn.addEventListener('click', () => editarEvento(btn.dataset.id));
    });

    document.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', () => deletarEvento(btn.dataset.id));
    });
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
                <div class="evento-actions">
                    <button class="btn btn-warning" data-id="${evento.id}">Editar</button>
                    <button class="btn btn-danger" data-id="${evento.id}">Excluir</button>
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

async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        titulo: document.getElementById('titulo').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        data_evento: document.getElementById('data_evento').value,
        hora_evento: document.getElementById('hora_evento').value,
        tipo_evento: document.getElementById('tipo_evento').value,
        local_evento: document.getElementById('local_evento').value.trim(),
        responsavel: document.getElementById('responsavel').value.trim(),
        observacoes: document.getElementById('observacoes').value.trim()
    };

    if (!formData.titulo || !formData.data_evento) {
        alert('Título e data são obrigatórios!');
        return;
    }

    try {
        const url = editandoId ? `${API_URL}/eventos/${editandoId}` : `${API_URL}/eventos`;
        const method = editandoId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            alert(editandoId ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
            form.reset();
            cancelarEdicao();
            carregarEventos();
        } else {
            alert('Erro: ' + (data.error || 'Erro ao salvar evento'));
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
    }
}

async function editarEvento(id) {
    try {
        const response = await fetch(`${API_URL}/eventos/${id}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar evento');
        }

        const data = await response.json();
        const evento = data.evento;

        editandoId = evento.id;
        document.getElementById('evento-id').value = evento.id;
        document.getElementById('titulo').value = evento.titulo || '';
        document.getElementById('descricao').value = evento.descricao || '';
        document.getElementById('data_evento').value = evento.data_evento || '';
        document.getElementById('hora_evento').value = evento.hora_evento || '';
        document.getElementById('tipo_evento').value = evento.tipo_evento || '';
        document.getElementById('local_evento').value = evento.local_evento || '';
        document.getElementById('responsavel').value = evento.responsavel || '';
        document.getElementById('observacoes').value = evento.observacoes || '';

        document.getElementById('form-title').textContent = 'Editar Evento';
        document.getElementById('submit-btn').textContent = 'Atualizar';
        cancelBtn.style.display = 'block';

        document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert('Erro ao carregar evento para edição');
    }
}

async function deletarEvento(id) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/eventos/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            alert('Evento excluído com sucesso!');
            carregarEventos();
        } else {
            alert('Erro: ' + (data.error || 'Erro ao excluir evento'));
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
    }
}

function cancelarEdicao() {
    editandoId = null;
    form.reset();
    document.getElementById('form-title').textContent = 'Novo Evento';
    document.getElementById('submit-btn').textContent = 'Salvar';
    cancelBtn.style.display = 'none';
}

function filtrarEventos() {
    const termo = searchInput.value.toLowerCase().trim();

    if (!termo) {
        exibirEventos(eventos);
        return;
    }

    const eventosFiltrados = eventos.filter(evento => {
        return (
            evento.titulo.toLowerCase().includes(termo) ||
            (evento.descricao && evento.descricao.toLowerCase().includes(termo)) ||
            (evento.tipo_evento && evento.tipo_evento.toLowerCase().includes(termo)) ||
            (evento.local_evento && evento.local_evento.toLowerCase().includes(termo)) ||
            (evento.responsavel && evento.responsavel.toLowerCase().includes(termo))
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

