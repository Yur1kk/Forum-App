import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class RegisterAdminDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    confirmPassword: string;

    @IsString()
    @IsNotEmpty()
    adminPassword: string; 
}
