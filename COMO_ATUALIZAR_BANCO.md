# 🗄️ Como Atualizar o Banco de Dados

## ✅ **No Railway (Produção) - AUTOMÁTICO**

**Boa notícia:** O comando `npm run start` já executa `db:push` automaticamente! 

Quando você faz deploy no Railway, o script `start` já inclui:
```json
"start": "npm run prisma:generate -w @crm/backend && npm run db:push -w @crm/backend && npm run db:init -w @crm/backend && node apps/backend/dist/main.js"
```

**Então você só precisa:**
1. Fazer commit das mudanças
2. Fazer push para o repositório
3. O Railway vai fazer deploy automaticamente
4. O banco será atualizado automaticamente no primeiro start

**✅ Não precisa fazer nada manual no Railway!**

---

## 💻 **Localmente (Desenvolvimento)**

Se você quiser atualizar o banco localmente para testar:

### Opção 1: Comando na raiz do projeto
```bash
npm run db:push
```

### Opção 2: Comando direto no workspace backend
```bash
npm run db:push -w @crm/backend
```

### Opção 3: Comandos separados (mais controle)
```bash
# 1. Gerar Prisma Client
npm run prisma:generate -w @crm/backend

# 2. Aplicar mudanças no banco
npm run prisma:push -w @crm/backend
```

---

## 📋 **O que o `db:push` faz?**

1. **Lê o schema** (`apps/backend/prisma/schema.prisma`)
2. **Compara** com o banco atual
3. **Cria/atualiza/remove** tabelas e campos conforme necessário
4. **NÃO perde dados** (apenas adiciona novos campos/tabelas)

---

## ⚠️ **Importante**

### No Railway:
- ✅ **Automático** - roda no `start`
- ✅ **Seguro** - não precisa fazer nada manual
- ✅ **Atualiza** sempre que você faz deploy

### Localmente:
- Execute `npm run db:push` quando mudar o schema
- Certifique-se de ter `DATABASE_URL` configurado no `.env`

---

## 🔍 **Verificar se funcionou**

Após o deploy no Railway, verifique os logs:
```
✅ Prisma Client gerado
✅ Seu banco de dados agora está sincronizado com seu esquema Prisma
✅ Conectado ao banco de dados
```

Se aparecer esses logs, está tudo certo! 🎉

---

## 🐛 **Se der erro**

1. Verifique se `DATABASE_URL` está configurado no Railway
2. Verifique os logs do Railway para ver o erro específico
3. O erro geralmente aparece como:
   ```
   ❌ Erro ao inicializar banco: [mensagem de erro]
   ```

---

**Resumo:** No Railway é automático! Só fazer deploy. Localmente, use `npm run db:push`. ✅


