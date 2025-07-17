import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req
} from '@nestjs/common';
import { ApiRequestData } from 'src/common/base/api.request';
import { StudyRemindService } from './study-remind.service';
import { GoogleService } from '../google/google.service';
import { StudyRemind } from '@prisma/client';

@Controller('study-remind')
export class StudyRemindController {
  constructor(
    private readonly studyRemindService: StudyRemindService,
    private readonly googleService: GoogleService
  ) {}

  @Get('')
  getAll(@Req() req: ApiRequestData) {
    return this.studyRemindService.getAll(req.user.userId);
  }

  @Post('')
  async createStudyRemind(
    @Body()
    body: {
      code: string;
      summary: string;
      description?: string;
      start: string;
      end: string;
      frequency: string;
      daysOfWeek?: string[];
      timeZone: string;
    },
    @Req() req: ApiRequestData
  ) {
    await this.googleService.exchangeCode(body.code);

    let recurrence: string[] | undefined;

    if (body.frequency === 'daily') {
      recurrence = ['RRULE:FREQ=DAILY'];
    } else if (body.frequency === 'weekly') {
      if (!body.daysOfWeek || body.daysOfWeek.length === 0) {
        throw new Error('Cần cung cấp daysOfWeek khi frequency là "weekly"');
      }
      const byDay = body.daysOfWeek.join(',');
      recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`];
    }

    const createdEvent = await this.googleService.createEvent({
      summary: body.summary,
      description: body.description,
      start: body.start,
      end: body.end,
      recurrence,
      timeZone: body.timeZone
    });

    // Ensure frequency is of the correct type
    const frequency: 'onetime' | 'daily' | 'weekly' = body.frequency as
      | 'onetime'
      | 'daily'
      | 'weekly';

    return this.studyRemindService.addStudyRemind(
      req.user.userId,
      createdEvent?.id ?? '',
      body.summary,
      body.start,
      frequency,
      body.description,
      body.daysOfWeek?.join(','),
      recurrence?.join(',')
    );
  }

  @Post('sync')
  async resyncStudyRemind(
    @Body() body: { code: string; studyRemindId: number }
  ) {
    return this.studyRemindService.updateStudyRemind(
      body.studyRemindId,
      body.code
    );
  }
  @Delete('/:studyRemindId')
  async deleteStudyRemind(
    @Param('studyRemindId', ParseIntPipe) studyRemindId: number,
    @Query('code') code: string
  ) {
    return this.studyRemindService.deleteStudyRemind(studyRemindId, code);
  }
}
