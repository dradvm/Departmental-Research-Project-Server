import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Public } from 'src/decorator/customize';

@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Get()
    @Public()
    async findAll() {
        return this.categoryService.findAll();
    }
}
