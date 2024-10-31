import { IsNotEmpty, IsOptional, IsString, IsArray, IsInt } from 'class-validator';

export class CreatePostDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsArray()
    @IsInt({ each: true }) 
    categoryIds: number[];
}
