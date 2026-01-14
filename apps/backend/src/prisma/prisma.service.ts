import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly enabled = !!(process.env.DATABASE_URL || process.env.URL_DO_BANCO_DE_DADOS);

  async onModuleInit() {
    if (!this.enabled) {
      // eslint-disable-next-line no-console
      console.warn('[Prisma] DATABASE_URL não definido. Rodando sem banco (modo dev).');
      return;
    }
    try {
      await this.$connect();
      // eslint-disable-next-line no-console
      console.log('[Prisma] Conectado ao banco de dados');
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[Prisma] Erro ao conectar:', error.message);
      // Não lançar erro para permitir modo dev sem DB
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;
    try {
      await this.$disconnect();
    } catch (error) {
      // Ignorar erros ao desconectar
    }
  }
}


