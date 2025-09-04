import { IsEmail, MinLength } from 'class-validator';

export class SignupDto {
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstname!: string;

  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastname!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @MinLength(10, {
    message: 'Phone number must be at least 10 characters long',
  })
  phone!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}

export class SigninDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
