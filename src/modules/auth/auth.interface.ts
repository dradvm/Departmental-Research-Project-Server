import { UserWithoutPassword } from 'src/modules/user/user.interface';
import { AuthRequest } from './dto/auth-request.dto';

export interface ILoginResponse {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  crsfToken: string;
}

export interface IJwtPayload {
  sub: string;
  exp: number;
  iat: number;
}

export interface ITokenContext {
  user: UserWithoutPassword | null;
  accessToken?: string;
  refreshToken?: string;
  crsfToken?: string;
  sessionId?: string;
  deviceId?: string;
  authRequest: AuthRequest;
}
