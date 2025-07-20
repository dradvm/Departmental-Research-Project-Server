import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  getThreads(userId: number) {
    console.log(userId);
    return this.prisma.user.findMany({
      where: {
        userId: {
          not: userId
        },
        OR: [
          {
            Message_Message_userReceiverIdToUser: {
              some: {
                userSenderId: userId
              }
            }
          },
          {
            Message_Message_userSenderIdToUser: {
              some: {
                userReceiverId: userId
              }
            }
          }
        ]
      },
      select: {
        userId: true,
        name: true,
        img: true,
        isDeleted: true,
        isActive: true,

        Message_Message_userSenderIdToUser: {
          where: {
            userReceiverId: userId
          },
          orderBy: {
            timeSend: 'desc'
          },
          take: 1
        },
        Message_Message_userReceiverIdToUser: {
          where: {
            userSenderId: userId
          },
          orderBy: {
            timeSend: 'desc'
          },
          take: 1
        }
      }
    });
  }
  getThread(userId: number) {
    return this.prisma.user.findFirst({
      where: {
        userId: userId
      },
      select: {
        userId: true,
        name: true,
        img: true,
        isDeleted: true,
        isActive: true
      }
    });
  }
  getMessages(userId: number, otherUserId: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          {
            userSenderId: userId,
            userReceiverId: otherUserId
          },
          {
            userSenderId: otherUserId,
            userReceiverId: userId
          }
        ]
      },
      orderBy: [{ timeSend: 'asc' }, { messageId: 'asc' }]
    });
  }
  addMessage(
    userSenderId: number,
    userReceiverId: number,
    message: string,
    seenAt: Date | null
  ) {
    return this.prisma.message.create({
      data: {
        userSenderId: userSenderId,
        userReceiverId: userReceiverId,
        message: message,
        seenAt: seenAt
      }
    });
  }
  seenMessage(userId: number, threadId: number) {
    return this.prisma.message.updateMany({
      where: {
        userSenderId: threadId,
        userReceiverId: userId
      },
      data: {
        seenAt: new Date()
      }
    });
  }
}
