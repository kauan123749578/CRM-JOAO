# 📤 Arquivos para Subir no Git

## ✅ **O que fazer:**

### 1. **Adicionar TODAS as mudanças:**
```bash
git add .
```

### 2. **Fazer commit:**
```bash
git commit -m "Corrigir erros do Prisma: instanceId e chaves estrangeiras"
```

### 3. **Fazer push:**
```bash
git push
```

---

## 📋 **Arquivos que foram modificados:**

### **Backend:**
✅ `apps/backend/src/whatsapp/whatsapp.service.ts`
- Corrigido: `instanceId` agora é garantido no `mapChat`
- Corrigido: Instância é criada antes de criar chats
- Corrigido: Chat é criado antes de salvar mensagens
- Corrigido: Usa `connect` para relacionar instância e chat

✅ `apps/backend/prisma/schema.prisma`
- Adicionado: Campo `userId` em `WhatsAppInstance`
- Relação entre `User` e `WhatsAppInstance`

### **Frontend:**
✅ `apps/web/src/App.tsx`
- Cache melhorado
- Design melhorado
- Permissões (admin/funcionário)

✅ `apps/web/src/components/ChatList.tsx`
- Fotos de perfil
- Design melhorado

✅ `apps/web/src/components/ChatWindow.tsx`
- Design melhorado

✅ `apps/web/src/api.ts`
- Tipo `Chat` com `profilePicUrl`

### **Outros:**
✅ `package.json` (raiz)
- Scripts de build e start

---

## ⚠️ **IMPORTANTE:**

### **Problemas que foram corrigidos:**

1. ✅ **Erro "Argument 'instance' is missing"**
   - Agora garante que a instância existe antes de criar chats
   - Usa `connect` para relacionar

2. ✅ **Erro "a relação 'public.users' não existe"**
   - O banco será atualizado automaticamente no deploy
   - O script `start` já inclui `db:push`

3. ✅ **Erro de chave estrangeira ao salvar mensagens**
   - Agora verifica se o chat existe antes de salvar mensagem
   - Cria o chat automaticamente se não existir

---

## 🚀 **Depois do push:**

1. Railway vai detectar o push
2. Vai executar `npm run build`
3. Vai executar `npm run start` (que inclui `db:push`)
4. Banco será atualizado automaticamente
5. Erros devem desaparecer

---

## 📝 **Resumo:**

**Subir TUDO:**
```bash
git add .
git commit -m "Corrigir erros do Prisma"
git push
```

**Não precisa subir apenas pastas específicas - suba tudo!** ✅


