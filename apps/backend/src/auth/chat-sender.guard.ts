import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatSenderGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Admin pode enviar em qualquer chat
    if (user.role === 'admin') {
      return true;
    }

    // Employee: verificar se pode enviar na conversa
    const chatId = body?.chatId;
    if (!chatId) {
      return true; // Deixar passar se não tiver chatId (pode ser outro endpoint)
    }

    // Buscar chat no banco
    const hasDb = !!process.env.DATABASE_URL;
    if (!hasDb) {
      // Modo dev sem DB: permitir
      return true;
    }

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true }
    });

    if (!chat) {
      // Chat não existe no banco ainda, permitir criar e atribuir
      return true;
    }

    // Se o chat não tem userId, qualquer funcionário pode enviar (vai atribuir ao primeiro)
    if (!chat.userId) {
      return true;
    }

    // Se o chat tem userId diferente do usuário atual, BLOQUEAR
    if (chat.userId !== user.id) {
      throw new ForbiddenException('Esta conversa já está sendo atendida por outro funcionário. Apenas o atendente responsável ou o admin podem enviar mensagens.');
    }

    return true;
  }
}



