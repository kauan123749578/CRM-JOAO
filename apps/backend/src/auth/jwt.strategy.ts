import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    });
  }

  async validate(payload: JwtPayload) {
    const hasDb = !!process.env.DATABASE_URL;
    
    // Modo dev sem DB: retornar dados do payload diretamente
    if (!hasDb) {
      // Se for o usuário dev-admin, retornar dados mockados
      if (payload.userId === 'dev-admin') {
        return {
          id: 'dev-admin',
          email: 'admin@crm.com',
          name: 'Admin Dev',
          role: 'admin'
        };
      }
      // Caso contrário, retornar dados do payload
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.email.split('@')[0], // Fallback name
        role: payload.role
      };
    }

    // Com DB: buscar usuário no banco
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, name: true }
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return user;
    } catch (error) {
      // Se houver erro no banco, usar dados do payload como fallback
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.email.split('@')[0],
        role: payload.role
      };
    }
  }
}

