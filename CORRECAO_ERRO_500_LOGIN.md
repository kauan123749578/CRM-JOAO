# Correção do Erro 500 no Login

## Problemas Identificados e Corrigidos

### 1. **Tratamento de Erros no Auth Service**
- ✅ Adicionado try-catch completo no método `login()`
- ✅ Tratamento específico para erros de conexão do Prisma
- ✅ Fallback para modo dev quando há erro de conexão com o banco
- ✅ Logs de debug adicionados para facilitar diagnóstico

### 2. **Filtro Global de Exceções**
- ✅ Criado `HttpExceptionFilter` para tratamento global de erros
- ✅ Logs detalhados de erros para debug
- ✅ Respostas de erro padronizadas

### 3. **Suporte a Variáveis de Ambiente Alternativas**
- ✅ Suporte para `URL_DO_BANCO_DE_DADOS` (compatibilidade Railway)
- ✅ Normalização automática para `DATABASE_URL`

### 4. **Inicialização Automática do Banco**
- ✅ Script `init-db.ts` criado para inicializar usuário admin automaticamente
- ✅ Execução automática no start (se houver DATABASE_URL)

## Configuração no Railway

### Variáveis de Ambiente Necessárias

No Railway, você precisa configurar:

1. **DATABASE_URL** (ou URL_DO_BANCO_DE_DADOS)
   - Se você criou um serviço Postgres no Railway, ele já injeta `DATABASE_URL` automaticamente
   - Se você criou uma variável manual `URL_DO_BANCO_DE_DADOS`, ela será mapeada automaticamente

2. **JWT_SECRET**
   - Configure uma chave secreta para JWT
   - Exemplo: `JWT_SECRET=seu-secret-super-seguro-aqui`

3. **NODE_ENV** (opcional)
   - Configure como `production` em produção

4. **WA_DATA_PATH** (opcional, para WhatsApp)
   - Configure como `/data/wwebjs_auth` se usar volume

### Passos para Corrigir no Railway

1. **Verificar Variáveis de Ambiente**
   - Vá em **Variáveis** do serviço `crm-whatsapp-v2`
   - Certifique-se de que `DATABASE_URL` está configurado
   - Se você tem `URL_DO_BANCO_DE_DADOS`, o código agora suporta isso automaticamente

2. **Executar Migração do Banco**
   - No Railway, vá em **Deployments** → **Detalhes** → **Shell**
   - Execute: `npm run db:push`
   - Isso criará as tabelas no banco

3. **Criar Usuário Admin (se necessário)**
   - O script `init-db.ts` será executado automaticamente no start
   - Mas você pode executar manualmente:
     ```bash
     npm run prisma:seed -w @crm/backend
     ```
   - Ou usar o shell do Railway para executar o seed

4. **Fazer Novo Deploy**
   - Faça commit das alterações
   - O Railway fará deploy automaticamente
   - Ou force um novo deploy manualmente

### Credenciais Padrão

Após executar o seed ou init-db:

- **Admin**: `admin` / `admin123`
- **Funcionário 1**: `user1` / `user1`
- **Funcionário 2**: `user2` / `user2`
- **Funcionário 3**: `user3` / `user3`

## Verificação

Após o deploy, verifique os logs:

1. Procure por: `📊 DATABASE_URL: Configurado`
2. Procure por: `[Prisma] Conectado ao banco de dados`
3. Procure por: `✅ Admin criado` (se executou init-db)

Se ainda houver erro 500:

1. Verifique os logs completos no Railway
2. Procure por mensagens de erro do Prisma
3. Verifique se `DATABASE_URL` está correto
4. Verifique se o banco está acessível

## Modo Dev (sem banco)

Se `DATABASE_URL` não estiver configurado, o sistema funciona em modo dev:
- Usa usuários mockados em memória
- Não precisa de banco de dados
- Útil para desenvolvimento local

## Arquivos Modificados

- `apps/backend/src/auth/auth.service.ts` - Tratamento de erros melhorado
- `apps/backend/src/main.ts` - Suporte a variáveis alternativas + filtro global
- `apps/backend/src/common/filters/http-exception.filter.ts` - Novo filtro de exceções
- `apps/backend/src/prisma/prisma.service.ts` - Melhor tratamento de conexão
- `apps/backend/src/scripts/init-db.ts` - Script de inicialização do banco
- `package.json` - Scripts atualizados para executar init-db


