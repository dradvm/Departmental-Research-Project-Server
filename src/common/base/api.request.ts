// types/RequestWithUser.ts
import { Request } from 'express';

export interface ApiRequestData extends Request {
  user: {
    userId: number;
    username: string;
  };
}
