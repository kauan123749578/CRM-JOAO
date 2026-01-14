# 🚀 JOÃO FORNECEDOR - CRM WhatsApp v2

Sistema completo de CRM para WhatsApp com design Premium Black & Gold.

## ✨ Características

- ✅ Gerenciamento de conversas do WhatsApp em tempo real
- ✅ Sistema de autenticação (Admin e Funcionários)
- ✅ Funil de vendas (Entrada → Contatado → Negociação → Ganho/Perdido)
- ✅ Sistema de tags para organizar contatos
- ✅ Design Premium Black & Gold
- ✅ Logo personalizada João Fornecedor
- ✅ Botão visualizar senha no login

## 🏗️ Estrutura

```
crm-v2/
├── apps/
│   ├── backend/     # NestJS + TypeScript
│   └── web/         # React + TypeScript + Vite
├── tools/           # Scripts de build
├── package.json      # Workspace root
├── build.sh          # Script de build para Railway
└── railway.json      # Configuração Railway
```

## 🚀 Deploy no Railway

### Configuração Inicial

1. **Root Directory:** Configure como `crm-v2` nas Settings do Railway
2. **Variáveis de Ambiente:**
   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   JWT_SECRET = sua-chave-secreta
   NODE_ENV = production
   WA_DATA_PATH = /data/wwebjs_auth
   ```
3. **Volume:** Crie um Volume e monte em `/data`

### Build e Deploy

O Railway executará automaticamente:
- `npm ci` (instalar dependências)
- `chmod +x build.sh && ./build.sh` (build completo)
- `npm start` (iniciar servidor)

## 📋 Credenciais Padrão

Veja `CREDENCIAIS.md` para todas as credenciais.

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

## 🛠️ Tecnologias

- **Backend:** NestJS, TypeScript, Socket.IO, Prisma
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Banco:** PostgreSQL
- **WhatsApp:** whatsapp-web.js
- **Deploy:** Railway

## 📝 Scripts

```bash
# Desenvolvimento
npm run dev -w @crm/backend  # Backend
npm run dev -w @crm/web       # Frontend

# Build
npm run build                 # Build completo

# Banco de dados
npm run db:push -w @crm/backend
npm run db:init -w @crm/backend
```

## 📄 Licença

Proprietário - JOÃO FORNECEDOR
