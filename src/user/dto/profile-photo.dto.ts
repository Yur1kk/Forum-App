import { IsString, IsOptional } from "class-validator";
export class ProfilePhotoDto {
@IsString()
@IsOptional()
profilePhoto?: string;
}