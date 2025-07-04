import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
  exports: [MessageService]
})
export class MessageModule {}
