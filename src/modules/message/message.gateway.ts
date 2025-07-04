import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { threadId } from 'worker_threads';

function getRoomId(userA: string | number, userB: string | number): string {
  const [a, b] = [userA, userB].sort();
  return `room:${a}-${b}`;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private messageService: MessageService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // const userId = client.handshake.query.userId;
    // console.log(`User ${userId} connected`);
    // client.join(userId); // Join room by user ID
  }

  handleDisconnect(client: Socket) {
    // const userId = client.handshake.query.userId;
    // console.log(`User ${userId} disconnected`);
  }

  @SubscribeMessage('joinThread')
  async handleJoinThread(
    @MessageBody() data: { userId: number; threadId: number },
    @ConnectedSocket() client: Socket
  ) {
    await client.join(getRoomId(data.userId, data.threadId));
    const sockets = await this.server
      .in(getRoomId(data.userId, data.threadId))
      .fetchSockets();
    const userIds = sockets.map((s) => s.id);

    console.log(
      `Users in room ${getRoomId(data.userId, data.threadId)}:`,
      userIds
    );
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody()
    data: { userSenderId: number; userReceiverId: number; message: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log(data);
    this.messageService
      .addMessage(data.userSenderId, data.userReceiverId, data.message)
      .then((message) => {
        this.server
          .to(getRoomId(data.userReceiverId, data.userSenderId))
          .emit('receiveMessage', message);
      })
      .catch((err) => console.log(err));

    // phát lại cho các client trong cùng thread
    // this.server.to(msg.threadId).emit('message', saved);
  }
}
