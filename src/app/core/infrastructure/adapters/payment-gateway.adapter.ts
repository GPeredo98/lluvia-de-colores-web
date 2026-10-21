import { Injectable } from '@angular/core';
import { Charge, CheckoutSession, PaymentStatus } from '../../domain/models';
import { PaymentGateway } from '../../domain/ports';

/**
 * ETAPA 2 — placeholder hasta elegir pasarela.
 *
 * Para integrarla:
 * 1. Crear la Edge Function `create-checkout` (recibe charge_id, llama a la pasarela con la
 *    llave privada y guarda un `payments` en estado 'pendiente' con `provider_reference`).
 * 2. Crear la Edge Function `payment-webhook` que la pasarela llama al confirmar; esta pasa
 *    el pago a 'aprobado' y el trigger `payments_mark_charge_paid` cierra la cuota.
 * 3. Implementar aquí `createCheckout` con `supabase.functions.invoke('create-checkout', …)`
 *    y cambiar el provider en `provideDataLayer()`.
 */
@Injectable()
export class NotConfiguredPaymentGateway implements PaymentGateway {
  readonly provider = 'none';
  readonly isAvailable = false;

  createCheckout(_charge: Charge): Promise<CheckoutSession> {
    return Promise.reject(new Error('El pago en línea estará disponible próximamente'));
  }

  checkStatus(_reference: string): Promise<PaymentStatus> {
    return Promise.reject(new Error('El pago en línea estará disponible próximamente'));
  }
}
