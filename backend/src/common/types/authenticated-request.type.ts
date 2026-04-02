import type { User } from '@prisma/client';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user: Pick<User, 'id' | 'email' | 'role' | 'pharmacyId'>;
  pharmacyId?: string;
  pharmacy?: {
    id: string;
    isActive: boolean;
    plan: string;
  };
};
