# 🔐 Sistema de Permissões - CRM

## Visão Geral

O CRM possui dois níveis de permissão:
- **Admin**: Acesso total ao sistema
- **Employee (Funcionário)**: Acesso limitado às próprias conversas

## Permissões por Role

### 👑 Administrador (Admin)

**Pode:**
- ✅ Ver **TODAS** as conversas
- ✅ Editar tags de **TODAS** as conversas
- ✅ Editar estágios do funil de **TODAS** as conversas
- ✅ Enviar mensagens em qualquer conversa
- ✅ Ver todas as mídias
- ✅ Gerenciar usuários (quando implementado)
- ✅ Ver relatórios completos (quando implementado)

**Não pode:**
- Nada (tem acesso total)

### 👤 Funcionário (Employee)

**Pode:**
- ✅ Ver conversas atribuídas a ele
- ✅ Editar tags de conversas atribuídas a ele
- ✅ Editar estágios do funil de conversas atribuídas a ele
- ✅ Enviar mensagens em conversas atribuídas a ele
- ✅ Ver mídias de conversas atribuídas a ele
- ✅ Atribuir conversas a si mesmo (primeira edição)

**Não pode:**
- ❌ Ver conversas de outros funcionários
- ❌ Editar tags de conversas de outros funcionários
- ❌ Editar estágios de conversas de outros funcionários
- ❌ Enviar mensagens em conversas de outros funcionários

## Como Funciona a Atribuição

### Atribuição Automática
Quando um funcionário edita uma conversa pela primeira vez:
1. Se a conversa **não tem dono** (userId = null) → é atribuída automaticamente ao funcionário
2. Se a conversa **já tem dono** → verifica permissão:
   - Se for dele → permite editar
   - Se for de outro → **BLOQUEIA** edição

### Exemplo Prático

```
Conversa "João Silva"
- userId: null (sem dono)

Funcionário 1 edita tags:
  → userId muda para "user1-id"
  → Funcionário 1 agora é o dono

Funcionário 2 tenta editar:
  → Verifica: userId = "user1-id" ≠ "user2-id"
  → ERRO: "Você só pode editar tags de conversas atribuídas a você"

Admin tenta editar:
  → Verifica: role = "admin"
  → PERMITE: Admin pode editar tudo
```

## Regras de Permissão

### 1. Visualização de Conversas
- **Admin**: Vê todas
- **Funcionário**: Vê apenas as suas

### 2. Edição de Tags
- **Admin**: Pode editar todas
- **Funcionário**: Pode editar apenas as suas
  - Se conversa sem dono → atribui a si
  - Se conversa de outro → bloqueia

### 3. Edição de Estágios do Funil
- **Admin**: Pode editar todas
- **Funcionário**: Pode editar apenas as suas
  - Mesmas regras de tags

### 4. Envio de Mensagens
- **Admin**: Pode enviar em qualquer conversa
- **Funcionário**: Pode enviar apenas em conversas atribuídas a ele

## Implementação Técnica

### Backend (ChatOwnerGuard)
```typescript
// Verifica se usuário pode editar chat
- Admin → sempre permite
- Funcionário → verifica userId do chat
```

### Frontend (RightSidebar)
```typescript
// Mostra mensagem se não tem permissão
if (!canEdit) {
  "Você só pode editar tags de conversas atribuídas a você"
}
```

## Usuários Padrão

### Modo Dev (sem banco)
- **admin** / **admin123** → Admin
- **user1** / **user1** → Funcionário 1
- **user2** / **user2** → Funcionário 2
- **user3** / **user3** → Funcionário 3

### Com Banco de Dados
Execute o seed:
```bash
npm run prisma:seed -w @crm/backend
```

Mesmas credenciais são criadas no banco.

## Próximas Melhorias

1. **Permissões Granulares**
   - Ver conversas específicas
   - Editar apenas estágios (não tags)
   - Apenas visualização

2. **Grupos de Permissão**
   - Supervisor (vê todos, não edita)
   - Vendedor (só suas conversas)
   - Suporte (pode reatribuir)

3. **Painel de Admin**
   - Gerenciar usuários
   - Definir permissões
   - Ver logs de ações



