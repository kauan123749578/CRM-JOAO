import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initDb() {
  try {
    console.log('🔍 Verificando conexão com banco de dados...');
    
    // Verificar se há DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL não configurado. Pulando inicialização do banco.');
      return;
    }

    // Tentar conectar
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a tabela users existe (testando com uma query simples)
    try {
      await prisma.$queryRaw`SELECT 1 FROM "users" LIMIT 1`;
    } catch (tableError: any) {
      if (tableError.message?.includes('não existe') || tableError.message?.includes('does not exist')) {
        console.error('❌ Tabelas não criadas! Execute: npm run db:push');
        console.error('   Ou no Railway Shell: npm run db:push -w @crm/backend');
        return;
      }
      throw tableError;
    }

    // Verificar se já existe usuário admin
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (adminExists) {
      console.log('✅ Usuário admin já existe');
      return;
    }

    console.log('🌱 Criando usuários...');
    
    // Criar admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@crm.com',
        password: adminPassword,
        name: 'Administrador',
        role: 'admin'
      }
    });
    console.log('✅ Admin criado:', admin.username);
    
    // Criar funcionários
    const employees = [
      { username: 'funcionario1', password: 'func123', name: 'Funcionário 1', email: 'func1@crm.com' },
      { username: 'funcionario2', password: 'func123', name: 'Funcionário 2', email: 'func2@crm.com' },
      { username: 'funcionario3', password: 'func123', name: 'Funcionário 3', email: 'func3@crm.com' },
      { username: 'operador1', password: 'oper123', name: 'Operador 1', email: 'oper1@crm.com' },
      { username: 'operador2', password: 'oper123', name: 'Operador 2', email: 'oper2@crm.com' }
    ];
    
    for (const emp of employees) {
      const empPassword = await bcrypt.hash(emp.password, 10);
      const employee = await prisma.user.upsert({
        where: { username: emp.username },
        update: {},
        create: {
          username: emp.username,
          email: emp.email,
          password: empPassword,
          name: emp.name,
          role: 'employee'
        }
      });
      console.log(`✅ ${employee.name} criado: ${employee.username} / ${emp.password}`);
    }
    
    console.log('\n📋 ===== CREDENCIAIS =====');
    console.log('👑 ADMIN:');
    console.log('   Usuário: admin');
    console.log('   Senha: admin123');
    console.log('\n👤 FUNCIONÁRIOS:');
    console.log('   funcionario1 / func123');
    console.log('   funcionario2 / func123');
    console.log('   funcionario3 / func123');
    console.log('   operador1 / oper123');
    console.log('   operador2 / oper123');
    console.log('========================\n');

  } catch (error: any) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    if (error.message?.includes('não existe') || error.message?.includes('does not exist')) {
      console.error('💡 Execute primeiro: npm run db:push');
    }
    // Não lançar erro para não quebrar o start
  } finally {
    await prisma.$disconnect();
  }
}

initDb();

