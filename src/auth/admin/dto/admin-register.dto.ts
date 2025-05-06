import { IsEmail, IsString, IsNotEmpty, Matches, MinLength, IsOptional } from 'class-validator';

export class RegisterAdminDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number' })
    @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one capital letter' })
    @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one small letter' })
    @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special symbol' })
    password: string;

    @IsString()
    name?: string;
  
    @IsString()
    @IsOptional()
    profilePhoto?: string;

    @IsString()
    @MinLength(6)
    @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number' })
    @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one capital letter' })
    @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one small letter' })
    @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special symbol' })
    confirmPassword: string;

    @IsString()
    @IsNotEmpty()
    adminPassword: string; 
}
