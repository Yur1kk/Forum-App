import { IsOptional, IsString, IsBoolean, IsArray, IsInt } from 'class-validator';

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsBoolean()
    published?: boolean;
    
    @IsOptional()
    @IsArray()
    @IsInt({ each: true }) 
    categoryIds: number[];
}