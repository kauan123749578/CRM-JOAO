# 🚀 Como Fazer Commit das Melhorias de Design

## 📁 Pastas/Arquivos para Commit

### ✅ **PASTA PRINCIPAL: `apps/`**

Você deve fazer commit de **TODA a pasta `apps/`** que contém:

```
apps/
├── web/
│   └── src/
│       ├── components/
│       │   ├── Login.tsx          ✅ Design melhorado
│       │   ├── ChatList.tsx       ✅ Fotos de perfil corrigidas
│       │   ├── ChatWindow.tsx     ✅ Design melhorado
│       │   └── RightSidebar.tsx   ✅ Design melhorado
│       └── App.tsx                 ✅ Header melhorado
│
└── backend/
    └── src/
        └── whatsapp/
            └── whatsapp.service.ts ✅ Fotos de perfil no evento
```

---

## 🎯 Comandos Git (Execute na pasta `crm-v2`)

### Opção 1: Commit Simples (Recomendado)
```bash
cd antigravity-crm/repositorio-pronto/crm-v2

# Adicionar apenas os arquivos modificados de design
git add apps/web/src/components/Login.tsx
git add apps/web/src/components/ChatList.tsx
git add apps/web/src/components/ChatWindow.tsx
git add apps/web/src/components/RightSidebar.tsx
git add apps/web/src/App.tsx
git add apps/backend/src/whatsapp/whatsapp.service.ts

# Fazer commit
git commit -m "feat: melhorias de design e correção de fotos de perfil"

# Push
git push origin main
```

### Opção 2: Commit de Tudo (Se quiser subir tudo)
```bash
cd antigravity-crm/repositorio-pronto/crm-v2

# Adicionar toda a pasta apps
git add apps/

# Fazer commit
git commit -m "feat: melhorias de design e correção de fotos de perfil"

# Push
git push origin main
```

---

## 📋 Resumo dos Arquivos Modificados

| Arquivo | O que foi alterado |
|---------|-------------------|
| `apps/web/src/components/Login.tsx` | Design moderno com gradientes |
| `apps/web/src/components/ChatList.tsx` | Fotos de perfil + design |
| `apps/web/src/components/ChatWindow.tsx` | Header com foto + design |
| `apps/web/src/components/RightSidebar.tsx` | Design melhorado |
| `apps/web/src/App.tsx` | Header melhorado + preservação de fotos |
| `apps/backend/src/whatsapp/whatsapp.service.ts` | Inclusão de profilePicUrl no evento |

---

## ⚠️ IMPORTANTE

**NÃO faça commit de:**
- ❌ `.wwebjs_auth/` (sessões do WhatsApp)
- ❌ `.wwebjs_cache/` (cache)
- ❌ `node_modules/`
- ❌ `.env` ou arquivos com senhas

---

## ✅ Após o Commit

1. Railway vai fazer deploy automaticamente
2. Teste as fotos de perfil - devem aparecer agora!
3. Verifique o design melhorado na tela de login

---

**Total: 6 arquivos modificados** 🎨

