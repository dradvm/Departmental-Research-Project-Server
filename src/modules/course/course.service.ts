import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { Course, Prisma } from '@prisma/client';
import { UpdateCourseDto } from './dto/update-course.dto';
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
        requirement: dto.requirement, //
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

  // async updateFullCourse(
  //   courseId: number,
  //   userId: number,
  //   body: any,
  //   files: {
  //     thumbnail?: Express.Multer.File[];
  //     videos?: Express.Multer.File[];
  //   },
  // ) {
  //   const { title, description, price, isPublic, sections } = body;
  //   const parsedSections = JSON.parse(sections);
  //   const thumbnailFile = files.thumbnail?.[0];
  //   const videoFiles = files.videos || [];

  //   //Xác thực quyền sở hữu
  //   const existingCourse = await this.prisma.course.findUnique({
  //     where: { courseId },
  //     select: { userId: true },
  //   });

  //   if (!existingCourse || existingCourse.userId !== userId) {
  //     throw new ForbiddenException('Bạn không có quyền cập nhật khóa học này');
  //   }

  //   //Upload thumbnail nếu có
  //   let thumbnailUrl: string | undefined;
  //   if (thumbnailFile) {
  //     const result = await this.cloudinaryService.uploadImage(
  //       thumbnailFile,
  //       'course-thumbnails',
  //     );
  //     thumbnailUrl = result.secure_url;
  //   }

  //   //Cập nhật thông tin Course
  //   await this.prisma.course.update({
  //     where: { courseId },
  //     data: {
  //       title,
  //       description,
  //       price: parseFloat(price),
  //       isPublic: isPublic === 'true',
  //       ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
  //     },
  //   });

  //   //Xoá Lecture trước, rồi Section
  //   await this.prisma.lecture.deleteMany({
  //     where: {
  //       Section: { courseId },
  //     },
  //   });

  //   await this.prisma.section.deleteMany({
  //     where: { courseId },
  //   });

  //   //Tạo lại Section & Lecture
  //   for (const [sectionIdx, section] of parsedSections.entries()) {
  //     const createdSection = await this.prisma.section.create({
  //       data: {
  //         courseId,
  //         nameSection: section.nameSection,
  //         order: section.order,
  //       },
  //     });

  //     for (const [lectureIdx, lecture] of section.lectures.entries()) {
  //       const videoFile = videoFiles.shift();
  //       let videoUrl = '';

  //       if (videoFile) {
  //         const uploaded = await this.cloudinaryService.uploadVideo(
  //           videoFile,
  //           'lecture-videos',
  //         );
  //         videoUrl = uploaded.secure_url;
  //       }

  //       await this.prisma.lecture.create({
  //         data: {
  //           sectionId: createdSection.sectionId,
  //           nameLecture: lecture.nameLecture,
  //           order: lecture.order,
  //           video: videoUrl,
  //         },
  //       });
  //     }
  //   }

  //   return { message: 'Course updated successfully' };
  // }

  // async updateFullCourse(
  //   courseId: number,
  //   userId: number,
  //   body: any,
  //   files: {
  //     thumbnail?: Express.Multer.File[];
  //     videos?: Express.Multer.File[];
  //   },
  // ) {
  //   const { title, description, price, isPublic, sections } = body;
  //   const parsedSections = JSON.parse(sections);
  //   const thumbnailFile = files.thumbnail?.[0];
  //   const videoFiles = files.videos || [];

  //   // Kiểm tra quyền cập nhật
  //   const existingCourse = await this.prisma.course.findUnique({
  //     where: { courseId },
  //     select: { userId: true },
  //   });

  //   if (!existingCourse || existingCourse.userId !== userId) {
  //     throw new ForbiddenException('Bạn không có quyền cập nhật khóa học này');
  //   }

  //   // Upload thumbnail nếu có
  //   let thumbnailUrl: string | undefined;
  //   if (thumbnailFile) {
  //     const result = await this.cloudinaryService.uploadImage(
  //       thumbnailFile,
  //       'course-thumbnails',
  //     );
  //     thumbnailUrl = result.secure_url;
  //   }

  //   // Cập nhật khóa học
  //   await this.prisma.course.update({
  //     where: { courseId },
  //     data: {
  //       title,
  //       description,
  //       price: parseFloat(price),
  //       isPublic: isPublic === 'true',
  //       ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
  //     },
  //   });

  //   // Danh sách id để xác định phần cần giữ lại
  //   const updatedSectionIds: number[] = [];
  //   const updatedLectureIds: number[] = [];

  //   for (const section of parsedSections) {
  //     let sectionId: number;

  //     // Section cũ → update
  //     if (section.sectionId) {
  //       await this.prisma.section.update({
  //         where: { sectionId: section.sectionId },
  //         data: {
  //           nameSection: section.nameSection,
  //           order: section.order,
  //         },
  //       });
  //       sectionId = section.sectionId;
  //     } else {
  //       // Section mới → create
  //       const created = await this.prisma.section.create({
  //         data: {
  //           courseId,
  //           nameSection: section.nameSection,
  //           order: section.order,
  //         },
  //       });
  //       sectionId = created.sectionId;
  //     }

  //     updatedSectionIds.push(sectionId);

  //     // Xử lý Lecture trong Section
  //     for (const lecture of section.lectures) {
  //       let videoUrl = lecture.video || '';
  //       const videoFile = videoFiles.shift();

  //       if (videoFile) {
  //         const uploaded = await this.cloudinaryService.uploadVideo(
  //           videoFile,
  //           'lecture-videos',
  //         );
  //         videoUrl = uploaded.secure_url;
  //       }

  //       if (lecture.lectureId) {
  //         // Cập nhật lecture cũ
  //         await this.prisma.lecture.update({
  //           where: { lectureId: lecture.lectureId },
  //           data: {
  //             nameLecture: lecture.nameLecture,
  //             order: lecture.order,
  //             video: videoUrl,
  //           },
  //         });
  //         updatedLectureIds.push(lecture.lectureId);
  //       } else {
  //         // Tạo mới lecture
  //         const createdLecture = await this.prisma.lecture.create({
  //           data: {
  //             sectionId,
  //             nameLecture: lecture.nameLecture,
  //             order: lecture.order,
  //             video: videoUrl,
  //           },
  //         });
  //         updatedLectureIds.push(createdLecture.lectureId);
  //       }
  //     }
  //   }

  //   // Xoá các lecture đã bị xoá ở frontend
  //   await this.prisma.lecture.deleteMany({
  //     where: {
  //       Section: {
  //         courseId,
  //       },
  //       lectureId: {
  //         notIn: updatedLectureIds,
  //       },
  //     },
  //   });

  //   // Xoá các section đã bị xoá ở frontend
  //   await this.prisma.section.deleteMany({
  //     where: {
  //       courseId,
  //       sectionId: {
  //         notIn: updatedSectionIds,
  //       },
  //     },
  //   });

  //   return { message: 'Course updated successfully' };
  // }

  async updateCourseWithContent(courseId: number, dto: UpdateCourseDto, videos: Express.Multer.File[], thumbnailUrl?: string) {
    let videoIndex = 0;

    // Update course info
    await this.prisma.course.update({
      where: { courseId: courseId },
      data: {
        title: dto.title,
        subTitle: dto.subTitle,
        description: dto.description,
        requirement: dto.requirement,
        price: new Prisma.Decimal(dto.price),
        isPublic: dto.isPublic,
        ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
      },
    });

    // Lấy dữ liệu cũ
    const existingSections = await this.prisma.section.findMany({
      where: { courseId },
      include: { Lecture: true },
    });

    const existingSectionIds = new Set(existingSections.map(s => s.sectionId));
    const incomingSectionIds = new Set(dto.sections.map(s => s.sectionId).filter(Boolean));

    // Xóa section bị xóa từ client
    const sectionIdsToDelete = [...existingSectionIds].filter(id => !incomingSectionIds.has(id));
    // Xóa các Lecture thuộc section bị xóa
    await this.prisma.lecture.deleteMany({
      where: { sectionId: { in: sectionIdsToDelete } },
    });

    // Sau đó mới xóa section
    await this.prisma.section.deleteMany({
      where: { sectionId: { in: sectionIdsToDelete } },
    });


    for (const [sectionIndex, section] of dto.sections.entries()) {
      let sectionId = section.sectionId;

      if (sectionId) {
        // update section
        await this.prisma.section.update({
          where: { sectionId: sectionId },
          data: {
            nameSection: section.nameSection,
            order: section.order ?? sectionIndex + 1,
          },
        });
      } else {
        // create section
        const createdSection = await this.prisma.section.create({
          data: {
            courseId,
            nameSection: section.nameSection,
            order: section.order ?? sectionIndex + 1,
          },
        });
        sectionId = createdSection.sectionId;
      }

      // Map: lecture update/create/delete
      const existingLectures = existingSections.find(s => s.sectionId === section.sectionId)?.Lecture || [];
      const existingLectureIds = new Set(existingLectures.map(l => l.lectureId));
      const incomingLectureIds = new Set(section.lectures.map(l => l.lectureId).filter(Boolean));
      const lectureIdsToDelete = [...existingLectureIds].filter(id => !incomingLectureIds.has(id));

      await this.prisma.lecture.deleteMany({
        where: { lectureId: { in: lectureIdsToDelete } },
      });

      // for (const [lectureIndex, lecture] of section.lectures.entries()) {
      //   const file = videos[videoIndex];
      //   let videoUrl = lecture.video ?? ''; // giữ video cũ nếu không có file mới

      //   if (file) {
      //     const uploaded = await this.cloudinaryService.uploadVideo(file, 'lectures');
      //     videoUrl = uploaded.secure_url;
      //     videoIndex++;
      //     console.log(`Uploaded video: ${videoUrl}`);
      //     console.log(`Lecture: ${lecture.lectureId}, Video URL: ${videoUrl}`);
      //   }

      //   if (lecture.lectureId) {
      //     await this.prisma.lecture.update({
      //       where: { lectureId: lecture.lectureId },
      //       data: {
      //         nameLecture: lecture.nameLecture,
      //         order: lecture.order ?? lectureIndex + 1,
      //         video: videoUrl,
      //       },
      //     });
      //   } else {
      //     await this.prisma.lecture.create({
      //       data: {
      //         sectionId,
      //         nameLecture: lecture.nameLecture,
      //         order: lecture.order ?? lectureIndex + 1,
      //         video: videoUrl,
      //       },
      //     });
      //   }
      // }
      for (const [lectureIndex, lecture] of section.lectures.entries()) {
        let videoUrl = lecture.video ?? ''; // giữ video cũ nếu có
        const hasExistingVideo = !!lecture.video;
        const needsNewVideo = !hasExistingVideo;

        if (needsNewVideo && videos[videoIndex]) {
          const uploaded = await this.cloudinaryService.uploadVideo(videos[videoIndex], 'lectures');
          videoUrl = uploaded.secure_url;
          console.log(`Gán video "${videoUrl}" cho lectureId: ${lecture.lectureId ?? '[NEW]'}`);
          videoIndex++;
        }

        if (lecture.lectureId) {
          await this.prisma.lecture.update({
            where: { lectureId: lecture.lectureId },
            data: {
              nameLecture: lecture.nameLecture,
              order: lecture.order ?? lectureIndex + 1,
              video: videoUrl,
            },
          });
        } else {
          await this.prisma.lecture.create({
            data: {
              sectionId,
              nameLecture: lecture.nameLecture,
              order: lecture.order ?? lectureIndex + 1,
              video: videoUrl,
            },
          });
        }
      }

    }

    return this.prisma.course.findUnique({
      where: { courseId: courseId },
      include: {
        Section: { include: { Lecture: true } },
      },
    });
  }




}
