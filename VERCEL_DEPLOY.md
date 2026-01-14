# 🚀 Deploy no Vercel - CRM WhatsApp

## ⚠️ Resposta: NÃO, este projeto NÃO roda no Vercel

### Por que não funciona no Vercel?

1. **Servidor Backend (NestJS)**
   - Vercel é para funções serverless (Edge Functions)
   - Este CRM precisa de um servidor Node.js rodando 24/7
   - WhatsApp precisa manter conexão WebSocket ativa
   - Sessões do whatsapp-web.js precisam persistir

2. **Requisitos do Projeto**
   - Servidor HTTP contínuo
   - WebSocket (Socket.IO)
   - Sessões persistentes do WhatsApp
   - Armazenamento local (.wwebjs_auth)

## ✅ Onde fazer Deploy?

### 🚂 Railway (RECOMENDADO)
- **Por quê**: Suporta servidores Node.js contínuos
- **Vantagens**:
  - Suporta WebSocket
  - Persistent storage (para sessões WhatsApp)
  - PostgreSQL incluído
  - Build automático do GitHub
  - HTTPS gratuito

### 🐳 Render
- **Por quê**: Similar ao Railway
- **Vantagens**:
  - Free tier disponível
  - Suporta WebSocket
  - PostgreSQL disponível

### ☁️ AWS / Google Cloud / Azure
- **Por quê**: Infraestrutura completa
- **Vantagens**:
  - Controle total
  - Escalável
- **Desvantagens**:
  - Mais complexo de configurar
  - Custos podem ser altos

## 📋 Passos para Deploy no Railway

1. **Criar conta no Railway**
   - Acesse: https://railway.app
   - Login com GitHub

2. **Criar novo projeto**
   - "New Project" → "Deploy from GitHub repo"
   - Selecione seu repositório

3. **Configurar variáveis de ambiente**
   ```
   DATABASE_URL=postgresql://... (Railway fornece)
   JWT_SECRET=sua-chave-secreta-aqui
   PORT=8080
   ```

4. **Configurar build**
   - Root directory: `repositorio-pronto/crm-v2`
   - Build command: `npm run build`
   - Start command: `npm start`

5. **Adicionar PostgreSQL**
   - Railway → Add Service → PostgreSQL
   - Copiar `DATABASE_URL` para variáveis de ambiente

6. **Deploy**
   - Railway faz build e deploy automaticamente
   - Aguardar deploy concluir
   - Acessar URL fornecida

## ⚙️ Configurações Necessárias

### package.json (raiz)
```json
{
  "scripts": {
    "build": "npm run build -w @crm/backend && npm run build -w @crm/web",
    "start": "cd apps/backend && npm start"
  }
}
```

### railway.json (se necessário)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🎯 Resumo

- ❌ **Vercel**: NÃO funciona (serverless)
- ✅ **Railway**: Funciona perfeitamente
- ✅ **Render**: Funciona também
- ✅ **AWS/GCP/Azure**: Funciona mas é mais complexo

## 💡 Dica

O projeto anterior (`call-hot-1.2`) que funcionou na Railway tinha a mesma estrutura. Este CRM vai funcionar também porque:
- ✅ Mesma arquitetura (backend NestJS + frontend React)
- ✅ Mesma configuração de build
- ✅ Mesmas dependências
- ✅ Mesmos requisitos (servidor contínuo)

**Conclusão**: Use Railway ou Render para fazer deploy deste CRM! 🚀



