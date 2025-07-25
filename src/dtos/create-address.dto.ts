import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsString() fullName: string;
  @IsString() phone: string;
  @IsString() street: string;
  @IsString() city: string;
  @IsString() province: string;
  @IsString() postalCode: string;
  @IsString() country: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
