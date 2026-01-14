# 📦 Arquivos para Commit - Melhorias de Design e Fotos de Perfil

## ✅ Arquivos Modificados que DEVEM ser commitados:

### 🎨 Frontend (apps/web/src/)

1. **`apps/web/src/components/Login.tsx`**
   - ✨ Design moderno com gradientes e animações
   - ✨ Background decorativo
   - ✨ Ícones nos campos de input
   - ✨ Botões com efeitos hover

2. **`apps/web/src/components/ChatList.tsx`**
   - ✨ Melhorias no design das fotos de perfil
   - ✨ Fallback elegante quando não há foto
   - ✨ Melhor tratamento de erros

3. **`apps/web/src/components/ChatWindow.tsx`**
   - ✨ Header com gradiente e foto de perfil
   - ✨ Design mais moderno
   - ✨ Suporte para exibir foto do contato

4. **`apps/web/src/components/RightSidebar.tsx`**
   - ✨ Design com backdrop blur
   - ✨ Foto de perfil maior e destacada
   - ✨ Melhor organização visual

5. **`apps/web/src/App.tsx`**
   - ✨ Header melhorado com gradientes
   - ✨ Preservação de `profilePicUrl` nas atualizações
   - ✨ Melhor design geral

### 🔧 Backend (apps/backend/src/)

6. **`apps/backend/src/whatsapp/whatsapp.service.ts`**
   - ✨ Inclusão de `profilePicUrl` no evento `wa:chat_updated`
   - ✨ Busca de foto de perfil ao receber mensagens

---

## 📋 Comandos Git

### 1. Adicionar arquivos modificados:
```bash
cd antigravity-crm/repositorio-pronto/crm-v2

# Adicionar apenas os arquivos modificados
git add apps/web/src/components/Login.tsx
git add apps/web/src/components/ChatList.tsx
git add apps/web/src/components/ChatWindow.tsx
git add apps/web/src/components/RightSidebar.tsx
git add apps/web/src/App.tsx
git add apps/backend/src/whatsapp/whatsapp.service.ts
```

### 2. Ou adicionar tudo de uma vez:
```bash
git add apps/web/src/components/
git add apps/web/src/App.tsx
git add apps/backend/src/whatsapp/whatsapp.service.ts
```

### 3. Fazer commit:
```bash
git commit -m "feat: melhorias de design e correção de fotos de perfil

- Design moderno na tela de login com gradientes e animações
- Header do painel principal com visual mais profissional
- Correção e melhoria na exibição de fotos de perfil
- ChatList, ChatWindow e RightSidebar com design aprimorado
- Backend agora inclui profilePicUrl no evento wa:chat_updated
- Preservação de profilePicUrl nas atualizações de chat"
```

### 4. Push para o repositório:
```bash
git push origin main
# ou
git push origin master
```

---

## ⚠️ Arquivos que NÃO devem ser commitados:

- ❌ `node_modules/` (já no .gitignore)
- ❌ `.wwebjs_auth/` (sessões do WhatsApp)
- ❌ Arquivos de build (`dist/`, `.next/`, etc.)
- ❌ Arquivos de ambiente (`.env`, `.env.local`)
- ❌ Logs e arquivos temporários

---

## 📁 Estrutura de Pastas para Commit

```
crm-v2/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Login.tsx          ✅ MODIFICADO
│   │       │   ├── ChatList.tsx       ✅ MODIFICADO
│   │       │   ├── ChatWindow.tsx      ✅ MODIFICADO
│   │       │   └── RightSidebar.tsx    ✅ MODIFICADO
│   │       └── App.tsx                 ✅ MODIFICADO
│   └── backend/
│       └── src/
│           └── whatsapp/
│               └── whatsapp.service.ts ✅ MODIFICADO
```

---

## 🚀 Após o Commit

1. **Railway vai fazer deploy automaticamente** (se configurado)
2. **Ou faça deploy manual** se necessário
3. **Teste as fotos de perfil** - devem aparecer agora!

---

## 📝 Resumo das Mudanças

### Design:
- ✅ Login moderno com gradientes
- ✅ Header profissional
- ✅ Componentes com melhor visual

### Funcionalidade:
- ✅ Fotos de perfil funcionando
- ✅ Preservação de dados ao trocar instâncias
- ✅ Fallback elegante quando não há foto

---

**Total de arquivos modificados: 6**

