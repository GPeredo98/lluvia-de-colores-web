import { InjectionToken } from '@angular/core';

/** true cuando la app corre con datos de demostración (sin backend configurado). */
export const DEMO_MODE = new InjectionToken<boolean>('DEMO_MODE');
