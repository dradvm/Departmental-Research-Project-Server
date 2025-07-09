import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CourseService } from './course.service';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateCourseDto } from './dto/create-course.dto';
import { Public } from 'src/decorator/customize';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';


@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly lectureService: LectureService,
    private readonly reviewService: ReviewService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  @Get('/:courseId')
  getCourseById(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseService.findById(courseId);
  }

  @Get('/lectures/:lectureId')
  getLectureById(@Param('lectureId', ParseIntPipe) lectureId: number) {
    return this.lectureService.findById(lectureId);
  }

  @Get('/:courseId/reviews/overview')
  getReviewOverView(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.reviewService.getOverviewOfCourse(courseId);
  }

  @Get('/:courseId/reviews')
  getReviews(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('rating') rating?: string,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.reviewService.getReviews(
      courseId,
      rating ? parseInt(rating) : undefined,
      search,
      cursor ? parseInt(cursor) : undefined
    );
  }

  @Get('/:courseId/reviews/total')
  getTotalReviews(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('rating') rating?: string,
    @Query('search') search?: string
  ) {
    return this.reviewService.getTotalReviews(
      courseId,
      rating ? parseInt(rating) : undefined,
      search
    );
  }

  // @Post('create-full')
  // @Public()
  // @UseInterceptors(
  //   FileFieldsInterceptor([{ name: 'videos', maxCount: 100 }]),
  // )
  // async createFullCourse(
  //   @UploadedFiles() files: { videos?: Express.Multer.File[] },
  //   @Body() dto: CreateCourseDto,
  // ) {
  //   const videoFiles = files?.videos ?? [];
  //   return this.courseService.createCourseWithContent(dto, videoFiles);
  // }

  @Post('create-full')
  @Public()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'videos' },
    { name: 'thumbnail', maxCount: 1 },
  ]))
  async createFullCourse(
    @Body('userId', ParseIntPipe) userId: number,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('price') price: string,
    @Body('isPublic') isPublic: string,
    @Body('sections') sectionsRaw: string,
    @UploadedFiles() files: { videos?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    let sections;

    try {
      sections = JSON.parse(sectionsRaw);
    } catch {
      throw new BadRequestException('Invalid JSON in sections');
    }

    const dto: CreateCourseDto = {
      userId,
      title,
      description,
      price: parseFloat(price),
      isPublic: isPublic === 'true',
      sections,
    };

    // Upload thumbnail nếu có
    let thumbnailUrl: string | undefined = undefined;
    if (files.thumbnail?.[0]) {
      const uploaded = await this.cloudinaryService.uploadImage(files.thumbnail[0], 'course-thumbnails');
      thumbnailUrl = uploaded.secure_url;
    }

    return this.courseService.createCourseWithContent(dto, files?.videos || [], thumbnailUrl);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyCourses(@Req() req: AuthenticatedRequest) {
    console.log("req.user:", req.user);
    const userIdRaw = req.user?.userId;
    const userId = Number(userIdRaw);

    if (!userId || isNaN(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    return this.courseService.getCoursesByUser(userId);
  }

}
