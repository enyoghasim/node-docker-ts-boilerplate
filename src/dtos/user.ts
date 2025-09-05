import { Expose } from 'class-transformer';

import {
  IsInt,
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class UserResponseDto {
  @IsInt()
  @Expose()
  id!: number;

  @IsEmail()
  @Expose()
  email!: string;

  @IsString()
  @IsOptional()
  @Expose()
  firstname?: string;

  @IsString()
  @IsOptional()
  @Expose()
  lastname?: string;

  @IsString()
  @IsOptional()
  @Expose()
  phone?: string;

  @IsDateString()
  @Expose()
  createdAt!: string;
}
