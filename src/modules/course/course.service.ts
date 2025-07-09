import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { Course, Prisma } from '@prisma/client';
@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) { }

  async findAll(): Promise<Course[]> {
    return this.prisma.course.findMany();
  }

  async findById(courseId: number): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { courseId: courseId },
      include: {
        Section: {
          include: {
            Lecture: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
  }

  async createCourseWithContent(dto: CreateCourseDto, videos: Express.Multer.File[], thumbnailUrl?: string) {
    let videoIndex = 0;

    return this.prisma.course.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        subTitle: dto.subTitle,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        isPublic: dto.isPublic ?? false,
        thumbnail: thumbnailUrl,
        Section: {
          create: await Promise.all(
            dto.sections.map(async (section, sectionIndex) => ({
              nameSection: section.nameSection,
              order: section.order ?? sectionIndex + 1,
              Lecture: {
                create: await Promise.all(
                  section.lectures.map(async (lecture, lectureIndex) => {
                    let videoUrl = '';
                    const file = videos[videoIndex++];
                    if (file) {
                      const uploadResult = await this.cloudinaryService.uploadVideo(file, 'lectures');
                      videoUrl = uploadResult.secure_url;
                    }

                    return {
                      nameLecture: lecture.nameLecture,
                      order: lecture.order ?? lectureIndex + 1,
                      time: lecture.time ?? 0,
                      video: videoUrl,
                    };
                  }),
                ),
              },
            })),
          ),
        },
      },
      include: {
        Section: {
          include: { Lecture: true },
        },
      },
    });
  }

  async getCoursesByUser(userId: number) {
    try {
      console.log("Received userId:", userId, "type:", typeof userId);

      if (!userId || isNaN(userId)) {
        throw new BadRequestException("userId không hợp lệ");
      }

      return await this.prisma.course.findMany({
        where: { userId },
        select: {
          courseId: true,
          title: true,
          description: true,
          price: true,
          isPublic: true,
          isAccepted: true,
          thumbnail: true,
        },
        orderBy: { courseId: 'desc' },
      });
    } catch (error) {
      console.error("Lỗi khi lấy khóa học:", error);
      throw error; // hoặc throw new InternalServerErrorException()
    }
  }

}
