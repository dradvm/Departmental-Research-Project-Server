import { ApiRequestData } from 'src/common/base/api.request';
import { MessageService } from './message.service';
import { Controller, Get, Param, ParseIntPipe, Req } from '@nestjs/common';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('threads')
  getThreads(@Req() req: ApiRequestData) {
    return this.messageService.getThreads(req.user.userId);
  }

  @Get('threads/:otherUserId')
  getThread(@Param('otherUserId', ParseIntPipe) otherUserId: number) {
    return this.messageService.getThread(otherUserId);
  }
  @Get('count-not-seen')
  getCountNotSeenMessage(@Req() req: ApiRequestData) {
    return this.messageService.getCountNotSeenMessage(req.user.userId);
  }
  @Get('/:otherUserId')
  getMessages(
    @Req() req: ApiRequestData,
    @Param('otherUserId', ParseIntPipe) otherUserId: number
  ) {
    return this.messageService.getMessages(req.user.userId, otherUserId);
  }
}
