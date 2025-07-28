import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../interfaces/user.interface';
import { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: User;
  }
}

export const CurrentUser = createParamDecorator(
  (data, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as User;
  },
);
