import { IsString, IsNotEmpty } from 'class-validator';
export class AdminPasswordDto {
@IsString()
@IsNotEmpty()
adminPassword: string;
}