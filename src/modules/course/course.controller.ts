import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { CourseService } from './course.service';
import { LectureService } from './lecture.service';
import { ReviewService } from './review.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateCourseDto } from './dto/create-course.dto';
import { Public } from 'src/decorator/customize';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { ApiRequestData } from 'src/common/base/api.request';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CategoryService } from './category.service';

@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly lectureService: LectureService,
    private readonly reviewService: ReviewService,
    private readonly categoryService: CategoryService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Get('me')
  async getMyCourses(@Req() req: ApiRequestData) {
    const userIdRaw = req.user?.userId;
    const userId = Number(userIdRaw);

    if (!userId || isNaN(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    return this.courseService.getCoursesByUser(userId);
  }

  @Get('categories')
  @Public()
  getCategories() {
    return this.categoryService.getAll();
  }
  @Get()
  async getAllCourses(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('minTime') minTime?: string,
    @Query('maxTime') maxTime?: string,
    @Query('minLectureCount') minLectureCount?: string,
    @Query('maxLectureCount') maxLectureCount?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('searchText') searchText?: string
  ) {
    return await this.courseService.getFilteredCoursesWithPagination(
      parseInt(limit),
      parseInt(skip),
      minTime !== undefined ? parseInt(minTime) : undefined,
      maxTime !== undefined ? parseInt(maxTime) : undefined,
      minLectureCount !== undefined ? parseInt(minLectureCount) : undefined,
      maxLectureCount !== undefined ? parseInt(maxLectureCount) : undefined,
      minPrice !== undefined ? parseInt(minPrice) : undefined,
      maxPrice !== undefined ? parseInt(maxPrice) : undefined,
      searchText !== undefined ? searchText : undefined
    );
  }

  @Get('search/public')
  @Public()
  async findAllPublic(
    @Query()
    query: {
      search?: string;
      rating?: number;
      categoryId?: number;
      priceMin?: number;
      priceMax?: number;
      durationMin?: number;
      durationMax?: number;
    }
  ) {
    const {
      search,
      rating,
      categoryId,
      priceMin,
      priceMax,
      durationMin,
      durationMax
    } = query;

    return this.courseService.findAll(
      search,
      rating ? +rating : undefined,
      categoryId ? +categoryId : undefined,
      priceMin && priceMax ? [+priceMin, +priceMax] : undefined,
      durationMin && durationMax ? [+durationMin, +durationMax] : undefined
    );
  }
  @Get('search/private')
  async findAllPrivate(
    @Query()
    query: {
      userId?: number;
      search?: string;
      rating?: number;
      categoryId?: number;
      priceMin?: number;
      priceMax?: number;
      durationMin?: number;
      durationMax?: number;
    },
    @Req() req: ApiRequestData
  ) {
    const {
      search,
      rating,
      categoryId,
      priceMin,
      priceMax,
      durationMin,
      durationMax
    } = query;

    return this.courseService.findAll(
      search,
      rating ? +rating : undefined,
      categoryId ? +categoryId : undefined,
      priceMin && priceMax ? [+priceMin, +priceMax] : undefined,
      durationMin && durationMax ? [+durationMin, +durationMax] : undefined,
      req.user.userId
    );
  }
  // accpet: isAccept: true
  @Put('/accept/:id')
  async acceptCourse(@Param('id') id: string) {
    const courseId: number = parseInt(id);
    if (isNaN(courseId))
      throw new BadRequestException(
        `courseId is invalid, can not accept course with id: ${courseId}`
      );
    return this.courseService.acceptCourse(courseId);
  }
  @Get('/:courseId')
  @Public()
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

  @Get('/:courseId/price')
  @Public()
  getCoursePrice(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseService.getCoursePrice(courseId);
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

  @Get('/:courseId/review')
  getReviewByUserIdAndCourseId(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ApiRequestData
  ) {
    return this.reviewService.getReviewByUserIdAndCourseId(
      req.user.userId,
      courseId
    );
  }
  @Post('/reviews')
  createReview(
    @Body('courseId', ParseIntPipe) courseId: number,
    @Body('rating', ParseIntPipe) rating: number,
    @Body('review') review: string,
    @Req() req: ApiRequestData
    // @Body('reviewId', ParseIntPipe) reviewId?: number
  ) {
    return this.reviewService.createReview(
      req.user.userId,
      courseId,
      rating,
      review
    );
  }
  @Patch('/reviews/:reviewId')
  updateReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body('rating', ParseIntPipe) rating: number,
    @Body('review') review: string
  ) {
    return this.reviewService.updateReview(reviewId, rating, review);
  }
  @Delete('/reviews/:reviewId')
  deleteReview(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return this.reviewService.deleteReview(reviewId);
  }
  @Post('create-full')
  @Public()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'videos' },
      { name: 'thumbnail', maxCount: 1 }
    ])
  )
  async createFullCourse(
    @Body('userId', ParseIntPipe) userId: number,
    @Body('title') title: string,
    @Body('subTitle') subTitle: string, //
    @Body('description') description: string,
    @Body('requirement') requirement: string, //
    @Body('targetAudience') targetAudience: string, //
    @Body('price') price: string,
    @Body('isPublic') isPublic: string,
    @Body('sections') sectionsRaw: string,
    @Body('categoryIds') categoryIdsRaw: string, //
    @UploadedFiles()
    files: { videos?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }
  ) {
    let sections;
    let categoryIds: number[];

    try {
      sections = JSON.parse(sectionsRaw);
    } catch {
      throw new BadRequestException('Invalid JSON in sections');
    }

    try {
      categoryIds = JSON.parse(categoryIdsRaw);
      if (!Array.isArray(categoryIds)) throw new Error();
    } catch {
      throw new BadRequestException('Invalid JSON in categoryIds');
    }

    const dto: CreateCourseDto = {
      userId,
      title,
      subTitle, //
      description,
      requirement, //
      targetAudience, //
      price: parseFloat(price),
      isPublic: isPublic === 'true',
      sections,
      categoryIds
    };

    // Upload thumbnail nếu có
    let thumbnailUrl: string | undefined = undefined;
    if (files.thumbnail?.[0]) {
      const uploaded = await this.cloudinaryService.uploadImage(
        files.thumbnail[0],
        'course-thumbnails'
      );
      thumbnailUrl = uploaded.secure_url;
    }

    return this.courseService.createCourseWithContent(
      dto,
      files?.videos || [],
      thumbnailUrl
    );
  }

  @Patch('update-full/:id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'videos' },
      { name: 'thumbnail', maxCount: 1 }
    ])
  )
  async updateFullCourse(
    @Param('id', ParseIntPipe) courseId: number,
    @Body('title') title: string,
    @Body('subTitle') subTitle: string,
    @Body('description') description: string,
    @Body('requirement') requirement: string,
    @Body('targetAudience') targetAudience: string, //
    @Body('price') price: string,
    @Body('isPublic') isPublic: string,
    @Body('sections') sectionsRaw: string,
    @Body('categoryIds') categoryIdsRaw: string, //
    @UploadedFiles()
    files: { videos?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }
  ) {
    let sections;
    let categoryIds: number[] = [];

    try {
      sections = JSON.parse(sectionsRaw);
      console.log('Parsed sections:', sections);
    } catch {
      throw new BadRequestException('Invalid sections JSON');
    }

    try {
      categoryIds = JSON.parse(categoryIdsRaw || '[]');
    } catch {
      throw new BadRequestException('Invalid JSON in categoryIds');
    }

    const dto: UpdateCourseDto = {
      title,
      subTitle,
      description,
      requirement,
      targetAudience, //
      price: parseFloat(price),
      isPublic: isPublic === 'true',
      sections,
      categoryIds //
    };

    let thumbnailUrl: string | undefined;
    if (files.thumbnail?.[0]) {
      const uploaded = await this.cloudinaryService.uploadImage(
        files.thumbnail[0],
        'course-thumbnails'
      );
      thumbnailUrl = uploaded.secure_url;
    }

    return this.courseService.updateCourseWithContent(
      courseId,
      dto,
      files?.videos || [],
      thumbnailUrl
    );
  }

  @Get('revenue/:userId')
  async getRevenueByUser(@Param('userId') userIdRaw: string) {
    const userId = Number(userIdRaw);
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    return this.courseService.getRevenueByUser(userId);
  }

  @Get('category/:categoryId/public')
  @Public()
  getCoursesByCategoryPublic(
    @Param('categoryId', ParseIntPipe) categoryId: number
  ) {
    return this.courseService.getCoursesByCategory(categoryId);
  }
  @Get('category/:categoryId/private')
  getCoursesByCategoryPrivate(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Req() req: ApiRequestData
  ) {
    return this.courseService.getCoursesByCategory(categoryId, req.user.userId);
  }
  @Get('other-courses/:courseId/public')
  @Public()
  getOtherCoursesByUserPublic(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    return this.courseService.getOtherCoursesByUser(userId, courseId);
  }
  @Get('other-courses/:courseId/private')
  getOtherCoursesByUserPrivate(
    @Query('userId', ParseIntPipe) userId: number,
    @Req() req: ApiRequestData,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    return this.courseService.getOtherCoursesByUser(
      userId,
      courseId,
      req.user.userId
    );
  }
}
