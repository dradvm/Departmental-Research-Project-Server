import { Injectable } from '@nestjs/common';

@Injectable()
export class ConnectedService {
  // socketId -> userId
  private socketToUser = new Map<string, number>();

  // userId -> Set of socketIds
  private userToSockets = new Map<number, Set<string>>();

  addUser(socketId: string, userId: number) {
    this.socketToUser.set(socketId, userId);

    if (!this.userToSockets.has(userId)) {
      this.userToSockets.set(userId, new Set());
    }

    this.userToSockets.get(userId)!.add(socketId);
  }

  removeUser(socketId: string) {
    const userId = this.socketToUser.get(socketId);
    if (userId !== undefined) {
      this.socketToUser.delete(socketId);

      const socketSet = this.userToSockets.get(userId);
      socketSet?.delete(socketId);
      if (socketSet?.size === 0) {
        this.userToSockets.delete(userId);
      }
    }
  }

  getUserIdBySocketId(socketId: string): number | undefined {
    return this.socketToUser.get(socketId);
  }

  getSocketIdsByUserId(userId: number): string[] {
    return Array.from(this.userToSockets.get(userId) || []);
  }

  getAllUserIds(): number[] {
    return Array.from(this.userToSockets.keys());
  }
}
