import { UserRole } from 'generated/prisma';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  verificationCode?: string | null;
  verificationExpires?: Date | null;
  passwordResetCode?: string | null;
  passwordResetExpires?: Date | null;
  profilePhotoId?: string | null;
  profilePhotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
