import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { BillingFacade, LandingFacade, SchedulesFacade } from './core/application';
import { provideDataLayer } from './core/infrastructure/provide-data-layer';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideDataLayer()],
    });
  });

  it('crea la aplicación', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('la landing carga programas y filtra por edad', async () => {
    const landing = TestBed.inject(LandingFacade);
    await landing.load();
    expect(landing.programs().length).toBeGreaterThan(0);
    landing.selectAgeGroup('escolar');
    expect(landing.filteredPrograms().every((p) => p.ageMaxMonths > 72)).toBe(true);
  });

  it('detecta horarios que se solapan para la misma estimuladora', async () => {
    const schedules = TestBed.inject(SchedulesFacade);
    await schedules.load();
    const existing = schedules.active()[0];
    const conflicts = schedules.findConflicts({ ...existing, id: null, studentId: 'otro' });
    expect(conflicts.some((c) => c.reason === 'staff')).toBe(true);
  });

  it('calcula el resumen de cobros', async () => {
    const billing = TestBed.inject(BillingFacade);
    await billing.init();
    const s = billing.summary();
    expect(s.billed).toBeGreaterThan(0);
    expect(s.collected + s.pending + s.overdue).toBe(s.billed);
  });
});
