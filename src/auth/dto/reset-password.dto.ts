import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one capital letter' })
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one small letter' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special symbol' })
  newPassword: string;

  @IsString()
  @MinLength(6)
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one capital letter' })
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one small letter' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special symbol' })
  confirmNewPassword: string;
}
