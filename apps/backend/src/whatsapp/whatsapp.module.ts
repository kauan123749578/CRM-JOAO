import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppGateway } from './whatsapp.gateway';
import { WhatsAppController } from './whatsapp.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatOwnerGuard } from '../auth/chat-owner.guard';

@Module({
  imports: [PrismaModule],
  providers: [WhatsAppService, WhatsAppGateway, ChatOwnerGuard],
  controllers: [WhatsAppController],
  exports: [WhatsAppService]
})
export class WhatsAppModule {}


