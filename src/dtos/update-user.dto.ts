import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid avatar URL' })
  avatarUrl?: string;

  @IsOptional()
  @Matches(/^[0-9+\-() ]{7,15}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;
}
