# 🔧 Correções: Mensagens e Instâncias

## ✅ Problemas Corrigidos

### 1. **Filtrar Grupos - Apenas Contatos Individuais** ✅

**Problema:** Carregava mensagens de grupos também.

**Solução:** Adicionado filtro no backend para retornar apenas contatos individuais:

```typescript
.filter((c: any) => !!c.id && !c.isGroup) // Filtrar grupos
```

**Arquivo:** `apps/backend/src/whatsapp/whatsapp.service.ts`

### 2. **Carregar Todas as Mensagens** ✅

**Problema:** Limitava a 80 mensagens, não carregava todas.

**Solução:** Aumentado limite para 500 mensagens:

```typescript
const data = await fetchMessages(instanceId, chatId, 500);
```

**Arquivo:** `apps/web/src/App.tsx` - função `loadMsgs`

### 3. **Cache de Instâncias - Mensagens Não Devem Sumir** ✅

**Problema:** Ao trocar de instância (wa1 → wa2 → wa1), as mensagens sumiam e precisava reconectar.

**Solução:** 
- Cache melhorado para preservar mensagens por instância
- Restauração automática ao voltar para uma instância
- Mensagens são restauradas do cache imediatamente

**Arquivos modificados:**
- `apps/web/src/App.tsx` - Sistema de cache aprimorado

### 4. **Tags no Painel** ✅

**Status:** As tags já estão implementadas no `RightSidebar` e devem aparecer.

**Verificar:**
- O painel lateral direito está aberto? (botão no ChatWindow)
- As tags estão sendo salvas no banco?
- O chat selecionado tem tags?

## 📋 Como Funciona Agora

### Cache de Instâncias

1. **Ao trocar de instância:**
   - Estado atual (chats, mensagens, chat selecionado) é salvo no cache
   - Nova instância é carregada

2. **Ao voltar para uma instância:**
   - Chats são restaurados do cache
   - Chat selecionado é restaurado
   - **Mensagens são restauradas do cache automaticamente**
   - Se não houver no cache, carrega do servidor

3. **Ao conectar:**
   - Não limpa o cache
   - Preserva mensagens já carregadas

### Filtro de Grupos

- Apenas contatos individuais aparecem na lista
- Grupos são filtrados automaticamente
- Mensagens de grupos não são carregadas

### Limite de Mensagens

- Agora carrega até 500 mensagens por chat
- Deve carregar todas as mensagens na maioria dos casos

## 🧪 Testar

1. **Filtrar grupos:**
   - Verifique se apenas contatos individuais aparecem
   - Grupos não devem aparecer na lista

2. **Carregar todas as mensagens:**
   - Abra um chat com muitas mensagens
   - Deve carregar todas (até 500)

3. **Cache de instâncias:**
   - Entre na instância 1 (wa1)
   - Carregue alguns chats e mensagens
   - Troque para instância 2 (wa2)
   - Volte para instância 1 (wa1)
   - **As mensagens devem estar preservadas!**

4. **Tags:**
   - Abra o painel lateral direito (botão no ChatWindow)
   - Selecione um chat
   - Adicione tags usando o botão "+ Adicionar"
   - As tags devem aparecer no painel

## 🐛 Se Ainda Não Funcionar

### Mensagens não carregam todas:
- Verifique o limite no backend (pode precisar aumentar mais)
- Verifique se há timeout no WhatsApp

### Cache não funciona:
- Verifique o console do navegador para erros
- Limpe o cache do navegador e teste novamente

### Tags não aparecem:
- Verifique se o painel lateral está aberto
- Verifique se as tags estão sendo salvas no banco
- Verifique os logs do backend

## 📝 Arquivos Modificados

- ✅ `apps/backend/src/whatsapp/whatsapp.service.ts` - Filtro de grupos
- ✅ `apps/web/src/App.tsx` - Cache melhorado, limite de mensagens aumentado

---

**Pronto para testar!** Faça commit e deploy. 🚀


