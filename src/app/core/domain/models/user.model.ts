import { Entity } from './common.model';

export type UserRole = 'admin' | 'teacher' | 'parent';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  teacher: 'Estimuladora',
  parent: 'Padre / madre',
};

export interface UserProfile extends Entity {
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Credentials {
  email: string;
  password: string;
}
