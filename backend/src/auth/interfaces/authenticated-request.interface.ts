import { Request } from 'express';
import { User } from '../interfaces/user.interface';

export interface AuthenticatedRequest extends Request {
  user: User;
}
