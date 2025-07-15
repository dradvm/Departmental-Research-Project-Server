import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Course, Prisma } from '@prisma/client';
@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

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
      }
    });
  }
  async findOtherCourseOfInstructor(
    courseId: number,
    userId: number,
    instructorId: number
  ) {
    return this.prisma.course.findMany({
      where: {
        courseId: {
          not: courseId
        },
        userId: instructorId
      },
      include: {
        Section: {
          include: {
            Lecture: true
          }
        },
        Review: true,
        _count: {
          select: {
            Enrollment: true
          }
        },
        Wishlist: {
          where: {
            userId: userId
          }
        }
      },
      orderBy: [
        {
          Enrollment: {
            _count: 'desc'
          }
        }
      ]
    });
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
}
