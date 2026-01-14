import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto, JwtPayload } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    try {
      const hasDb = !!process.env.DATABASE_URL;
      console.log('[Auth] Login attempt:', { username: dto.username, hasDb });
      
      if (!hasDb) {
        // Modo dev sem DB: permitir login padrão
        const devUsers: Record<string, { password: string; name: string; role: string; id: string }> = {
          'admin': { password: 'admin123', name: 'Administrador', role: 'admin', id: 'dev-admin' },
          'user1': { password: 'user1', name: 'Funcionário 1', role: 'employee', id: 'dev-user1' },
          'user2': { password: 'user2', name: 'Funcionário 2', role: 'employee', id: 'dev-user2' },
          'user3': { password: 'user3', name: 'Funcionário 3', role: 'employee', id: 'dev-user3' }
        };

        const user = devUsers[dto.username];
        if (user && user.password === dto.password) {
          return {
            access_token: this.jwtService.sign({
              userId: user.id,
              email: `${dto.username}@crm.com`,
              role: user.role
            }),
            user: {
              id: user.id,
              username: dto.username,
              email: `${dto.username}@crm.com`,
              name: user.name,
              role: user.role
            }
          };
        }
        throw new UnauthorizedException('Usuário ou senha incorretos');
      }

      // Com DB: tentar buscar usuário
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { username: dto.username }
        });
      } catch (prismaError: any) {
        console.error('[Auth] Erro ao buscar usuário no Prisma:', prismaError);
        // Se houver erro de conexão, tentar modo dev como fallback
        if (prismaError.code === 'P1001' || prismaError.message?.includes('connect')) {
          console.warn('[Auth] Erro de conexão com DB, usando modo dev como fallback');
          const devUsers: Record<string, { password: string; name: string; role: string; id: string }> = {
            'admin': { password: 'admin123', name: 'Administrador', role: 'admin', id: 'dev-admin' }
          };
          const devUser = devUsers[dto.username];
          if (devUser && devUser.password === dto.password) {
            return {
              access_token: this.jwtService.sign({
                userId: devUser.id,
                email: `${dto.username}@crm.com`,
                role: devUser.role
              }),
              user: {
                id: devUser.id,
                username: dto.username,
                email: `${dto.username}@crm.com`,
                name: devUser.name,
                role: devUser.role
              }
            };
          }
        }
        throw new UnauthorizedException('Erro ao conectar com o banco de dados');
      }

      if (!user) {
        throw new UnauthorizedException('Usuário ou senha incorretos');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Usuário ou senha incorretos');
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email || `${user.username}@crm.com`,
        role: user.role
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email || `${user.username}@crm.com`,
          name: user.name,
          role: user.role
        }
      };
    } catch (error: any) {
      console.error('[Auth] Erro no login:', error);
      // Se já for uma UnauthorizedException, relançar
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Caso contrário, lançar erro genérico
      throw new UnauthorizedException('Erro ao fazer login. Tente novamente.');
    }
  }

  async register(dto: RegisterDto) {
    const hasDb = !!process.env.DATABASE_URL;
    if (!hasDb) {
      throw new Error('Database não habilitado. Não é possível criar usuários.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username }
    });

    if (existing) {
      throw new UnauthorizedException('Usuário já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email || null,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'employee'
      },
      select: { id: true, username: true, email: true, name: true, role: true }
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || `${user.username}@crm.com`,
      role: user.role
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email || `${user.username}@crm.com`,
        name: user.name,
        role: user.role
      }
    };
  }

  async getMe(userId: string) {
    try {
      const hasDb = !!process.env.DATABASE_URL;
      if (!hasDb) {
        // Modo dev: retornar dados mockados baseado no ID
        const devUsers: Record<string, any> = {
          'dev-admin': { id: 'dev-admin', username: 'admin', email: 'admin@crm.com', name: 'Administrador', role: 'admin' },
          'dev-user1': { id: 'dev-user1', username: 'user1', email: 'user1@crm.com', name: 'Funcionário 1', role: 'employee' },
          'dev-user2': { id: 'dev-user2', username: 'user2', email: 'user2@crm.com', name: 'Funcionário 2', role: 'employee' },
          'dev-user3': { id: 'dev-user3', username: 'user3', email: 'user3@crm.com', name: 'Funcionário 3', role: 'employee' }
        };
        return devUsers[userId] || devUsers['dev-admin'];
      }

      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, email: true, name: true, role: true }
        });
      } catch (prismaError: any) {
        console.error('[Auth] Erro ao buscar usuário no Prisma (getMe):', prismaError);
        // Fallback para modo dev em caso de erro de conexão
        if (prismaError.code === 'P1001' || prismaError.message?.includes('connect')) {
          const devUsers: Record<string, any> = {
            'dev-admin': { id: 'dev-admin', username: 'admin', email: 'admin@crm.com', name: 'Administrador', role: 'admin' }
          };
          return devUsers[userId] || devUsers['dev-admin'];
        }
        throw new UnauthorizedException('Erro ao conectar com o banco de dados');
      }
      
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }
      
      return {
        id: user.id,
        username: user.username,
        email: user.email || `${user.username}@crm.com`,
        name: user.name,
        role: user.role
      };
    } catch (error: any) {
      console.error('[Auth] Erro no getMe:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro ao buscar informações do usuário');
    }
  }
}

