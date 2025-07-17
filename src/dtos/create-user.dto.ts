import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsUrl,
  Matches,
} from 'class-validator';
import { AppRole } from './AppRole';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsEnum(AppRole)
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';

  @IsOptional()
  @IsUrl({}, { message: 'Invalid avatar URL' })
  avatarUrl?: string;

  @IsOptional()
  @Matches(/^[0-9+\-() ]{7,15}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
