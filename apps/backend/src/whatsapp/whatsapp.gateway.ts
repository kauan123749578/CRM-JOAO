import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { WhatsAppService } from './whatsapp.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  transports: ['polling', 'websocket']
})
export class WhatsAppGateway {
  @WebSocketServer() server!: Server;

  constructor(private readonly wa: WhatsAppService) {}

  private emit = (event: string, payload: any) => {
    this.server.emit(event, payload);
  };

  @SubscribeMessage('wa:connect')
  async connectInstance(@MessageBody() body: { instanceId: string }, @ConnectedSocket() socket: Socket) {
    const instanceId = (body?.instanceId || 'wa1').trim();
    await this.wa.getOrCreate(instanceId, this.emit);
    socket.emit('wa:status', { instanceId, status: 'connecting', message: 'Inicializando...' });
    return { ok: true };
  }
}


