import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StudyRemindController } from './study-remind.controller';
import { StudyRemindService } from './study-remind.service';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [PrismaModule, GoogleModule],
  controllers: [StudyRemindController],
  providers: [StudyRemindService],
  exports: [StudyRemindService]
})
export class StudyRemindModule {}
