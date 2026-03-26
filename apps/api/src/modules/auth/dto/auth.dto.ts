import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ required: false, description: 'Refresh token (can also be sent via cookie)' })
  refreshToken?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ required: false, description: 'JWT refresh token (only on login/register)' })
  refreshToken?: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}
