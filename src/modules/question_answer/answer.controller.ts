import { Controller } from '@nestjs/common';
import { AnswerService } from './answer.service';

Controller();
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}
}
