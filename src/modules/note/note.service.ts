import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoteDTO, UpdateNoteDTO } from './dto/note';

@Injectable()
export class NoteService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotes(userId: number, courseId: number) {
    return this.prisma.note.findMany({
      where: {
        userId: userId,
        Lecture: {
          Section: {
            Course: {
              courseId: courseId
            }
          }
        }
      },
      include: {
        Lecture: {
          include: {
            Section: true
          }
        }
      }
    });
  }

  async getNote(noteId: number) {
    return this.prisma.note.findUnique({
      where: {
        noteId: noteId
      }
    });
  }

  async addNote(note: CreateNoteDTO, userId: number) {
    return this.prisma.note.create({
      data: {
        ...note,
        userId: userId
      }
    });
  }
  async updateNote(note: UpdateNoteDTO) {
    return this.prisma.note.update({
      where: {
        noteId: note.noteId
      },
      data: {
        note: note.note
      }
    });
  }
  async deleteNote(noteId: number) {
    return this.prisma.note.delete({
      where: {
        noteId: noteId
      }
    });
  }
}
