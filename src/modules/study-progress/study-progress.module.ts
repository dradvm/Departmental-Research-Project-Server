import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StudyProgressController } from './study-progress.controller';
import { StudyProgressService } from './study-progress.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudyProgressController],
  providers: [StudyProgressService],
  exports: [StudyProgressService]
})
export class StudyProgressModule {}
