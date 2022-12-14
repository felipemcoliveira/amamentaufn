import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import Category from './models/category.model';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    if (await this.findByName(createCategoryDto.name)) {
      throw new ConflictException(`Já existe uma categoria com o nome \"${createCategoryDto.name}\".`);
    }
    return this.categoryModel.create(createCategoryDto);
  }

  async findByName(name: string): Promise<Category> {
    return this.categoryModel.findOne({ where: { name } });
  }

  async findAll(): Promise<Array<Category>> {
    return this.categoryModel.findAll();
  }

  async findOneOrFail(id: number): Promise<Category> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) throw new NotFoundException();
    return category;
  }

  async update(category: Category, updateCategoryDto: UpdateCategoryDto): Promise<void> {
    if ('name' in updateCategoryDto) {
      const other = await this.findByName(updateCategoryDto.name);
      if (other.id !== category.id) {
        throw new ConflictException(`Já existe uma categoria com o nome \"${updateCategoryDto.name}\".`);
      }
    }
    await category.update(updateCategoryDto);
  }

  async delete(category: Category): Promise<void> {
    await category.destroy();
  }
}
