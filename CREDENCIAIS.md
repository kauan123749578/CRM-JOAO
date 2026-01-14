# 🔐 Credenciais do Sistema JOÃO FORNECEDOR

## 👑 Administrador

**Usuário:** `admin`  
**Senha:** `admin123`

---

## 👤 Funcionários

### Funcionário 1
**Usuário:** `funcionario1`  
**Senha:** `func123`

### Funcionário 2
**Usuário:** `funcionario2`  
**Senha:** `func123`

### Funcionário 3
**Usuário:** `funcionario3`  
**Senha:** `func123`

### Operador 1
**Usuário:** `operador1`  
**Senha:** `oper123`

### Operador 2
**Usuário:** `operador2`  
**Senha:** `oper123`

---

## 📝 Notas

- Os usuários funcionários podem **conectar instâncias WhatsApp**
- O administrador pode **visualizar todas as instâncias e métricas**
- As senhas podem ser alteradas no banco de dados se necessário
- Para criar novos usuários, execute o script `init-db.ts` ou use a API de registro

---

## 🔄 Como Recriar Usuários

Se precisar recriar os usuários, execute:

```bash
npm run db:init -w @crm/backend
```

Ou no Railway:

```bash
npm run db:init -w @crm/backend
```

