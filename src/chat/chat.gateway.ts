import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ClientEmitType, ServerEmitType } from '../shared/types';
import { MessageDto } from '../shared/dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) { }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.debug(`${client.id} is now connected...`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.warn(`${client.id} disconnected...`);
  }

  @SubscribeMessage<ClientEmitType>('send-message')
  sendMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: MessageDto): boolean {
    const { room } = dto;
    if (room) {
      client.broadcast.to(room).emit<ServerEmitType>('message-received', dto);
    } else {
      client.broadcast.emit<ServerEmitType>('message-received', dto);
    }
    return true;
  }

  @SubscribeMessage<ClientEmitType>('create-room')
  createRoom(@ConnectedSocket() client: Socket, @MessageBody() roomName: string): boolean {
    client.join(roomName);
    this.logger.log(`${client.id} is entering room: ${roomName}`);
    return true;
  }

  @SubscribeMessage<ClientEmitType>('leave-room')
  leaveRoom(@ConnectedSocket() client: Socket, @MessageBody() roomName: string): boolean {
    client.leave(roomName);
    this.logger.log(`${client.id} is leaving room: ${roomName}`);
    return true;
  }

}
