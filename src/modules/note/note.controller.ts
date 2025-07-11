import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req
} from '@nestjs/common';
import { NoteService } from './note.service';
import { ApiRequestData } from 'src/common/base/api.request';
import { CreateNoteDTO, UpdateNoteDTO } from './dto/note';

@Controller('notes')
export class NoteController {
  constructor(private noteService: NoteService) {}

  @Get('')
  getNotes(
    @Query('courseId', ParseIntPipe) courseId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Req() req: ApiRequestData
  ) {
    return this.noteService.getNotes(req.user.userId, courseId, orderBy);
  }
  @Get('/lecture')
  getNotesLecture(
    @Query('lectureId', ParseIntPipe) lectureId: number,
    @Query('orderBy', ParseBoolPipe) orderBy: boolean,
    @Req() req: ApiRequestData
  ) {
    return this.noteService.getNotesLecture(
      req.user.userId,
      lectureId,
      orderBy
    );
  }

  @Get('/:noteId')
  getNote(@Param('noteId', ParseIntPipe) noteId: number) {
    return this.noteService.getNote(noteId);
  }

  @Post('')
  addNote(@Body() createNoteDTO: CreateNoteDTO, @Req() req: ApiRequestData) {
    return this.noteService.addNote(createNoteDTO, req.user.userId);
  }

  @Patch('')
  updateNote(@Body() updateNoteDTO: UpdateNoteDTO) {
    return this.noteService.updateNote(updateNoteDTO);
  }

  @Delete('/:noteId')
  deleteNote(@Param('noteId', ParseIntPipe) noteId: number) {
    return this.noteService.deleteNote(noteId);
  }
}
