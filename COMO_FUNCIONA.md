# 📖 Como Funciona o CRM

## 🔐 Sistema de Autenticação

### Login
- **Email**: `admin@crm.com` (modo dev sem banco)
- **Senha**: `admin123` (modo dev sem banco)
- Ou use usuários criados no banco de dados

### Permissões

#### 👑 Admin
- Pode editar **todas** as tags e estágios de **qualquer** conversa
- Pode ver todas as conversas
- Tem acesso total ao sistema

#### 👤 Funcionário
- Pode editar tags/estágios apenas de conversas **atribuídas a ele**
- Quando edita uma conversa pela primeira vez, ela é **automaticamente atribuída** a ele
- **Não pode** editar conversas de outros funcionários

## 🏷️ Sistema de Tags

### Como Funciona
1. Clique em uma conversa no ChatList
2. Abra o painel lateral direito (RightSidebar)
3. Clique em **"+ Adicionar"** para adicionar tags
4. Clique no **"X"** em uma tag para removê-la

### Tags Disponíveis
- Lead Quente (vermelho)
- Negociação (laranja)
- Frio (azul)
- Interno (cinza)
- Lead (dourado)

## 📊 Funil de Vendas

### Estágios
1. **Entrada** - Novo contato
2. **Contatado** - Já foi contatado
3. **Negociação** - Em negociação ativa
4. **Ganho** - Venda realizada ✅
5. **Perdido** - Perdida ❌

### Como Usar
1. Selecione uma conversa
2. No painel direito, use o dropdown **"Estágio do Funil"**
3. Escolha o estágio atual

## 🔒 Sistema de Permissões (Detalhado)

### Quando um Funcionário Pode Editar
- ✅ Conversa sem dono (userId = null)
- ✅ Conversa atribuída a ele (userId = seu ID)
- ❌ Conversa de outro funcionário

### Quando um Admin Pode Editar
- ✅ **TODAS** as conversas, independente do dono

### Atribuição Automática
Quando um funcionário (não-admin) edita uma conversa pela primeira vez:
- Se a conversa não tem dono → é atribuída a ele automaticamente
- Se já tem dono e é dele → pode editar
- Se já tem dono e não é dele → **ERRO** (não pode editar)

## 📝 Como Marcar Conversas

### Passo a Passo
1. **Faça login** no sistema
2. **Conecte** a instância WhatsApp (botão "Conectar")
3. **Escaneie o QR Code** no WhatsApp
4. **Selecione uma conversa** na lista à esquerda
5. **Adicione tags** no painel direito
6. **Escolha o estágio** do funil

### Dicas
- Tags ajudam a **organizar** contatos
- Estágios do funil mostram o **progresso** da venda
- Admin pode ver e editar **tudo**
- Funcionários só veem/editam suas próprias conversas

## 🗄️ Banco de Dados

### Modelo User
```prisma
User {
  id        String
  email     String (único)
  password  String (bcrypt)
  name      String
  role      "admin" | "employee"
}
```

### Modelo Chat (Atualizado)
```prisma
Chat {
  id          String
  instanceId  String
  name        String?
  tags        String[]  // Array de tags
  stage       String    // Estágio do funil
  userId      String?   // Dono da conversa (null = sem dono)
  ...
}
```

## 🚀 Como Criar Usuários (Com Banco de Dados)

### Via API
```bash
POST /api/auth/register
{
  "email": "funcionario@crm.com",
  "password": "senha123",
  "name": "João Silva",
  "role": "employee"  // ou "admin"
}
```

### Via Prisma Studio
```bash
npx prisma studio
```
Abra o modelo `User` e crie manualmente.

## ⚠️ Modo Desenvolvimento (Sem Banco)

Se `DATABASE_URL` não estiver configurado:
- Login padrão: `admin@crm.com` / `admin123`
- Permissões não funcionam completamente
- Tags são salvas em memória (perdidas ao reiniciar)

## 🔧 Configuração

### Variáveis de Ambiente
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="sua-chave-secreta-aqui"  # Obrigatório em produção!
PORT=8080
```

## 📱 Interface

### Layout
- **Esquerda**: Lista de conversas (ChatList)
- **Centro**: Mensagens (ChatWindow)
- **Direita**: Info do contato, tags e funil (RightSidebar)

### Navegação
- Use o **ChannelSwitcher** no topo para trocar entre WA1, WA2, etc
- Clique em uma conversa para ver mensagens
- Use o botão de menu para abrir/fechar o painel direito



