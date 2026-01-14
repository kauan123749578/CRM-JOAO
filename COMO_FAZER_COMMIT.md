# 📤 Como Fazer Commit e Push

## ✅ **O que fazer:**

Você precisa fazer commit e push de **TODAS as mudanças**, não apenas a pasta `apps`.

### 1. **Adicionar todas as mudanças:**
```bash
git add .
```

Ou se quiser ser mais específico:
```bash
git add apps/
git add package.json
git add apps/backend/prisma/schema.prisma
```

### 2. **Fazer commit:**
```bash
git commit -m "Corrigir erro de sintaxe e aplicar melhorias: cache, fotos de perfil, design e permissões"
```

### 3. **Fazer push:**
```bash
git push
```

---

## 📋 **Arquivos que foram modificados:**

✅ `apps/web/src/App.tsx` - Cache melhorado + design + permissões  
✅ `apps/web/src/components/ChatList.tsx` - Fotos de perfil + design  
✅ `apps/web/src/components/ChatWindow.tsx` - Design melhorado  
✅ `apps/web/src/api.ts` - Tipo Chat com profilePicUrl  
✅ `apps/backend/src/whatsapp/whatsapp.service.ts` - Busca foto de perfil  
✅ `apps/backend/src/whatsapp/whatsapp.controller.ts` - Limite de mensagens  
✅ `apps/backend/prisma/schema.prisma` - Campo userId em WhatsAppInstance  

---

## ⚠️ **Importante:**

- **Não precisa subir apenas `apps`** - suba tudo
- O Railway vai fazer build de tudo automaticamente
- O banco será atualizado automaticamente no deploy

---

## 🚀 **Depois do push:**

1. O Railway vai detectar o push
2. Vai fazer build automaticamente
3. Vai executar `npm run build`
4. Vai executar `npm run start` (que inclui `db:push`)
5. O banco será atualizado automaticamente

---

**Resumo:** Faça `git add .`, `git commit -m "mensagem"` e `git push`. Pronto! ✅


