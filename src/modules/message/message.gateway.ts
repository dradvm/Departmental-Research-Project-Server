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
import { ConnectedService } from './connected.service';

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
  constructor(
    private messageService: MessageService,
    private connectedService: ConnectedService
  ) {}

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

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket
  ) {
    this.connectedService.addUser(client.id, data.userId);
  }

  @SubscribeMessage('joinThread')
  async handleJoinThread(
    @MessageBody() data: { userId: number; threadId: number },
    @ConnectedSocket() client: Socket
  ) {
    await client.join(getRoomId(data.userId, data.threadId));
    this.messageService
      .seenMessage(data.userId, data.threadId)
      .then(() => {
        const senderSockets = this.connectedService.getSocketIdsByUserId(
          data.threadId
        );
        const receiverSocket = this.connectedService.getSocketIdsByUserId(
          data.userId
        );
        if (senderSockets.length > 0) {
          senderSockets.map((socket) => {
            this.server.sockets.sockets.get(socket)?.emit('receiveThread');
          });
        }
        if (receiverSocket.length > 0) {
          receiverSocket.map((socket) => {
            this.server.sockets.sockets.get(socket)?.emit('receiveThread');
          });
        }
      })
      .catch((err) => console.log(err));
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody()
    data: { userSenderId: number; userReceiverId: number; message: string },
    @ConnectedSocket() client: Socket
  ) {
    this.messageService
      .addMessage(
        data.userSenderId,
        data.userReceiverId,
        data.message,
        this.server.sockets.adapter.rooms.get(
          getRoomId(data.userSenderId, data.userReceiverId)
        )?.size == 2
          ? new Date()
          : null
      )
      .then((message) => {
        this.server
          .to(getRoomId(data.userReceiverId, data.userSenderId))
          .emit('receiveMessage', message);
        const senderSockets = this.connectedService.getSocketIdsByUserId(
          data.userSenderId
        );
        const receiverSocket = this.connectedService.getSocketIdsByUserId(
          data.userReceiverId
        );
        if (senderSockets.length > 0) {
          senderSockets.map((socket) => {
            this.server.sockets.sockets.get(socket)?.emit('receiveThread');
          });
        }
        if (receiverSocket.length > 0) {
          receiverSocket.map((socket) => {
            this.server.sockets.sockets.get(socket)?.emit('receiveThread');
          });
        }
      })
      .catch((err) => console.log(err));

    // phát lại cho các client trong cùng thread
    // this.server.to(msg.threadId).emit('message', saved);
  }
}
