# learn-socketio-ui

Practice Socket.io with Angular and NestJS

UI: https://github.com/lightzane/learn-socketio-ui <br>
API: https://github.com/lightzane/learn-socketio-api

```
git clone https://github.com/lightzane/learn-socketio-ui
git clone https://github.com/lightzane/learn-socketio-api
```

# Install Socket.io in SERVER first

Go to Nest app or `API`

```
npm i @nestjs/websockets @nestjs/platform-socket.io
```

# Check version of installed Socket.io

```
npm ls socket.io
```

You will get output like `socket.io@4.5.1`

# Install Socket.io in CLIENT

Go to Angular app or `UI`

```
npm i socket.io-client@4.5.1
```

# Generate Gateways in Server

```
npx nest g resource chat
```

Select `Websockets` then modify the `chat.gateway.ts`

```ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ClientEmitType, ServerEmitType } from '../shared/types';
import { MessageDto } from '../shared/dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.debug(`${client.id} is now connected...`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.warn(`${client.id} disconnected...`);
  }

  @SubscribeMessage<ClientEmitType>('send-message')
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MessageDto,
  ): boolean {
    const { room } = dto;
    if (room) {
      client.broadcast.to(room).emit<ServerEmitType>('message-received', dto);
    } else {
      client.broadcast.emit<ServerEmitType>('message-received', dto);
    }
    return true;
  }

  @SubscribeMessage<ClientEmitType>('create-room')
  createRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomName: string,
  ): boolean {
    client.join(roomName);
    this.logger.log(`${client.id} is entering room: ${roomName}`);
    return true;
  }

  @SubscribeMessage<ClientEmitType>('leave-room')
  leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomName: string,
  ): boolean {
    client.leave(roomName);
    this.logger.log(`${client.id} is leaving room: ${roomName}`);
    return true;
  }
}
```

# Modify the CLIENT Socket

**socket.service.ts**

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { MessageDto } from '../dto';
import { ClientEmitType, ServerEmitType } from '../types';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket;

  constructor() {
    this.socket = io();
  }

  emit(event: ClientEmitType, dto: any): void {
    this.socket.emit(event, dto);
  }

  sendMessage(dto: MessageDto): void {
    this.emit('send-message', dto);
  }

  onMessageReceived(): Observable<MessageDto> {
    return new Observable<MessageDto>((obs) => {
      this.socket.on<ServerEmitType>('message-received', (dto: MessageDto) => {
        obs.next(dto);
      });
    });
  }

  createRoom(roomName: string): void {
    this.emit('create-room', roomName);
  }

  leaveRoom(roomName: string): void {
    this.emit('leave-room', roomName);
  }
}
```

# Update necessary changes in the UI

See completed project for both `UI` and `API`:

```
git checkout complete
```

# Other references

- https://github.com/lightzane/learn-nestjs-gateways
