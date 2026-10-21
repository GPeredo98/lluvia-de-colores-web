import { BrandColor, Entity } from './common.model';

export type Modality = 'domicilio' | 'centro' | 'virtual' | 'mixto';
export type PricePeriod = 'mensual' | 'sesion' | 'paquete';

export const MODALITY_LABELS: Record<Modality, string> = {
  domicilio: 'A domicilio',
  centro: 'En el centro',
  virtual: 'Virtual',
  mixto: 'Mixto',
};

export const PRICE_PERIOD_LABELS: Record<PricePeriod, string> = {
  mensual: 'por mes',
  sesion: 'por sesión',
  paquete: 'por paquete',
};

/** Programa / servicio que ofrece Lluvia de Colores. */
export interface Program extends Entity {
  name: string;
  slug: string;
  summary: string;
  description: string;
  /** Edad mínima y máxima en meses. */
  ageMinMonths: number;
  ageMaxMonths: number;
  modality: Modality;
  price: number;
  currency: string;
  pricePeriod: PricePeriod;
  sessionsPerWeek: number;
  sessionMinutes: number;
  color: BrandColor;
  icon: string;
  features: string[];
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}
