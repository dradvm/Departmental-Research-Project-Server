import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({
            select: {
                categoryId: true,
                categoryName: true,
            },
            orderBy: {
                categoryName: 'asc',
            },
        });
    }
}
