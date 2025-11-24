const API_URL = 'http://localhost:3000/api';

let eventos = [];

// Verificar autenticação e carregar dados
checkAuth();

// Event Listeners
document.getElementById('search-input').addEventListener('input', filtrarEventos);

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
        if (data.user.tipo !== 'fiel') {
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
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('Erro na resposta:', errorData);
            throw new Error(errorData.error || 'Erro ao carregar eventos');
        }

        const data = await response.json();
        eventos = data.eventos || [];
        exibirEventos(eventos);
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        document.getElementById('eventos-container').innerHTML = `
            <div class="empty-state">
                <p>Erro ao carregar eventos: ${error.message}</p>
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
    const termo = document.getElementById('search-input').value.toLowerCase().trim();

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

