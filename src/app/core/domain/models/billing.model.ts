import { Entity } from './common.model';

export type ChargeStatus = 'pendiente' | 'pagado' | 'vencido' | 'anulado';

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  vencido: 'Vencido',
  anulado: 'Anulado',
};

/** Cuota / cobro asignado a un estudiante (p. ej. la mensualidad). */
export interface Charge extends Entity {
  studentId: string;
  concept: string;
  /** yyyy-MM */
  period: string;
  amount: number;
  currency: string;
  /** yyyy-MM-dd */
  dueDate: string;
  status: ChargeStatus;
  paidAt: string | null;
}

/**
 * - efectivo / transferencia: registrados manualmente por un admin (etapa 1).
 * - pasarela: pago en línea desde la app (etapa 2).
 */
export type PaymentMethod = 'efectivo' | 'transferencia' | 'pasarela';
export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  pasarela: 'Pago en línea',
};

export interface Payment extends Entity {
  chargeId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  /** Proveedor de pasarela (etapa 2), p. ej. 'libelula', 'stripe'. */
  provider: string | null;
  providerReference: string | null;
  paidAt: string;
  notes: string;
}

/** Sesión de cobro devuelta por la pasarela (etapa 2). */
export interface CheckoutSession {
  provider: string;
  reference: string;
  /** URL o QR para que el padre complete el pago. */
  redirectUrl: string | null;
  qrImage: string | null;
  expiresAt: string | null;
}
