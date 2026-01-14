import { Injectable, Logger } from '@nestjs/common';
import pkg from 'whatsapp-web.js';
import { PrismaService } from '../prisma/prisma.service';
import type { InstanceStatus, StatusPayload } from './types';
import path from 'node:path';

const { Client, LocalAuth } = pkg as any;

type WAClient = InstanceType<typeof Client>;

type InstanceRuntime = {
  id: string;
  client: WAClient;
  status: InstanceStatus;
  qr?: string | null;
  readyAt?: number | null;
  chatsCache?: { ts: number; data: any[] } | null;
  emit?: ((event: string, payload: any) => void) | null;
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly instances = new Map<string, InstanceRuntime>();
  private readonly creating = new Map<string, Promise<InstanceRuntime>>();
  private readonly dbEnabled = !!process.env.DATABASE_URL;
  private readonly chatsInFlight = new Map<string, Promise<any[]>>();

  constructor(private readonly prisma: PrismaService) {}

  private async ensureWWebJS(inst: InstanceRuntime): Promise<void> {
    const page = (inst.client as any)?.pupPage;
    if (!page) {
      throw new Error('Page não disponível');
    }

    try {
      // Verificar se a página ainda está conectada
      const isConnected = page.isClosed() === false;
      if (!isConnected) {
        throw new Error('Page fechada ou desconectada');
      }

      // Verificar Store (objeto interno do WhatsApp Web)
      let hasStore = false;
      try {
        hasStore = await page.evaluate(() => typeof (window as any).Store !== 'undefined');
      } catch (e) {
        this.logger.warn(`[${inst.id}] Erro ao verificar Store: ${(e as Error).message}`);
      }

      // Se Store sumiu, o contexto do WhatsApp Web foi reiniciado
      if (!hasStore) {
        this.logger.warn(`[${inst.id}] Store não encontrado - contexto pode ter sido reiniciado`);
        // Tentar aguardar um pouco para ver se recarrega
        await new Promise((r) => setTimeout(r, 2000));
        hasStore = await page.evaluate(() => typeof (window as any).Store !== 'undefined');
        if (!hasStore) {
          throw new Error('Store não encontrado (contexto reiniciado)');
        }
      }

      // Verificar e re-injetar WWebJS se necessário
      let hasWWebJS = false;
      try {
        hasWWebJS = await page.evaluate(() => typeof (window as any).WWebJS !== 'undefined');
      } catch (e) {
        this.logger.warn(`[${inst.id}] Erro ao verificar WWebJS: ${(e as Error).message}`);
      }

      if (!hasWWebJS) {
        this.logger.log(`[${inst.id}] WWebJS não encontrado, reinjetando...`);
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { LoadUtils } = require('whatsapp-web.js/src/util/Injected/Utils');
          await page.evaluate(LoadUtils);
          
          // Verificar se foi injetado com sucesso
          await new Promise((r) => setTimeout(r, 500));
          hasWWebJS = await page.evaluate(() => typeof (window as any).WWebJS !== 'undefined');
          if (!hasWWebJS) {
            throw new Error('Falha ao reinjetar WWebJS');
          }
          this.logger.log(`[${inst.id}] WWebJS reinjetado com sucesso`);
        } catch (e) {
          const errorMsg = (e as Error).message || String(e);
          // Se o erro é sobre RegistrationUtils ou contexto perdido, forçar reinicialização
          if (/RegistrationUtils|context|undefined/i.test(errorMsg)) {
            this.logger.warn(`[${inst.id}] Contexto perdido detectado, forçando reinicialização...`);
            throw new Error('CONTEXT_LOST');
          }
          this.logger.error(`[${inst.id}] Falha ao reinjetar WWebJS: ${errorMsg}`);
          throw new Error(`Falha ao reinjetar WWebJS: ${errorMsg}`);
        }
      }

      // Garantir que o método getChats existe
      const hasGetChats = await page.evaluate(() => typeof (window as any).WWebJS?.getChats === 'function');
      if (!hasGetChats) {
        this.logger.warn(`[${inst.id}] WWebJS.getChats não encontrado, tentando reinjetar...`);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { LoadUtils } = require('whatsapp-web.js/src/util/Injected/Utils');
        await page.evaluate(LoadUtils);
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (e) {
      const errorMsg = (e as Error).message || String(e);
      // Se o erro é sobre contexto perdido, lançar erro específico
      if (/CONTEXT_LOST|RegistrationUtils|context/i.test(errorMsg)) {
        this.logger.error(`[${inst.id}] Contexto do WhatsApp perdido, precisa reinicializar`);
        throw new Error('CONTEXT_LOST');
      }
      this.logger.error(`[${inst.id}] ensureWWebJS falhou: ${errorMsg}`);
      throw e;
    }
  }

  private async restartInstance(instanceId: string) {
    const inst = this.instances.get(instanceId);
    if (!inst) {
      this.logger.warn(`[${instanceId}] restartInstance: instância não encontrada`);
      return;
    }

    this.logger.log(`[${instanceId}] Tentando reinicializar instância...`);
    
    try {
      // Tentar reinicializar o client existente (LocalAuth deve manter sessão)
      inst.status = 'connecting';
      inst.qr = null;
      inst.readyAt = null;
      inst.chatsCache = null;

      // Se o client ainda existe, tenta reinicializar
      if (inst.client) {
        try {
          // Remove todos os listeners para evitar duplicação
          (inst.client as any).removeAllListeners();
          
          // Re-registrar eventos usando o emit salvo
          const emitFunc = inst.emit;
          if (emitFunc) {
            inst.client.on('qr', async (qr: string) => {
              inst.qr = qr;
              emitFunc('wa:qr', { instanceId, qr });
            });

            inst.client.on('authenticated', async () => {
              inst.status = 'authenticated';
              emitFunc('wa:status', { instanceId, status: 'authenticated', message: 'Autenticado com sucesso' });
            });

            inst.client.on('ready', async () => {
              inst.readyAt = Date.now();
              inst.status = 'ready';
              inst.chatsCache = null;
              emitFunc('wa:status', { instanceId, status: 'ready', message: 'Conectado e pronto' });
            });

            inst.client.on('disconnected', async (reason: string) => {
              inst.qr = null;
              inst.readyAt = null;
              inst.chatsCache = null;
              inst.status = 'disconnected';
              emitFunc('wa:status', { instanceId, status: 'disconnected', message: reason || 'Desconectado' });
            });
          }

          // Tentar reinicializar
          await (inst.client as any).initialize();
          this.logger.log(`[${instanceId}] Instância reinicializada com sucesso`);
        } catch (reInitError) {
          this.logger.warn(`[${instanceId}] Falha ao reinicializar, tentando destroy + recreate: ${(reInitError as Error).message}`);
          
          // Se reinicializar falhou, tenta destroy e recriar
          try {
            await (inst.client as any).destroy();
            await new Promise((r) => setTimeout(r, 2000));
          } catch (destroyError) {
            this.logger.warn(`[${instanceId}] Erro ao destruir client: ${(destroyError as Error).message}`);
          }

          // Recriar o client (vai usar LocalAuth, pode pedir QR se necessário)
          const dataPath = (process.env.WA_DATA_PATH?.trim() ||
            path.join(process.cwd(), '.wwebjs_auth'));
          
          inst.client = new Client({
            authStrategy: new LocalAuth({
              clientId: instanceId,
              dataPath
            }),
            puppeteer: {
              headless: true,
              protocolTimeout: 300000,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=site-per-process'
              ]
            }
          });

          // Re-registrar eventos
          const emitFunc = inst.emit;
          if (emitFunc) {
            inst.client.on('qr', async (qr: string) => {
              inst.qr = qr;
              emitFunc('wa:qr', { instanceId, qr });
            });

            inst.client.on('authenticated', async () => {
              inst.status = 'authenticated';
              emitFunc('wa:status', { instanceId, status: 'authenticated', message: 'Autenticado com sucesso' });
            });

            inst.client.on('ready', async () => {
              inst.readyAt = Date.now();
              inst.status = 'ready';
              inst.chatsCache = null;
              emitFunc('wa:status', { instanceId, status: 'ready', message: 'Conectado e pronto' });
            });

            inst.client.on('disconnected', async (reason: string) => {
              inst.qr = null;
              inst.readyAt = null;
              inst.chatsCache = null;
              inst.status = 'disconnected';
              emitFunc('wa:status', { instanceId, status: 'disconnected', message: reason || 'Desconectado' });
            });
          }

          await (inst.client as any).initialize();
          this.logger.log(`[${instanceId}] Client recriado e inicializado`);
        }
      }
    } catch (e) {
      this.logger.error(`[${instanceId}] Erro ao reiniciar instância: ${(e as Error).message}`);
      inst.status = 'error';
      throw e;
    }
  }


  listInstances() {
    return Array.from(this.instances.values()).map((i) => ({
      id: i.id,
      status: i.status
    }));
  }

  getInstance(id: string) {
    return this.instances.get(id);
  }

  async getOrCreate(id: string, emit: (event: string, payload: any) => void) {
    if (this.instances.has(id)) return this.instances.get(id)!;
    if (this.creating.has(id)) return await this.creating.get(id)!;

    const promise = (async () => {
      // Persistência de sessão:
      // - Local: salva em ./ .wwebjs_auth (evita depender de /data)
      // - Railway: use um Volume em /data e configure WA_DATA_PATH=/data/wwebjs_auth
      const dataPath = (process.env.WA_DATA_PATH?.trim() ||
        path.join(process.cwd(), '.wwebjs_auth'));
      const runtime: InstanceRuntime = {
        id,
        status: 'connecting',
        qr: null,
        readyAt: null,
        chatsCache: null,
        emit: emit,
        client: new Client({
          authStrategy: new LocalAuth({
            clientId: id,
            dataPath
          }),
          puppeteer: {
            headless: true,
            // getChats pode ser pesado; em máquinas/ambientes lentos isso estoura fácil
            protocolTimeout: 300000,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-features=site-per-process'
            ]
          }
        })
      };

      this.instances.set(id, runtime);
      if (this.dbEnabled) {
        await this.prisma.whatsAppInstance.upsert({
          where: { id },
          update: { status: runtime.status },
          create: { id, status: runtime.status, userId: null } // userId será definido quando funcionário conectar
        });
      }

      const setStatus = async (status: InstanceStatus, message?: string) => {
        runtime.status = status;
        if (this.dbEnabled) {
          await this.prisma.whatsAppInstance.update({
            where: { id },
            data: { status }
          });
        }
        const payload: StatusPayload = { instanceId: id, status, message };
        emit('wa:status', payload);
      };

      runtime.client.on('qr', async (qr: string) => {
        runtime.qr = qr;
        await setStatus('qr', 'Escaneie o QR Code');
        emit('wa:qr', { instanceId: id, qr });
      });

      runtime.client.on('authenticated', async () => {
        await setStatus('authenticated', 'Autenticado com sucesso');
      });

      runtime.client.on('ready', async () => {
        runtime.readyAt = Date.now();
        runtime.chatsCache = null;
        await setStatus('ready', 'Conectado e pronto');
      });

      runtime.client.on('disconnected', async (reason: string) => {
        runtime.qr = null;
        runtime.readyAt = null;
        runtime.chatsCache = null;
        await setStatus('disconnected', reason || 'Desconectado');
      });

      runtime.client.on('auth_failure', async (msg: string) => {
        await setStatus('error', msg || 'Falha na autenticação');
      });

      runtime.client.on('message', async (msg: any) => {
        try {
          const chat = await msg.getChat();
          const chatId = chat.id?._serialized;
          if (!chatId) return;

          if (this.dbEnabled) {
            // Garantir que a instância existe
            await this.prisma.whatsAppInstance.upsert({
              where: { id },
              update: { status: runtime.status },
              create: { id, status: runtime.status, userId: null }
            });

            // Upsert chat básico - PRESERVAR tags e stage existentes
            await this.prisma.chat.upsert({
              where: { id: chatId },
              update: {
                // Atualizar apenas campos do WhatsApp, PRESERVAR tags e stage
                name: chat.name || undefined, // Atualizar nome se tiver
                isGroup: !!chat.isGroup,
                unreadCount: chat.unreadCount || 0,
                lastMessage: msg.body || null,
                lastTs: msg.timestamp || 0
                // tags e stage NÃO são atualizados aqui - preservam valores existentes
              },
              create: {
                id: chatId,
                instance: {
                  connect: { id }
                },
                name: chat.name || null,
                isGroup: !!chat.isGroup,
                unreadCount: chat.unreadCount || 0,
                lastMessage: msg.body || null,
                lastTs: msg.timestamp || 0,
                tags: [],
                stage: 'Entrada'
              }
            });

            await this.prisma.message.upsert({
              where: { id: msg.id._serialized },
              update: {},
              create: {
                id: msg.id._serialized,
                instanceId: id,
                chatId,
                body: msg.body || null,
                fromMe: !!msg.fromMe,
                from: msg.from || null,
                to: msg.to || null,
                ts: msg.timestamp || 0
              }
            });
          }

          // Detectar se mensagem tem mídia
          let hasMedia = false;
          let mediaType = null;
          try {
            if (msg.hasMedia) {
              hasMedia = true;
              const media = await msg.downloadMedia();
              mediaType = media?.mimetype || null;
            }
          } catch {
            // Ignore se falhar
          }

          emit('wa:message', {
            instanceId: id,
            message: {
              id: msg.id._serialized,
              chatId,
              body: msg.body || (hasMedia ? '[Mídia]' : ''),
              fromMe: !!msg.fromMe,
              ts: msg.timestamp || 0,
              hasMedia,
              mediaType
            }
          });

          // Invalidar cache de chats para forçar atualização na próxima chamada
          runtime.chatsCache = null;

          // Emitir evento de chat atualizado para atualizar lista automaticamente
          // Buscar tags e stage do banco para incluir no evento
          let tags: string[] = [];
          let stage = 'Entrada';
          let profilePicUrl: string | null = null;
          if (this.dbEnabled) {
            try {
              const dbChat = await this.prisma.chat.findUnique({
                where: { id: chatId },
                select: { tags: true, stage: true, name: true }
              });
              if (dbChat) {
                tags = dbChat.tags || [];
                stage = dbChat.stage || 'Entrada';
              }
              // Buscar foto de perfil do chat
              try {
                if (!chat.isGroup) {
                  profilePicUrl = await chat.getProfilePicUrl().catch(() => null);
                }
              } catch {
                // Ignorar erro ao buscar foto
              }
            } catch (e) {
              // Ignore se falhar
            }
          }
          
          emit('wa:chat_updated', {
            instanceId: id,
            chatId,
            chat: {
              id: chatId,
              name: chat.name || null, // Manter nome do chat, não usar ID
              isGroup: !!chat.isGroup,
              unreadCount: chat.unreadCount || 0,
              lastMessage: msg.body || null,
              lastTs: msg.timestamp || 0,
              tags, // Incluir tags do banco
              stage, // Incluir stage do banco
              profilePicUrl // Incluir foto de perfil
            }
          });
        } catch (e) {
          this.logger.warn(`Falha ao persistir mensagem: ${(e as Error).message}`);
        }
      });

      await runtime.client.initialize();
      return runtime;
    })()
      .catch(async (e) => {
        this.instances.delete(id);
        throw e;
      })
      .finally(() => {
        this.creating.delete(id);
      });

    this.creating.set(id, promise);
    return await promise;
  }

  async waitUntilReady(instanceId: string, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const inst = this.instances.get(instanceId);
      if (inst?.status === 'ready') return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  }

  async getChats(instanceId: string) {
    const inst = this.instances.get(instanceId);
    if (!inst) throw new Error('Instância não existe (ainda)');

    // Cache curto: evita spam de getChats que derruba o Chromium
    if (inst.chatsCache && Date.now() - inst.chatsCache.ts < 10000) {
      return inst.chatsCache.data;
    }

    // Lock: se já tem um getChats em andamento, aguardar o mesmo
    if (this.chatsInFlight.has(instanceId)) {
      return await this.chatsInFlight.get(instanceId)!;
    }

    // Warmup: aguardar um pouco após ready para evitar instabilidade
    const readyAt = inst.readyAt ?? null;
    if (typeof readyAt === 'number' && Date.now() - readyAt < 8000) {
      await new Promise((r) => setTimeout(r, 8000 - (Date.now() - readyAt)));
    }

    const promise = (async () => {
      const mapChat = async (c: any) => {
        const chatId = c?.id?._serialized || '';
        let dbChat: any = null;
        let chatName: string | null = null;
        
        // PRIORIDADE 1: Buscar nome salvo no banco (pode ter sido editado manualmente)
        if (this.dbEnabled) {
          dbChat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { tags: true, stage: true, name: true }
          });
          // Se tiver nome salvo no banco E for válido (não é ID), usar ele
          if (dbChat?.name && 
              dbChat.name !== chatId && 
              !dbChat.name.match(/^\d+@/) && 
              dbChat.name.length >= 3) {
            chatName = dbChat.name;
          }
        }

        // PRIORIDADE 2: Se não tiver nome salvo válido, usar nome do WhatsApp
        if (!chatName) {
          const whatsappName = c?.name || null;
          // Verificar se nome do WhatsApp é válido (não é ID)
          if (whatsappName && 
              whatsappName !== chatId && 
              !whatsappName.match(/^\d+@/) && 
              whatsappName.length >= 3) {
            chatName = whatsappName;
          }
        }

        // PRIORIDADE 3: Se ainda não tiver nome válido, tentar buscar do contato
        if (!chatName || chatName === chatId || chatName.match(/^\d+@/) || chatName.length < 3) {
          try {
            const contact = await c.getContact().catch(() => null);
            if (contact?.pushname && contact.pushname.length >= 3) {
              chatName = contact.pushname;
            } else if (contact?.name && contact.name.length >= 3) {
              chatName = contact.name;
            } else if (contact?.number) {
              chatName = contact.number;
            }
          } catch {
            // Ignorar erro
          }
        }

        // PRIORIDADE 4: Último recurso - formatar ID
        if (!chatName || chatName === chatId || chatName.match(/^\d+@/) || chatName.length < 3) {
          const idPart = chatId.split('@')[0];
          chatName = idPart.length <= 20 ? idPart : `${idPart.substring(0, 17)}...`;
        }

        // Buscar foto de perfil do chat (contatos e grupos)
        // Observação: para contatos individuais, a API de contato costuma estar mais atualizada
        let profilePicUrl: string | null = null;
        try {
          if (c?.isGroup) {
            // Para grupos, usar diretamente a foto do chat
            profilePicUrl = await c.getProfilePicUrl().catch(() => null);
          } else {
            // Para contatos, usar a foto do contato (igual usamos na sidebar)
            try {
              const contact = await c.getContact().catch(() => null);
              if (contact) {
                profilePicUrl = await contact.getProfilePicUrl().catch(() => null);
              }
            } catch {
              // Se falhar via contato, último recurso: tentar pelo chat
              profilePicUrl = await c.getProfilePicUrl().catch(() => null);
            }
          }
        } catch {
          // Ignorar erro ao buscar foto
        }

        return {
          id: chatId,
          name: chatName,
          instanceId: instanceId, // Garantir que instanceId está presente
          isGroup: !!c?.isGroup,
          unreadCount: c?.unreadCount || 0,
          lastMessage: c?.lastMessage?.body || null,
          lastTs: c?.lastMessage?.timestamp || 0,
          tags: dbChat?.tags || [],
          stage: dbChat?.stage || 'Entrada',
          profilePicUrl
        };
      };

      const tryFetch = async () => {
        // Garantir que o objeto injetado do whatsapp-web.js existe antes de chamar getChats()
        try {
          await this.ensureWWebJS(inst);
        } catch (e: any) {
          const errorMsg = String(e?.message || '');
          // Se o contexto foi perdido, lançar erro para usar fallback do DB
          if (/CONTEXT_LOST|RegistrationUtils|context/i.test(errorMsg)) {
            throw new Error('CONTEXT_LOST');
          }
          throw e;
        }
        const allChats = await inst.client.getChats();
        // Otimização: processar apenas os primeiros 300 chats para evitar timeout
        // (depois ainda filtra e pega só 200, mas processa menos)
        const chatsToProcess = allChats.slice(0, 300);
        const mapped = await Promise.all(chatsToProcess.map(mapChat));

        // Agora NÃO filtramos mais grupos: incluímos contatos individuais e grupos
        return mapped
          .filter((c: any) => !!c.id)
          .sort((a: any, b: any) => (b.lastTs || 0) - (a.lastTs || 0))
          .slice(0, 200);
      };

      try {
        // Tenta até 3 vezes em erros típicos de puppeteer
        let lastErr: any = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            let mapped = await tryFetch();
            inst.chatsCache = { ts: Date.now(), data: mapped };

            if (this.dbEnabled) {
              // Garantir que a instância existe antes de criar chats
              await this.prisma.whatsAppInstance.upsert({
                where: { id: instanceId },
                update: { status: inst.status },
                create: { id: instanceId, status: inst.status, userId: null }
              });

              await this.prisma.$transaction(
                mapped.map((c: any) =>
                  this.prisma.chat.upsert({
                    where: { id: c.id },
                    update: {
                      // Atualizar apenas campos que mudam do WhatsApp, PRESERVAR tags, stage e nome salvo
                      // NÃO atualizar nome no upsert - nome só é atualizado quando usuário edita manualmente ou quando é criado
                      // Se já existe um nome válido no banco, preservá-lo
                      isGroup: c.isGroup,
                      unreadCount: c.unreadCount,
                      lastMessage: c.lastMessage,
                      lastTs: c.lastTs
                      // tags, stage e name NÃO são atualizados aqui - só quando usuário editar manualmente
                    },
                    create: {
                      id: c.id,
                      instance: {
                        connect: { id: instanceId }
                      },
                      name: c.name || null, // Salvar nome quando criar
                      isGroup: c.isGroup,
                      unreadCount: c.unreadCount,
                      lastMessage: c.lastMessage,
                      lastTs: c.lastTs,
                      tags: c.tags || [],
                      stage: c.stage || 'Entrada'
                    }
                  })
                )
              );
              
              // Buscar novamente do banco para garantir tags, stage e nome preservados
              const dbChats = await this.prisma.chat.findMany({
                where: { instanceId, id: { in: mapped.map((c: any) => c.id) } },
                select: { id: true, tags: true, stage: true, name: true }
              });
              
              const dbChatsMap = new Map(dbChats.map((db: any) => [db.id, db]));
              
              // Atualizar mapped com dados do banco (preservar tags, stage e nome salvo)
              mapped = mapped.map((c: any) => {
                const dbChat = dbChatsMap.get(c.id);
                if (dbChat) {
                  // Preservar nome salvo no banco se existir e for válido
                  const savedName = dbChat.name;
                  const shouldUseSavedName = savedName && 
                                            savedName !== c.id && 
                                            !savedName.match(/^\d+@/) && 
                                            savedName.length >= 3;
                  
                  // Se tiver nome salvo válido no banco, usar ele; senão usar o nome que veio do WhatsApp
                  const finalName = shouldUseSavedName ? savedName : c.name;
                  
                  return {
                    ...c,
                    tags: dbChat.tags || [],
                    stage: dbChat.stage || 'Entrada',
                    name: finalName
                  };
                }
                return c;
              });
            }

            return mapped;
          } catch (e: any) {
            lastErr = e;
            const msg = String(e?.message || '');
            this.logger.warn(`getChats tentativa ${attempt}/3 falhou: ${msg}`);

            // Espera um pouco e tenta novamente
            if (/timed out|protocolTimeout|detached Frame|Target closed|Protocol error|Execution context|getChats|WWebJS|Store/i.test(msg)) {
              // Se o contexto quebrou, tenta reiniciar a instância (LocalAuth deve recuperar sem QR)
              if (/detached Frame|Target closed|Execution context|Store não encontrado|getChats|CONTEXT_LOST|RegistrationUtils/i.test(msg)) {
                try {
                  this.logger.warn(`[${instanceId}] Contexto perdido detectado, reiniciando instância...`);
                  await this.restartInstance(instanceId);
                  // Aguardar um pouco após reiniciar
                  await new Promise((r) => setTimeout(r, 5000));
                } catch (re) {
                  this.logger.warn(`[${instanceId}] restartInstance falhou: ${String((re as any)?.message || re)}`);
                  // Se reiniciar falhou, lançar erro para usar fallback do DB
                  throw new Error('Instância precisa ser reconectada manualmente');
                }
              }
              await new Promise((r) => setTimeout(r, 3000));
              continue;
            }
            throw e;
          }
        }
        throw lastErr;
      } catch (e: any) {
        const msg = String(e?.message || '');
        // Se o contexto foi perdido, tentar reiniciar antes de usar DB
        if (/CONTEXT_LOST|RegistrationUtils|context/i.test(msg)) {
          this.logger.warn(`[${instanceId}] Contexto perdido em getChats, tentando reiniciar...`);
          try {
            await this.restartInstance(instanceId);
            // Aguardar um pouco e tentar novamente
            await new Promise((r) => setTimeout(r, 5000));
            // Tentar uma vez mais
            try {
              await this.ensureWWebJS(inst);
              const allChats = await inst.client.getChats();
              const chatsToProcess = allChats.slice(0, 300);
              const mapped = await Promise.all(chatsToProcess.map(mapChat));
              return mapped
                .filter((c: any) => !!c.id)
                .sort((a: any, b: any) => (b.lastTs || 0) - (a.lastTs || 0))
                .slice(0, 200);
            } catch (retryError) {
              this.logger.warn(`[${instanceId}] Retry após reiniciar falhou, usando DB`);
            }
          } catch (restartError) {
            this.logger.warn(`[${instanceId}] Reiniciar falhou: ${String((restartError as any)?.message || restartError)}`);
          }
        }
        // Fallback: DB (se habilitado)
        if (this.dbEnabled) {
          this.logger.warn(`[${instanceId}] getChats falhou, usando DB. err=${msg}`);
          const dbChats = await this.prisma.chat.findMany({
            where: { instanceId },
            orderBy: { lastTs: 'desc' },
            take: 200,
            select: {
              id: true,
              name: true,
              isGroup: true,
              unreadCount: true,
              lastMessage: true,
              lastTs: true,
              tags: true,
              stage: true
            }
          });
          // Retornar chats do banco (sem profilePicUrl pois não está salvo no banco)
          return dbChats.map((c: any) => ({
            id: c.id,
            name: c.name,
            isGroup: c.isGroup,
            unreadCount: c.unreadCount,
            lastMessage: c.lastMessage,
            lastTs: c.lastTs,
            tags: c.tags || [],
            stage: c.stage || 'Entrada',
            profilePicUrl: null // Não temos foto no banco
          })); dbChats.map((c) => ({
            ...c,
            tags: c.tags || [],
            stage: c.stage || 'Entrada'
          }));
        }
        throw e;
      }
    })().finally(() => {
      this.chatsInFlight.delete(instanceId);
    });

    this.chatsInFlight.set(instanceId, promise);
    return await promise;
  }

  async getMessages(instanceId: string, chatId: string, limit = 50) {
    const inst = this.instances.get(instanceId);
    if (!inst) throw new Error('Instância não existe (ainda)');

    try {
      const chat = await inst.client.getChatById(chatId);
      const msgs = await chat.fetchMessages({ limit });
      // Mapear mensagens com detecção de mídia
      const mapped = await Promise.all(
        msgs.map(async (m: any) => {
          let hasMedia = false;
          let mediaType = null;
          try {
            if (m.hasMedia) {
              hasMedia = true;
              const media = await m.downloadMedia().catch(() => null);
              mediaType = media?.mimetype || null;
            }
          } catch {
            // Ignore
          }

          // Para grupos, tentar identificar o remetente (nome) para exibir na UI
          let senderName: string | null = null;
          try {
            const isGroup = (chat as any)?.isGroup;
            if (isGroup && !m.fromMe) {
              const contact = await m.getContact().catch(() => null);
              if (contact) {
                senderName =
                  contact.pushname ||
                  contact.name ||
                  // Alguns contatos só tem o número
                  (contact.number || null);
              }
            }
          } catch {
            // Ignorar falhas ao obter remetente
          }
          
          return {
            id: m.id._serialized,
            chatId,
            body: m.body || (hasMedia ? '[Mídia]' : null),
            fromMe: !!m.fromMe,
            from: m.from || null,
            to: m.to || null,
            ts: m.timestamp || 0,
            senderName,
            hasMedia,
            mediaType
          };
        })
      );
      
      mapped.sort((a: any, b: any) => (a.ts || 0) - (b.ts || 0));

      // Persistir best-effort
      if (this.dbEnabled) {
        // Garantir que a instância e o chat existem antes de salvar mensagens
        await this.prisma.whatsAppInstance.upsert({
          where: { id: instanceId },
          update: { status: inst.status },
          create: { id: instanceId, status: inst.status, userId: null }
        });

        // Verificar se o chat existe, se não existir, criar
        const chatExists = await this.prisma.chat.findUnique({
          where: { id: chatId },
          select: { id: true }
        });

        if (!chatExists) {
          // Criar chat básico se não existir
          await this.prisma.chat.create({
            data: {
              id: chatId,
              instance: {
                connect: { id: instanceId }
              },
              name: null,
              isGroup: false,
              unreadCount: 0,
              lastMessage: null,
              lastTs: 0,
              tags: [],
              stage: 'Entrada'
            }
          });
        }

        await this.prisma.$transaction(
          mapped.map((m: any) =>
            this.prisma.message.upsert({
              where: { id: m.id },
              update: {},
              create: {
                id: m.id,
                instance: {
                  connect: { id: instanceId }
                },
                chat: {
                  connect: { id: chatId }
                },
                body: m.body,
                fromMe: m.fromMe,
                from: m.from,
                to: m.to,
                ts: m.ts
              }
            })
          )
        );
      }

      return mapped;
    } catch (e: any) {
      const msg = String(e?.message || '');
      this.logger.warn(`getMessages falhou, usando DB. err=${msg}`);
      if (!this.dbEnabled) throw e;
      return await this.prisma.message.findMany({
        where: { instanceId, chatId },
        orderBy: { ts: 'asc' },
        take: limit,
        select: { id: true, chatId: true, body: true, fromMe: true, from: true, to: true, ts: true }
      });
    }
  }

  async sendMessage(instanceId: string, chatId: string, text: string, mediaUrl?: string, mediaType?: string, userId?: string) {
    const inst = this.instances.get(instanceId);
    if (!inst) throw new Error('Instância não existe (ainda)');
    
    // Atribuir conversa ao usuário se não tiver dono (1 conversa = 1 atendente)
    if (userId && this.dbEnabled) {
      try {
        const existing = await this.prisma.chat.findUnique({
          where: { id: chatId },
          select: { userId: true }
        });
        if (!existing?.userId) {
          // Atribuir ao primeiro que enviar mensagem
          await this.prisma.chat.update({
            where: { id: chatId },
            data: { userId }
          });
        }
      } catch (e) {
        // Ignore se falhar
      }
    }
    
    // Invalidar cache de chats para forçar atualização
    inst.chatsCache = null;
    
    let res: any;
    
    // Se houver mídia, enviar com anexo
    if (mediaUrl) {
      const { MessageMedia } = await import('whatsapp-web.js');
      let base64: string;
      let mimetype: string;
      
      // Se for data URL (base64), extrair direto
      if (mediaUrl.startsWith('data:')) {
        const match = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimetype = match[1];
          base64 = match[2];
        } else {
          throw new Error('Formato de mídia inválido');
        }
      } else {
        // Se for URL, fazer fetch
        try {
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(mediaUrl);
          const buffer = await response.buffer();
          mimetype = mediaType || response.headers.get('content-type') || 'image/jpeg';
          base64 = buffer.toString('base64');
        } catch (e) {
          throw new Error(`Erro ao baixar mídia: ${(e as Error).message}`);
        }
      }
      
      const media = new MessageMedia(mimetype, base64);
      
      // Enviar com mídia
      if (text) {
        res = await inst.client.sendMessage(chatId, media, { caption: text });
      } else {
        res = await inst.client.sendMessage(chatId, media);
      }
    } else {
      // Enviar apenas texto
      res = await inst.client.sendMessage(chatId, text);
    }
    
    // Atualizar lista de chats após enviar mensagem
    if (inst.emit) {
      try {
        const chat = await inst.client.getChatById(chatId);
        const lastMsg = mediaUrl ? (mediaType?.startsWith('image') ? '[Imagem]' : mediaType?.startsWith('video') ? '[Vídeo]' : '[Arquivo]') : text;
        
        // Buscar tags, stage e nome salvo do banco
        let tags: string[] = [];
        let stage = 'Entrada';
        let savedName: string | null = null;
        if (this.dbEnabled) {
          try {
            const dbChat = await this.prisma.chat.findUnique({
              where: { id: chatId },
              select: { tags: true, stage: true, name: true }
            });
            if (dbChat) {
              tags = dbChat.tags || [];
              stage = dbChat.stage || 'Entrada';
              // Usar nome salvo no banco se for válido
              if (dbChat.name && 
                  dbChat.name !== chatId && 
                  !dbChat.name.match(/^\d+@/) && 
                  dbChat.name.length >= 3) {
                savedName = dbChat.name;
              }
            }
          } catch (e) {
            // Ignore
          }
        }
        
        // Priorizar nome salvo no banco, senão usar do WhatsApp
        const finalName = savedName || chat.name || null;
        
        inst.emit('wa:chat_updated', {
          instanceId,
          chatId,
          chat: {
            id: chatId,
            name: finalName, // Usar nome salvo no banco ou do WhatsApp
            isGroup: !!chat.isGroup,
            unreadCount: chat.unreadCount || 0,
            lastMessage: lastMsg,
            lastTs: Math.floor(Date.now() / 1000),
            tags, // Incluir tags do banco
            stage // Incluir stage do banco
          }
        });
      } catch (e) {
        // Ignore se falhar, mensagem já foi enviada
      }
    }
    
    return { id: res.id._serialized };
  }

  async updateChatTags(instanceId: string, chatId: string, tags: string[], userId?: string) {
    if (!this.dbEnabled) {
      // Modo dev: retornar dados mockados
      return {
        id: chatId,
        tags,
        stage: 'Entrada',
        name: null,
        isGroup: false,
        unreadCount: 0,
        lastMessage: null,
        lastTs: 0
      };
    }
    
    // Atualizar tags e atribuir ao usuário se não tiver userId ainda
    const updateData: any = { tags };
    if (userId) {
      // Se o chat não tem userId, atribuir ao usuário que está editando
      const existing = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: { userId: true }
      });
      if (!existing?.userId) {
        updateData.userId = userId;
      }
    }
    
    const chat = await this.prisma.chat.update({
      where: { id: chatId },
      data: updateData,
      select: { id: true, tags: true, stage: true, name: true, isGroup: true, unreadCount: true, lastMessage: true, lastTs: true, userId: true }
    });
    
    // Verificar se nome é válido (não é ID) e preservar ou buscar do WhatsApp
    let finalName = chat.name;
    if (!finalName || finalName === chatId || finalName.match(/^\d+@/) || finalName.length < 3) {
      // Nome inválido, tentar buscar do WhatsApp se possível
      try {
        const inst = this.instances.get(instanceId);
        if (inst?.client) {
          const waChat = await inst.client.getChatById(chatId).catch(() => null);
          if (waChat?.name && 
              waChat.name !== chatId && 
              !waChat.name.match(/^\d+@/) && 
              waChat.name.length >= 3) {
            finalName = waChat.name;
            // Atualizar nome no banco se for válido
            await this.prisma.chat.update({
              where: { id: chatId },
              data: { name: finalName }
            });
          }
        }
      } catch {
        // Ignorar erro
      }
    }
    
    // Emitir evento para atualizar frontend
    const inst = this.instances.get(instanceId);
    if (inst?.emit) {
      inst.emit('wa:chat_updated', {
        instanceId,
        chatId,
        chat: {
          id: chatId,
          name: finalName || null, // Usar nome válido
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          lastMessage: chat.lastMessage,
          lastTs: chat.lastTs,
          tags: chat.tags,
          stage: chat.stage
        }
      });
    }
    
    return {
      ...chat,
      name: finalName || null
    };
  }

  async updateChatStage(instanceId: string, chatId: string, stage: string, userId?: string) {
    if (!this.dbEnabled) {
      // Modo dev: retornar dados mockados
      return {
        id: chatId,
        tags: [],
        stage,
        name: null,
        isGroup: false,
        unreadCount: 0,
        lastMessage: null,
        lastTs: 0
      };
    }

    const validStages = ['Entrada', 'Contatado', 'Negociação', 'Ganho', 'Perdido'];
    if (!validStages.includes(stage)) {
      throw new Error(`Estágio inválido. Use um dos: ${validStages.join(', ')}`);
    }
    
    // Atualizar stage e atribuir ao usuário se não tiver userId ainda
    const updateData: any = { stage };
    if (userId) {
      const existing = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: { userId: true }
      });
      if (!existing?.userId) {
        updateData.userId = userId;
      }
    }
    
    const chat = await this.prisma.chat.update({
      where: { id: chatId },
      data: updateData,
      select: { id: true, tags: true, stage: true, name: true, isGroup: true, unreadCount: true, lastMessage: true, lastTs: true, userId: true }
    });
    
    // Verificar se nome é válido e preservar ou buscar do WhatsApp
    let finalName = chat.name;
    if (!finalName || finalName === chatId || finalName.match(/^\d+@/) || finalName.length < 3) {
      try {
        const inst = this.instances.get(instanceId);
        if (inst?.client) {
          const waChat = await inst.client.getChatById(chatId).catch(() => null);
          if (waChat?.name && 
              waChat.name !== chatId && 
              !waChat.name.match(/^\d+@/) && 
              waChat.name.length >= 3) {
            finalName = waChat.name;
            await this.prisma.chat.update({
              where: { id: chatId },
              data: { name: finalName }
            });
          }
        }
      } catch {
        // Ignorar erro
      }
    }
    
    // Emitir evento para atualizar frontend
    const inst = this.instances.get(instanceId);
    if (inst?.emit) {
      inst.emit('wa:chat_updated', {
        instanceId,
        chatId,
        chat: {
          id: chatId,
          name: finalName || null,
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          lastMessage: chat.lastMessage,
          lastTs: chat.lastTs,
          tags: chat.tags,
          stage: chat.stage
        }
      });
    }
    
    return {
      ...chat,
      name: finalName || null
    };
  }

  async getContactInfo(instanceId: string, chatId: string) {
    const inst = this.instances.get(instanceId);
    if (!inst) throw new Error('Instância não existe (ainda)');

    try {
      const chat = await inst.client.getChatById(chatId);
      let contact = null;
      let profilePicUrl = null;
      let number = null;

      if (!chat.isGroup) {
        try {
          contact = await chat.getContact();
          number = contact.number || chatId.split('@')[0];
          
          // Tentar buscar foto do perfil
          try {
            const profilePic = await contact.getProfilePicUrl();
            profilePicUrl = profilePic || null;
          } catch {
            // Ignore se não tiver foto
          }
        } catch (e) {
          // Se falhar, usar ID do chat
          number = chatId.split('@')[0];
        }
      }

      // Buscar histórico de mensagens do banco
      let messageCount = 0;
      let firstMessageDate = null;
      let lastMessageDate = null;
      if (this.dbEnabled) {
        try {
          const messageStats = await this.prisma.message.aggregate({
            where: { chatId },
            _count: { id: true },
            _min: { ts: true },
            _max: { ts: true }
          });
          
          messageCount = messageStats._count.id || 0;
          if (messageStats._min.ts) {
            firstMessageDate = new Date(messageStats._min.ts * 1000).toISOString();
          }
          if (messageStats._max.ts) {
            lastMessageDate = new Date(messageStats._max.ts * 1000).toISOString();
          }
        } catch {
          // Ignore se falhar
        }
      }

      return {
        chatId,
        name: chat.name || contact?.name || contact?.pushname || number,
        number: number || chatId.split('@')[0],
        isGroup: chat.isGroup,
        profilePicUrl,
        messageCount,
        firstMessageDate,
        lastMessageDate,
        isBusiness: contact?.isBusiness || false,
        isMyContact: contact?.isMyContact || false
      };
    } catch (e: any) {
      throw new Error(`Erro ao buscar informações do contato: ${e.message}`);
    }
  }

  async getMetrics() {
    if (!this.dbEnabled) {
      // Modo dev: retornar dados mockados
      return {
        totalChats: 0,
        totalMessages: 0,
        totalUsers: 1,
        chatsByStage: {},
        chatsByUser: {},
        averageResponseTime: 0,
        conversionRate: 0
      };
    }

    try {
      // Total de chats e mensagens
      const totalChats = await this.prisma.chat.count();
      const totalMessages = await this.prisma.message.count();
      const totalUsers = await this.prisma.user.count();

      // Chats por estágio do funil
      const chatsByStage = await this.prisma.chat.groupBy({
        by: ['stage'],
        _count: { id: true },
        where: {
          stage: { not: null }
        }
      });

      // Chats por usuário (atendente)
      const chatsByUser = await this.prisma.chat.groupBy({
        by: ['userId'],
        _count: { id: true },
        where: {
          userId: { not: null }
        }
      });

      // Buscar nomes dos usuários
      const userIds = chatsByUser.map((c) => c.userId).filter((id): id is string => !!id);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, role: true }
      });
      const userMap = new Map(users.map((u) => [u.id, u.name]));

      // Calcular tempo médio de resposta (aproximado)
      // Pegar primeiras mensagens de cada atendente e calcular diferença
      let averageResponseTime = 0;
      try {
        const firstMessages = await this.prisma.message.findMany({
          where: {
            fromMe: true,
            ts: { gte: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000) } // Últimos 7 dias
          },
          select: { ts: true, chatId: true },
          orderBy: { ts: 'asc' },
          take: 1000
        });

        if (firstMessages.length > 0) {
          // Calcular tempo médio aproximado (simplificado)
          const times: number[] = [];
          for (const msg of firstMessages) {
            const chatMessages = await this.prisma.message.findMany({
              where: { chatId: msg.chatId, ts: { lte: msg.ts } },
              orderBy: { ts: 'desc' },
              take: 2
            });

            if (chatMessages.length >= 2) {
              const diff = chatMessages[0].ts - chatMessages[1].ts;
              if (diff > 0 && diff < 86400) { // Menos de 1 dia
                times.push(diff);
              }
            }
          }

          if (times.length > 0) {
            averageResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length / 60); // Em minutos
          }
        }
      } catch {
        // Ignore se falhar
      }

      // Taxa de conversão (Ganho / Total)
      const wonChats = await this.prisma.chat.count({
        where: { stage: 'Ganho' }
      });
      const totalActiveChats = await this.prisma.chat.count({
        where: {
          stage: { in: ['Contatado', 'Negociação', 'Ganho', 'Perdido'] }
        }
      });
      const conversionRate = totalActiveChats > 0 ? (wonChats / totalActiveChats) * 100 : 0;

      return {
        totalChats,
        totalMessages,
        totalUsers,
        chatsByStage: Object.fromEntries(
          chatsByStage.map((s) => [s.stage || 'Sem estágio', s._count.id])
        ),
        chatsByUser: Object.fromEntries(
          chatsByUser.map((c) => [userMap.get(c.userId!) || 'Sem atendente', c._count.id])
        ),
        averageResponseTime, // Em minutos
        conversionRate: Math.round(conversionRate * 100) / 100 // Arredondar para 2 casas
      };
    } catch (e: any) {
      throw new Error(`Erro ao calcular métricas: ${e.message}`);
    }
  }
}


