import { IsEmail, IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { AppRole } from './AppRole';

export class CreateUserDto{

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
}