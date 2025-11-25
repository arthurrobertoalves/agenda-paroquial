# 📅 Agenda Paroquial

Sistema profissional de gerenciamento de eventos paroquiais com autenticação e controle de acesso. Desenvolvido com HTML, CSS, JavaScript no frontend e Express.js no backend, utilizando MySQL como banco de dados.


## 🚀 Características

- 🔐 Sistema de autenticação com sessões
- 👥 Dois tipos de usuários: **Fiel** e **Paroquiano**
- ✅ CRUD completo para paroquianos
- 👀 Visualização de eventos para fieis
- 🎨 Design minimalista e profissional
- 🔍 Busca em tempo real
- 💾 Banco de dados MySQL
- 📱 Design responsivo para mobile
- 🎯 Código escalável e bem estruturado

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- MySQL (versão 5.7 ou superior, ou MariaDB 10.2+)
- npm (geralmente vem com Node.js)

## 🛠️ Instalação

1. Clone ou baixe o projeto

3. Instale as dependências do backend:
```bash
npm install
```

4. Certifique-se de que o MySQL está rodando e que o usuário tem permissões para criar bancos de dados

## ▶️ Como Executar

1. Inicie o servidor backend:
```bash
npm start
```

Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

2. Acesse no navegador:
```
http://localhost:3000
```

3. **Primeiro acesso**: Crie uma conta (Fiel ou Paroquiano) na página de login

## 👥 Tipos de Usuários

### Fiel
- Visualiza eventos da sua igreja
- Busca eventos
- Não pode criar, editar ou excluir eventos

### Paroquiano
- Visualiza todos os eventos
- Cria novos eventos
- Edita eventos existentes
- Exclui eventos
- Gerencia completamente a agenda

## 🔌 API Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Realizar login
- `GET /api/auth/me` - Verificar sessão atual
- `POST /api/auth/logout` - Realizar logout

### Eventos

- `GET /api/eventos` - Listar eventos (filtrado por igreja para fieis)
- `GET /api/eventos/:id` - Buscar evento por ID
- `POST /api/eventos` - Criar novo evento (apenas paroquianos)
- `PUT /api/eventos/:id` - Atualizar evento (apenas paroquianos)
- `DELETE /api/eventos/:id` - Deletar evento (apenas paroquianos)

## 🗄️ Banco de Dados

O sistema utiliza MySQL. O banco de dados e as tabelas são criados automaticamente na primeira execução.

### Estrutura das Tabelas

**Tabela de Usuários:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `nome` - VARCHAR(255) NOT NULL
- `email` - VARCHAR(255) UNIQUE NOT NULL
- `senha` - VARCHAR(255) NOT NULL (criptografada)
- `tipo` - ENUM('fiel', 'paroquiano') NOT NULL
- `igreja` - VARCHAR(255)
- `created_at` - DATETIME DEFAULT CURRENT_TIMESTAMP

**Tabela de Eventos:**
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `titulo` - VARCHAR(255) NOT NULL
- `descricao` - TEXT
- `data_evento` - DATE NOT NULL
- `hora_evento` - TIME
- `tipo_evento` - VARCHAR(100)
- `local_evento` - VARCHAR(255)
- `responsavel` - VARCHAR(255)
- `observacoes` - TEXT
- `igreja` - VARCHAR(255)
- `usuario_id` - INT (FOREIGN KEY)
- `created_at` - DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at` - DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## 🔒 Segurança

- Senhas são criptografadas com bcrypt
- Sessões seguras com express-session
- Controle de acesso baseado em tipo de usuário
- Validação de dados no backend
- Proteção contra SQL injection (usando prepared statements)
- Variáveis sensíveis em arquivo .env

## 📝 Licença

Este projeto é de código aberto e está disponível para uso livre.

---
