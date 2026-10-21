import { BrandColor, Entity } from './common.model';

/** Estimuladora / profesora de apoyo escolar. */
export interface Staff extends Entity {
  fullName: string;
  roleTitle: string;
  bio: string;
  photoUrl: string | null;
  specialties: string[];
  /** Correo con el que inicia sesión en la app móvil. */
  email: string;
  phone: string;
  color: BrandColor;
  isActive: boolean;
  showOnLanding: boolean;
  sortOrder: number;
}
