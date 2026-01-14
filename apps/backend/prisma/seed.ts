import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar usuário admin
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
    { username: 'user1', name: 'Funcionário 1', email: 'user1@crm.com' },
    { username: 'user2', name: 'Funcionário 2', email: 'user2@crm.com' },
    { username: 'user3', name: 'Funcionário 3', email: 'user3@crm.com' }
  ];

  for (const emp of employees) {
    const password = await bcrypt.hash(emp.username, 10); // Senha = username (ex: user1/user1)
    const user = await prisma.user.upsert({
      where: { username: emp.username },
      update: {},
      create: {
        username: emp.username,
        email: emp.email,
        password,
        name: emp.name,
        role: 'employee'
      }
    });
    console.log(`✅ ${emp.name} criado: ${user.username}/${emp.username}`);
  }

  console.log('🎉 Seed concluído!');
  console.log('\n📋 Credenciais:');
  console.log('Admin: admin / admin123');
  console.log('Funcionário 1: user1 / user1');
  console.log('Funcionário 2: user2 / user2');
  console.log('Funcionário 3: user3 / user3');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



