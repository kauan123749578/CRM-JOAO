# Como Configurar DATABASE_URL no Railway

## O que é DATABASE_URL?

O `DATABASE_URL` é uma variável de ambiente que contém a string de conexão com o banco de dados PostgreSQL. Ela é usada pelo Prisma (ORM) para conectar ao banco e fazer operações como:

- **Salvar usuários** (login, registro)
- **Salvar chats** do WhatsApp
- **Salvar mensagens** do WhatsApp
- **Salvar tags e estágios** do funil de vendas
- **Persistir dados** entre reinicializações do servidor

### Formato do DATABASE_URL

```
postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?schema=public
```

Exemplo:
```
postgresql://postgres:senha123@containers-us-west-123.railway.app:5432/railway?schema=public
```

## Como Configurar no Railway

### Opção 1: Usando Postgres do Railway (Recomendado)

1. **No Railway, vá em seu projeto**
2. **Clique em "+ Novo" ou "+ Criar"**
3. **Selecione "Banco de dados" → "PostgreSQL"**
4. **O Railway criará automaticamente um serviço Postgres**
5. **O Railway injeta automaticamente a variável `DATABASE_URL`** no seu serviço `crm-whatsapp-v2`

**Pronto!** O `DATABASE_URL` já estará configurado automaticamente.

### Opção 2: Configuração Manual

Se você já tem um Postgres criado:

1. **Vá em "Variáveis" do serviço `crm-whatsapp-v2`**
2. **Clique em "+ Nova variável"**
3. **Nome:** `DATABASE_URL`
4. **Valor:** Cole a string de conexão do seu Postgres

   - Se o Postgres está no Railway: use `${{Postgres.DATABASE_URL}}` (referência automática)
   - Se é externo: cole a string completa `postgresql://...`

### Opção 3: Usando URL_DO_BANCO_DE_DADOS (Compatibilidade)

O código agora suporta automaticamente a variável `URL_DO_BANCO_DE_DADOS`:

1. **Vá em "Variáveis"**
2. **Nome:** `URL_DO_BANCO_DE_DADOS`
3. **Valor:** `${{Postgres.DATABASE_URL}}` ou a string completa

O código converte automaticamente para `DATABASE_URL`.

## Verificar se Está Configurado

Após configurar, faça um novo deploy e verifique os logs:

```
📊 DATABASE_URL: Configurado
[Prisma] Conectado ao banco de dados
```

Se aparecer "Não configurado", o sistema funcionará em modo dev (sem banco).

## Criar Tabelas no Banco

Após configurar o `DATABASE_URL`, você precisa criar as tabelas:

1. **No Railway, vá em "Deployments" → "Detalhes" → "Shell"**
2. **Execute:**
   ```bash
   npm run db:push
   ```

Isso criará todas as tabelas necessárias (users, chats, messages, etc).

## Criar Usuário Admin

Após criar as tabelas, crie o usuário admin:

1. **No Shell do Railway, execute:**
   ```bash
   npm run prisma:seed -w @crm/backend
   ```

Ou o sistema criará automaticamente na primeira inicialização (se `DATABASE_URL` estiver configurado).

## Credenciais Padrão

- **Admin:** `admin` / `admin123`
- **Funcionário 1:** `user1` / `user1`
- **Funcionário 2:** `user2` / `user2`
- **Funcionário 3:** `user3` / `user3`

## Resumo Visual

```
Railway Project
├── Postgres (serviço)
│   └── DATABASE_URL (variável automática)
│
└── crm-whatsapp-v2 (serviço)
    └── Recebe DATABASE_URL automaticamente
        └── Prisma conecta ao banco
            └── Tabelas criadas com db:push
                └── Usuários criados com seed
```

## Problemas Comuns

### "DATABASE_URL não configurado"
- Verifique se o Postgres está conectado ao serviço
- Verifique se a variável existe em "Variáveis"

### "Erro ao conectar ao banco"
- Verifique se o Postgres está online
- Verifique se a string de conexão está correta
- Verifique se as tabelas foram criadas (`db:push`)

### "Usuário não encontrado"
- Execute o seed: `npm run prisma:seed -w @crm/backend`
- Ou aguarde a inicialização automática

## Modo Dev (sem banco)

Se `DATABASE_URL` não estiver configurado, o sistema funciona em modo dev:
- ✅ Login funciona (usuários mockados)
- ✅ WhatsApp funciona
- ❌ Dados não são salvos (perdidos ao reiniciar)
- ❌ Tags e estágios não persistem

Para produção, **sempre configure o DATABASE_URL**!


