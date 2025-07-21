import {
  BadRequestException,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { Course, Prisma } from '@prisma/client';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CouponCourseService } from '../coupon_course/couponcourse.service';
import { CouponService } from '../coupon/coupon.service';
import { getFinalPrice } from 'src/helpers/calculate-discount-amount';
@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private couponCourseService: CouponCourseService,
    private couponService: CouponService
  ) {}

  async findAll(
    search?: string,
    rating?: number,
    categoryId?: number,
    priceRange?: [number, number],
    durationRange?: [number, number],
    userId?: number
  ) {
    const courses = await this.prisma.course.findMany({
      where: {
        isAccepted: true,
        isPublic: true,
        ...(userId && {
          Enrollment: {
            none: {
              userId: userId
            }
          }
        }),
        ...(search &&
          search.trim().length > 0 && {
            OR: Array.from(new Set(search.trim().split(' '))).map((word) => ({
              title: {
                contains: word,
                not: null
              }
            }))
          }),
        ...(categoryId && {
          CourseCategory: {
            some: {
              categoryId: categoryId
            }
          }
        }),
        ...(rating && {
          Review: {
            some: {
              rating: {
                gte: rating
              }
            }
          }
        }),
        ...(userId && {
          Enrollment: {
            none: {
              userId: userId
            }
          }
        })
      },
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
        },
        User: {
          select: {
            userId: true,
            name: true
          }
        },
        CourseCategory: {
          include: {
            Category: true
          }
        },
        CourseObjective: true,
        Wishlist: true,
        Review: true,
        _count: {
          select: {
            Enrollment: true,
            Review: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    // Tính giá và thời lượng để lọc sau khi fetch
    const coursesReturn = await Promise.all(
      courses.map(async (course) => {
        const { finalPrice } = await this.getCoursePrice(course.courseId); // price: number
        return {
          ...course,
          finalPrice
        };
      })
    );

    const filtered = coursesReturn.filter((course) => {
      const totalDuration = course.Section.reduce(
        (total, section) =>
          total +
          section.Lecture.reduce((total2, lecture) => total2 + lecture.time, 0),
        0
      );
      const matchPrice =
        !priceRange ||
        (Number(course.price) >= priceRange[0] &&
          Number(course.price) <= priceRange[1]);
      const matchDuration =
        !durationRange ||
        (totalDuration >= durationRange[0] * 60 * 60 &&
          totalDuration <= durationRange[1] * 60 * 60);
      return matchPrice && matchDuration;
    });
    return filtered;
  }

  async findById(courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { courseId: courseId, isAccepted: true, isPublic: true },
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
        },
        User: {
          select: {
            userId: true,
            name: true,
            img: true,
            email: true,
            biography: true
          }
        },
        CourseCategory: {
          include: {
            Category: true
          }
        },
        CourseObjective: true,
        Wishlist: true,
        Review: true,
        _count: {
          select: {
            Enrollment: true,
            Review: true
          }
        }
      }
    });
    if (course) {
      const { finalPrice } = await this.getCoursePrice(course?.courseId);

      const courseReturn = {
        ...course,
        finalPrice
      };
      return courseReturn;
    }
    return null;
  }

  async createCourseWithContent(
    dto: CreateCourseDto,
    videos: Express.Multer.File[],
    thumbnailUrl?: string
  ) {
    let videoIndex = 0;

    return this.prisma.course.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        subTitle: dto.subTitle,
        description: dto.description,
        requirement: dto.requirement, //
        targetAudience: dto.targetAudience, //
        price: new Prisma.Decimal(dto.price),
        isPublic: dto.isPublic ?? false,
        thumbnail: thumbnailUrl,

        CourseCategory: {
          create: dto.categoryIds.map((categoryId) => ({
            categoryId
          }))
        },

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
                      const uploadResult =
                        await this.cloudinaryService.uploadVideo(
                          file,
                          'lectures'
                        );
                      videoUrl = uploadResult.secure_url;
                    }

                    return {
                      nameLecture: lecture.nameLecture,
                      order: lecture.order ?? lectureIndex + 1,
                      time: lecture.time ?? 0,
                      video: videoUrl
                    };
                  })
                )
              }
            }))
          )
        }
      },
      include: {
        Section: {
          include: { Lecture: true }
        },
        CourseCategory: {
          include: {
            Category: true
          }
        }
      }
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
          thumbnail: true
        },
        orderBy: { courseId: 'desc' }
      });
    } catch (error) {
      console.error('Lỗi khi lấy khóa học:', error);
      throw error; // hoặc throw new InternalServerErrorException()
    }
  }

  async updateCourseWithContent(
    courseId: number,
    dto: UpdateCourseDto,
    videos: Express.Multer.File[],
    thumbnailUrl?: string
  ) {
    let videoIndex = 0;

    // Update course info
    await this.prisma.course.update({
      where: { courseId: courseId },
      data: {
        title: dto.title,
        subTitle: dto.subTitle,
        description: dto.description,
        requirement: dto.requirement,
        targetAudience: dto.targetAudience, //
        price: new Prisma.Decimal(dto.price),
        isPublic: dto.isPublic,
        ...(thumbnailUrl && { thumbnail: thumbnailUrl })
      }
    });

    if (dto.categoryIds && dto.categoryIds.length > 0) {
      // Xóa tất cả Category cũ của course
      await this.prisma.courseCategory.deleteMany({
        where: { courseId }
      });

      // Gắn lại Category mới
      await this.prisma.courseCategory.createMany({
        data: dto.categoryIds.map((categoryId) => ({
          courseId,
          categoryId
        })),
        skipDuplicates: true
      });
    }

    // Lấy dữ liệu cũ
    const existingSections = await this.prisma.section.findMany({
      where: { courseId },
      include: { Lecture: true }
    });

    const existingSectionIds = new Set(
      existingSections.map((s) => s.sectionId)
    );
    const incomingSectionIds = new Set(
      dto.sections.map((s) => s.sectionId).filter(Boolean)
    );

    // Xóa section bị xóa từ client
    const sectionIdsToDelete = [...existingSectionIds].filter(
      (id) => !incomingSectionIds.has(id)
    );
    // Xóa các Lecture thuộc section bị xóa
    await this.prisma.lecture.deleteMany({
      where: { sectionId: { in: sectionIdsToDelete } }
    });

    // Sau đó mới xóa section
    await this.prisma.section.deleteMany({
      where: { sectionId: { in: sectionIdsToDelete } }
    });

    for (const [sectionIndex, section] of dto.sections.entries()) {
      let sectionId = section.sectionId;

      if (sectionId) {
        // update section
        await this.prisma.section.update({
          where: { sectionId: sectionId },
          data: {
            nameSection: section.nameSection,
            order: section.order ?? sectionIndex + 1
          }
        });
      } else {
        // create section
        const createdSection = await this.prisma.section.create({
          data: {
            courseId,
            nameSection: section.nameSection,
            order: section.order ?? sectionIndex + 1
          }
        });
        sectionId = createdSection.sectionId;
      }

      // Map: lecture update/create/delete
      const existingLectures =
        existingSections.find((s) => s.sectionId === section.sectionId)
          ?.Lecture || [];
      const existingLectureIds = new Set(
        existingLectures.map((l) => l.lectureId)
      );
      const incomingLectureIds = new Set(
        section.lectures.map((l) => l.lectureId).filter(Boolean)
      );
      const lectureIdsToDelete = [...existingLectureIds].filter(
        (id) => !incomingLectureIds.has(id)
      );

      await this.prisma.lecture.deleteMany({
        where: { lectureId: { in: lectureIdsToDelete } }
      });

      for (const [lectureIndex, lecture] of section.lectures.entries()) {
        let videoUrl = lecture.video ?? ''; // giữ video cũ nếu có
        const hasExistingVideo = !!lecture.video;
        const needsNewVideo = !hasExistingVideo;

        if (needsNewVideo && videos[videoIndex]) {
          const uploaded = await this.cloudinaryService.uploadVideo(
            videos[videoIndex],
            'lectures'
          );
          videoUrl = uploaded.secure_url;
          console.log(
            `Gán video "${videoUrl}" cho lectureId: ${lecture.lectureId ?? '[NEW]'}`
          );
          videoIndex++;
        }

        if (lecture.lectureId) {
          await this.prisma.lecture.update({
            where: { lectureId: lecture.lectureId },
            data: {
              nameLecture: lecture.nameLecture,
              order: lecture.order ?? lectureIndex + 1,
              video: videoUrl,
              time: lecture.time ?? 0 //
            }
          });
        } else {
          await this.prisma.lecture.create({
            data: {
              sectionId,
              nameLecture: lecture.nameLecture,
              order: lecture.order ?? lectureIndex + 1,
              video: videoUrl,
              time: lecture.time ?? 0 //
            }
          });
        }
      }
    }

    return this.prisma.course.findUnique({
      where: { courseId: courseId },
      include: {
        Section: { include: { Lecture: true } }
      }
    });
  }

  async getRevenueByUser(userId: number) {
    // Lấy các courseId thuộc user này
    const courses = await this.prisma.course.findMany({
      where: {
        userId: userId
      },
      select: {
        courseId: true,
        title: true
      }
    });

    // Lấy doanh thu và lượt mua theo courseId
    const revenueData = await this.prisma.paymentDetail.groupBy({
      by: ['courseId'],
      _sum: {
        final_price: true
      },
      _count: {
        paymentId: true
      },
      where: {
        courseId: {
          in: courses.map((c) => c.courseId)
        }
      }
    });

    // Map dữ liệu thành dạng thống kê
    const result = courses.map((course) => {
      const stat = revenueData.find((r) => r.courseId === course.courseId);
      return {
        courseId: course.courseId,
        course: course.title,
        revenue: stat?._sum.final_price ?? 0,
        totalEnrollments: stat?._count.paymentId ?? 0
      };
    });

    return result;
  }

  async getCoursesByCategory(categoryId: number, userId?: number) {
    const courses = await this.prisma.course.findMany({
      where: {
        isAccepted: true,
        isPublic: true,
        CourseCategory: {
          some: {
            categoryId: categoryId
          }
        },
        ...(userId && {
          Enrollment: {
            none: {
              userId: userId
            }
          }
        })
      },
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
        },
        User: {
          select: {
            userId: true,
            name: true
          }
        },
        CourseCategory: {
          include: {
            Category: true
          }
        },
        CourseObjective: true,
        Wishlist: true,
        Review: true,
        _count: {
          select: {
            Enrollment: true,
            Review: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    const coursesReturn = await Promise.all(
      courses.map(async (course) => {
        const priceInfo = await this.getCoursePrice(course.courseId);
        return {
          ...course,
          ...priceInfo
        };
      })
    );

    return coursesReturn;
  }
  async getFilteredCoursesWithPagination(
    limit: number,
    skip: number,
    minTime?: number,
    maxTime?: number,
    minLectureCount?: number,
    maxLectureCount?: number,
    minPrice?: number,
    maxPrice?: number,
    searchText?: string
  ) {
    // create where clause
    const filters: string[] = [];

    if (typeof minTime === 'number') filters.push(`total_time >= ${minTime}`);
    if (typeof maxTime === 'number') filters.push(`total_time <= ${maxTime}`);
    if (typeof minLectureCount === 'number')
      filters.push(`lecture_count >= ${minLectureCount}`);
    if (typeof maxLectureCount === 'number')
      filters.push(`lecture_count <= ${maxLectureCount}`);
    if (typeof minPrice === 'number') filters.push(`price >= ${minPrice}`);
    if (typeof maxPrice === 'number') filters.push(`price <= ${maxPrice}`);

    if (searchText) {
      const escaped = searchText.replace(/'/g, "''");
      filters.push(
        `(LOWER(title) LIKE LOWER('%${escaped}%') OR LOWER(instructor_name) LIKE LOWER('%${escaped}%'))`
      );
    }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // query: course + section + lecture
    const data = await this.prisma.$queryRaw<
      Array<{
        courseId: number;
        title: string | null;
        sub_title: string | null;
        description: string | null;
        price: number;
        is_public: boolean | null;
        is_accepted: boolean | null;
        thumbnail: string | null;
        requirement: string | null;
        target_audience: string | null;
        video_url: string | null;
        total_time: number;
        lecture_count: number;
        instructor_id: number | null;
        instructor_name: string | null;
        instructor_email: string | null;
        instructor_biography: string | null;
      }>
    >(Prisma.sql`
  WITH course_stats AS (
    SELECT
      c.\`courseId\`,
      c.\`title\`,
      c.\`subTitle\` AS sub_title,
      c.\`description\`,
      c.\`price\`,
      c.\`isPublic\` AS is_public,
      c.\`isAccepted\` AS is_accepted,
      c.\`thumbnail\`,
      c.\`requirement\`,
      c.\`targetAudience\` AS target_audience,
      c.\`videoUrl\` AS video_url,
      u.\`userId\` AS instructor_id,
      u.\`name\` AS instructor_name,
      u.\`email\` AS instructor_email,
      u.\`biography\` AS instructor_biography,
      COALESCE(SUM(l.\`time\`), 0) AS total_time,
      COUNT(l.\`lectureId\`) AS lecture_count
    FROM \`Course\` c
    LEFT JOIN \`Section\` s ON s.\`courseId\` = c.\`courseId\`
    LEFT JOIN \`Lecture\` l ON l.\`sectionId\` = s.\`sectionId\`
    LEFT JOIN \`User\` u ON u.\`userId\` = c.\`userId\`
    GROUP BY
      c.\`courseId\`,
      c.\`title\`,
      c.\`subTitle\`,
      c.\`description\`,
      c.\`price\`,
      c.\`isPublic\`,
      c.\`isAccepted\`,
      c.\`thumbnail\`,
      c.\`requirement\`,
      c.\`targetAudience\`,
      c.\`videoUrl\`,
      u.\`userId\`,
      u.\`name\`,
      u.\`email\`,
      u.\`biography\`
  )
  SELECT *
  FROM course_stats
  ${Prisma.raw(whereClause)}
  ORDER BY courseId
  LIMIT ${limit} OFFSET ${skip};
`);

    const totalResult = await this.prisma.$queryRaw<
      Array<{ count: bigint }>
    >(Prisma.sql`
  WITH course_stats AS (
    SELECT
      c.\`courseId\`,
      u.\`name\` AS instructor_name,
      c.\`title\`,
      COALESCE(SUM(l.\`time\`), 0) AS total_time,
      COUNT(l.\`lectureId\`) AS lecture_count,
      c.\`price\`
    FROM \`Course\` c
    LEFT JOIN \`Section\` s ON s.\`courseId\` = c.\`courseId\`
    LEFT JOIN \`Lecture\` l ON l.\`sectionId\` = s.\`sectionId\`
    LEFT JOIN \`User\` u ON u.\`userId\` = c.\`userId\`
    GROUP BY c.\`courseId\`, u.\`name\`, c.\`title\`
  )
  SELECT COUNT(*) AS count
  FROM course_stats
  ${Prisma.raw(whereClause)};
`);

    const total = Number(totalResult[0]?.count ?? 0);

    const courseIds = data.map((row) => row.courseId);

    const sections = await this.prisma.section.findMany({
      where: {
        courseId: { in: courseIds }
      },
      select: {
        sectionId: true,
        nameSection: true,
        courseId: true,
        Lecture: {
          select: {
            lectureId: true,
            nameLecture: true,
            time: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    const courseIdToSections: Record<number, any[]> = {};
    for (const section of sections) {
      if (!section.courseId) continue;

      if (!courseIdToSections[section.courseId]) {
        courseIdToSections[section.courseId] = [];
      }
      courseIdToSections[section.courseId].push({
        sectionId: section.sectionId,
        sectionName: section.nameSection,
        lectures: section.Lecture.map((lec) => ({
          lectureId: lec.lectureId,
          lectureName: lec.nameLecture,
          time: lec.time
        }))
      });
    }

    // result
    const formattedData = data.map((row) => ({
      courseId: row.courseId,
      title: row.title,
      subTitle: row.sub_title,
      description: row.description,
      price: Number(row.price),
      isPublic: row.is_public,
      isAccepted: row.is_accepted,
      thumbnail: row.thumbnail,
      requirement: row.requirement,
      targetAudience: row.target_audience,
      videoUrl: row.video_url,
      totalTime: Number(row.total_time),
      lectureCount: Number(row.lecture_count),
      teacherId: row.instructor_id,
      teacherName: row.instructor_name,
      teacherEmail: row.instructor_email,
      teacherBiography: row.instructor_biography,
      sections: courseIdToSections[row.courseId] || []
    }));

    return {
      courses: formattedData,
      length: total
    };
  }

  async acceptCourse(courseId: number) {
    try {
      const courseDB: Course | null = await this.prisma.course.findUnique({
        where: { courseId: courseId }
      });
      if (!courseDB)
        throw new BadRequestException(
          `Can not find a course with id: ${courseId}`
        );
      return await this.prisma.course.update({
        where: { courseId: courseId },
        data: { isAccepted: true }
      });
    } catch (e) {
      throw new BadRequestException(
        `Occuring an error while accepting a course: ${e}`
      );
    }
  }

  async getCoursePrice(courseId: number): Promise<{
    price: string;
    finalPrice: string;
  }> {
    try {
      // Lấy thông tin khoá học
      const course = await this.prisma.course.findUnique({
        where: { courseId },
        include: {
          CouponCourse: true
        }
      });

      if (!course) {
        throw new Error(`Không tìm thấy khoá học với ID ${courseId}`);
      }

      let finalPrice = course.price;

      // Kiểm tra mã giảm giá đang chạy
      const runningCouponCourse =
        await this.couponCourseService.getIsRunningCouponOfCourse(courseId);

      if (runningCouponCourse) {
        const coupon = await this.couponService.getCouponById(
          runningCouponCourse.couponId
        );
        finalPrice = getFinalPrice(coupon, course.price, false);
      }

      return {
        price: course.price.toString(),
        finalPrice: finalPrice.toString()
      };
    } catch (error) {
      throw new BadRequestException(
        `Không lấy được giá của khoá học ${courseId}: ${error}`
      );
    }
  }
  async getOtherCoursesByUser(
    instructorId: number,
    courseId: number,
    userId?: number
  ) {
    const courses = await this.prisma.course.findMany({
      where: {
        isAccepted: true,
        isPublic: true,
        userId: instructorId,
        courseId: {
          not: courseId
        },
        ...(userId && {
          Enrollment: {
            none: {
              userId: userId
            }
          }
        })
      },
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
        },
        User: {
          select: {
            userId: true,
            name: true
          }
        },
        CourseCategory: {
          include: {
            Category: true
          }
        },
        CourseObjective: true,
        Wishlist: true,
        Review: true,
        _count: {
          select: {
            Enrollment: true,
            Review: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    const coursesReturn = await Promise.all(
      courses.map(async (course) => {
        const priceInfo = await this.getCoursePrice(course.courseId);
        return {
          ...course,
          ...priceInfo
        };
      })
    );
    return coursesReturn;
  }
}
