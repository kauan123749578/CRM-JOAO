import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Admin pode editar qualquer chat
    if (user.role === 'admin') {
      return true;
    }

    // Employee só pode editar chats que são seus (userId = user.id)
    const chatId = request.params.chatId;
    if (chatId) {
      const chat = await this.prisma.chat.findUnique({
        where: { id: decodeURIComponent(chatId) },
        select: { userId: true }
      });

      if (!chat) {
        throw new ForbiddenException('Chat não encontrado');
      }

      // Se o chat não tem userId, qualquer funcionário pode editar (para atribuir a si)
      if (!chat.userId) {
        return true;
      }

      // Se o chat tem userId, só o dono ou admin pode editar
      if (chat.userId !== user.id) {
        throw new ForbiddenException('Você só pode editar tags de conversas atribuídas a você');
      }
    }

    return true;
  }
}



