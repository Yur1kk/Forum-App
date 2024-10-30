import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  @Matches(/(?=.*[0-9])/, { message: 'Пароль повинен містити принаймні одну цифру' })
  @Matches(/(?=.*[A-Z])/, { message: 'Пароль повинен містити принаймні одну велику літеру' })
  @Matches(/(?=.*[a-z])/, { message: 'Пароль повинен містити принаймні одну малу літеру' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Пароль повинен містити принаймні один спеціальний символ' })
  newPassword: string;
}
