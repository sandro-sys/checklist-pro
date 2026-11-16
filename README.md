# ✅ CheckList Pro

## Stack

**Frontend:** React · Vite  
**Backend:** Node.js · Express  
**Banco de dados:** PostgreSQL (produção) · SQLite (desenvolvimento)  
**Autenticação:** JWT com refresh token  
**Integrações:** Mercado Pago (pagamentos) · Resend (e-mail)  
**Deploy:** Render


Sistema de gestão de checklists operacionais para negócios. Ideal para restaurantes, lojas, escritórios e qualquer estabelecimento que precise padronizar e acompanhar processos.

![CheckList Pro](https://via.placeholder.com/800x400/1e293b/22c55e?text=CheckList+Pro)

## 🚀 Funcionalidades

- **📋 Checklists Personalizados**: Crie checklists para qualquer processo
  - Abertura/Fechamento de casa
  - Abertura/Fechamento de cozinha
  - Montagem/Fechamento de operação
  - E muito mais...

- **📱 QR Code**: Cada checklist gera um QR Code único para acesso rápido

- **📊 Dashboard**: Acompanhe estatísticas e taxa de conclusão

- **👥 Multi-usuários**: Adicione sua equipe e acompanhe quem executou cada checklist

- **🔒 Conformidade LGPD**: 
  - Consentimento explícito
  - Direito de exclusão
  - Logs de auditoria
  - Criptografia de dados sensíveis

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT para autenticação
- bcrypt para criptografia
- QRCode para geração de códigos

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Zustand (gerenciamento de estado)
- Lucide Icons

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd projeto-checklist
```

2. **Instale as dependências**
```bash
npm run install:all
```

3. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite conforme necessário
```

4. **Inicie o projeto**
```bash
npm run dev
```

O servidor backend rodará em `http://localhost:3001` e o frontend em `http://localhost:5173`.

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento (backend + frontend)
npm run dev

# Apenas backend
npm run server

# Apenas frontend
npm run client

# Build para produção
npm run build
```

## 📁 Estrutura do Projeto

```
projeto-checklist/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── layouts/       # Layouts de página
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # API e serviços
│   │   └── store/         # Estado global (Zustand)
│   └── public/
├── server/                 # Backend Node.js
│   ├── database/          # Configuração do banco
│   ├── middleware/        # Middlewares Express
│   └── routes/            # Rotas da API
├── data/                   # Banco de dados SQLite
└── package.json
```

## 🔐 Segurança

- Senhas criptografadas com bcrypt (12 rounds)
- Tokens JWT com expiração (15min access, 7d refresh)
- Rate limiting para proteção contra ataques
- Headers de segurança com Helmet
- CORS configurado
- Validação de entrada com validator.js

## 📱 Como Usar

### 1. Cadastro
- Acesse a aplicação e crie uma conta
- Aceite os termos de uso e política de privacidade (LGPD)

### 2. Configure sua Empresa
- Cadastre os dados da sua empresa
- Categorias padrão são criadas automaticamente

### 3. Crie Checklists
- Use templates prontos ou crie do zero
- Defina periodicidade (diário, semanal, mensal)
- Adicione itens obrigatórios e opcionais

### 4. Distribua os QR Codes
- Baixe o QR Code de cada checklist
- Imprima e cole nos locais de execução

### 5. Execute e Acompanhe
- Funcionários escaneiam o QR Code
- Marcam os itens concluídos
- Gestores acompanham pelo dashboard

## 🎨 Interface

A interface foi desenvolvida com foco em:
- **Usabilidade**: Navegação intuitiva e fluxos simples
- **Acessibilidade**: Contraste adequado e elementos clicáveis
- **Responsividade**: Funciona em desktop, tablet e mobile
- **Design moderno**: Visual escuro com acentos em verde

## 📄 LGPD

O sistema está em conformidade com a Lei Geral de Proteção de Dados:

- ✅ Consentimento explícito no cadastro
- ✅ Política de Privacidade detalhada
- ✅ Termos de Uso claros
- ✅ Direito de exclusão de dados
- ✅ Logs de auditoria
- ✅ Criptografia de dados sensíveis

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📝 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido com 💚 para facilitar a gestão de processos

