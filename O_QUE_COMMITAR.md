# 📦 O Que Commitar no Repositório

## ✅ O Que DEVE Ser Commitado

### 📁 Estrutura de Pastas (Raiz do Projeto)

```
crm-v2/
├── apps/                          ✅ COMMITAR
│   ├── backend/                   ✅ COMMITAR
│   │   ├── src/                   ✅ COMMITAR (código fonte TypeScript)
│   │   ├── prisma/                ✅ COMMITAR (schema.prisma, seed.ts)
│   │   ├── public/                ✅ COMMITAR (frontend compilado)
│   │   ├── package.json           ✅ COMMITAR
│   │   └── tsconfig.json          ✅ COMMITAR
│   │
│   └── web/                       ✅ COMMITAR
│       ├── src/                   ✅ COMMITAR (código fonte React)
│       ├── package.json           ✅ COMMITAR
│       ├── tsconfig.json          ✅ COMMITAR
│       ├── vite.config.ts          ✅ COMMITAR
│       ├── tailwind.config.js     ✅ COMMITAR
│       └── postcss.config.js      ✅ COMMITAR
│
├── tools/                         ✅ COMMITAR
│   └── copy-web-dist.mjs          ✅ COMMITAR
│
├── package.json                   ✅ COMMITAR
├── package-lock.json              ✅ COMMITAR
├── railway.json                   ✅ COMMITAR (configuração Railway)
├── nixpacks.toml                  ✅ COMMITAR (configuração build)
├── .gitignore                     ✅ COMMITAR
├── README.md                      ✅ COMMITAR
├── env.example.txt                ✅ COMMITAR (exemplo de variáveis)
│
└── *.md                           ✅ COMMITAR (documentação)
```

## ❌ O Que NÃO Deve Ser Commitado

### 🚫 Pastas/Arquivos que JÁ estão no .gitignore:

```
❌ node_modules/           (dependências - serão instaladas no Railway)
❌ apps/backend/dist/      (código compilado - será gerado no build)
❌ apps/web/dist/          (código compilado - será gerado no build)
❌ .env                    (variáveis de ambiente - configure no Railway)
❌ .env.local
❌ .wwebjs_auth/          (sessão WhatsApp - não commitar!)
❌ *.log                  (logs)
❌ .cache/                (cache)
❌ .railway/              (configurações locais Railway)
❌ .vscode/               (configurações do editor)
❌ .idea/                 (configurações do editor)
```

## 📋 Checklist Antes de Commitar

### ✅ Verificar:

- [ ] **Código fonte** (`apps/backend/src/`, `apps/web/src/`) está presente
- [ ] **Schema Prisma** (`apps/backend/prisma/schema.prisma`) está presente
- [ ] **Configurações** (`package.json`, `railway.json`, `nixpacks.toml`) estão presentes
- [ ] **Frontend compilado** (`apps/backend/public/`) está presente (necessário para servir)
- [ ] **`.gitignore`** está presente e correto
- [ ] **`env.example.txt`** está presente (sem valores reais)

### ❌ Verificar que NÃO está:

- [ ] `node_modules/` não está no commit
- [ ] `.env` não está no commit
- [ ] `apps/backend/dist/` não está no commit (será gerado no build)
- [ ] `apps/web/dist/` não está no commit (será gerado no build)
- [ ] `.wwebjs_auth/` não está no commit (sessão WhatsApp)

## 🚀 Comandos Git

### Primeira vez (criar repositório):

```bash
cd crm-v2
git init
git add .
git commit -m "Initial commit: CRM WhatsApp v2"
git branch -M main
git remote add origin https://github.com/kauan123749578/crm-whatsapp-v2.git
git push -u origin main
```

### Atualizações (depois de fazer alterações):

```bash
cd crm-v2
git add .
git commit -m "Descrição das alterações"
git push
```

## 📝 Notas Importantes

### 1. Frontend Compilado (`apps/backend/public/`)

**IMPORTANTE:** O frontend compilado (`apps/backend/public/`) DEVE estar no repositório porque:
- O backend serve o frontend estático
- O Railway precisa desses arquivos para servir a aplicação
- Eles são gerados pelo `npm run build` e copiados pelo script `copy:web`

### 2. Código Compilado (`apps/backend/dist/`)

**NÃO commitar** `apps/backend/dist/` porque:
- Será gerado automaticamente no Railway durante o build
- O script `build` já compila o código
- Está no `.gitignore`

### 3. Variáveis de Ambiente

**NÃO commitar** `.env`:
- Use `env.example.txt` como template
- Configure as variáveis no Railway (aba "Variáveis")
- Valores sensíveis não devem estar no código

## 🎯 Resumo Rápido

**Commite:**
- ✅ Todo código fonte (`.ts`, `.tsx`)
- ✅ Configurações (`package.json`, `railway.json`, etc)
- ✅ Schema Prisma
- ✅ Frontend compilado em `apps/backend/public/`
- ✅ Documentação (`.md`)

**NÃO commite:**
- ❌ `node_modules/`
- ❌ `dist/` (exceto `public/`)
- ❌ `.env`
- ❌ `.wwebjs_auth/`
- ❌ Logs e cache

## 🔍 Verificar o que será commitado

Antes de fazer commit, execute:

```bash
git status
```

Isso mostra todos os arquivos que serão adicionados. Verifique se não há nada que não deveria estar lá!


