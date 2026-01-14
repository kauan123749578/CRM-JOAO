import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhatsAppService } from './whatsapp.service';
import type { SendMessageDto, UpdateChatTagsDto, UpdateChatStageDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatOwnerGuard } from '../auth/chat-owner.guard';
import { ChatSenderGuard } from '../auth/chat-sender.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Public, Roles } from '../auth/decorators';

@Controller('api')
export class WhatsAppController {
  constructor(private readonly wa: WhatsAppService) {}

  @Public()
  @Get('instances')
  list() {
    return this.wa.listInstances();
  }

  @Get('instances/:instanceId/chats')
  async chats(@Param('instanceId') instanceId: string) {
    // Se ainda não existe, retorna 503 pra UI poder retry
    const inst = this.wa.getInstance(instanceId);
    if (!inst) {
      throw new HttpException(
        { error: 'Instância ainda não inicializada. Clique em Conectar e tente novamente.' },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
    try {
      return await this.wa.getChats(instanceId);
    } catch (e: any) {
      const msg = String(e?.message || '');
      // Erros transitórios do whatsapp-web.js/puppeteer -> 503 (UI faz retry)
      if (/timed out|protocolTimeout|detached Frame|Target closed|Protocol error|Execution context|getChats|WWebJS|Store/i.test(msg)) {
        throw new HttpException({ error: msg }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      throw e;
    }
  }

  @Get('instances/:instanceId/chats/:chatId/messages')
  async messages(
    @Param('instanceId') instanceId: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string
  ) {
    const n = Number.parseInt(limit || '1000', 10);
    // Limitar a 1000 mensagens por vez para evitar timeout
    const finalLimit = Number.isFinite(n) && n > 0 && n <= 1000 ? n : 1000;
    // Se ainda não existe, retorna 503 (evita 500 no log e a UI pode retry depois)
    const inst = this.wa.getInstance(instanceId);
    if (!inst) {
      throw new HttpException(
        { error: 'Instância ainda não inicializada. Clique em Conectar e tente novamente.' },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
    try {
      return await this.wa.getMessages(instanceId, decodeURIComponent(chatId), finalLimit);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/timed out|protocolTimeout|detached Frame|Target closed|Protocol error|Execution context/i.test(msg)) {
        throw new HttpException({ error: msg }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, ChatSenderGuard)
  @Post('instances/:instanceId/send')
  async send(
    @Param('instanceId') instanceId: string,
    @Body() body: SendMessageDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    return await this.wa.sendMessage(
      instanceId,
      body.chatId,
      body.text || '',
      body.mediaUrl,
      body.mediaType,
      userId
    );
  }

  @UseGuards(JwtAuthGuard, ChatSenderGuard)
  @Post('instances/:instanceId/send-media')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
      // Aceitar imagens, vídeos, áudios e documentos
      const allowed = /\.(jpg|jpeg|png|gif|mp4|mov|avi|mp3|wav|pdf|doc|docx|xls|xlsx)$/i;
      if (allowed.test(file.originalname) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de arquivo não permitido'), false);
      }
    }
  }))
  async sendMedia(
    @Param('instanceId') instanceId: string,
    @Body('chatId') chatId: string,
    @Body('text') text: string,
    @UploadedFile() file: any,
    @Request() req: any
  ) {
    if (!file || !file.buffer) {
      throw new HttpException('Arquivo não enviado', HttpStatus.BAD_REQUEST);
    }

    if (!chatId) {
      throw new HttpException('chatId é obrigatório', HttpStatus.BAD_REQUEST);
    }

    try {
      // Converter arquivo para base64
      const base64 = file.buffer.toString('base64');
      const mediaUrl = `data:${file.mimetype};base64,${base64}`;
      const userId = req.user?.id;
      
      return await this.wa.sendMessage(
        instanceId,
        chatId,
        text || '',
        mediaUrl,
        file.mimetype,
        userId
      );
    } catch (e: any) {
      throw new HttpException(`Erro ao enviar mídia: ${e.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, ChatOwnerGuard)
  @Patch('instances/:instanceId/chats/:chatId/tags')
  async updateTags(
    @Param('instanceId') instanceId: string,
    @Param('chatId') chatId: string,
    @Body() body: UpdateChatTagsDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    return await this.wa.updateChatTags(instanceId, decodeURIComponent(chatId), body.tags, userId);
  }

  @UseGuards(JwtAuthGuard, ChatOwnerGuard)
  @Patch('instances/:instanceId/chats/:chatId/stage')
  async updateStage(
    @Param('instanceId') instanceId: string,
    @Param('chatId') chatId: string,
    @Body() body: UpdateChatStageDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    return await this.wa.updateChatStage(instanceId, decodeURIComponent(chatId), body.stage, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('instances/:instanceId/chats/:chatId/contact')
  async getContact(
    @Param('instanceId') instanceId: string,
    @Param('chatId') chatId: string
  ) {
    try {
      return await this.wa.getContactInfo(instanceId, decodeURIComponent(chatId));
    } catch (e: any) {
      throw new HttpException({ error: e.message || 'Erro ao buscar informações do contato' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('metrics')
  async getMetrics(@Request() req: any) {
    try {
      return await this.wa.getMetrics();
    } catch (e: any) {
      throw new HttpException({ error: e.message || 'Erro ao buscar métricas' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}


