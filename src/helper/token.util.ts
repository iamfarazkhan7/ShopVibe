import { JwtService } from '@nestjs/jwt';

export const signToken = (
  jwt: JwtService,
  payload: object,
  secret: string,
  expiresIn: string,
): Promise<string> => {
  return jwt.signAsync(payload, { secret, expiresIn });
};
