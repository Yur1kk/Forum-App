import {IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateUserActionLogDto {
  @IsNotEmpty()
  @IsString()
  action: string;

  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsString()
  entityType: string;

  @IsNotEmpty()
  @IsInt()
  entityId: number;

  @IsNotEmpty()
  @IsString()
  entity: string;
}
