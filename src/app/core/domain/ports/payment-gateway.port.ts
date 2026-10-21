import { Charge, CheckoutSession, PaymentStatus } from '../models';

/**
 * ETAPA 2 — Pago en línea desde la app.
 *
 * Contrato que implementará el adapter de la pasarela elegida. La creación del
 * cobro y la verificación deben vivir en el servidor (Supabase Edge Function),
 * nunca con llaves privadas en el navegador. El adapter solo invoca esa función.
 */
export abstract class PaymentGateway {
  abstract readonly provider: string;
  abstract readonly isAvailable: boolean;
  abstract createCheckout(charge: Charge): Promise<CheckoutSession>;
  abstract checkStatus(reference: string): Promise<PaymentStatus>;
}
