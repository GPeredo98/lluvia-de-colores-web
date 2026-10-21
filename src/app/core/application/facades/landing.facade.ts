import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  PendingTasks,
  TransferState,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import {
  CalendarEvent,
  DEFAULT_LANDING_CONTENT,
  LandingContent,
  Program,
  Staff,
} from '../../domain/models';
import {
  CalendarRepository,
  LandingRepository,
  ProgramRepository,
  StaffRepository,
} from '../../domain/ports';
import { addDays, today, weekdayOf } from '../../domain/time';

export interface AgeGroup {
  id: string;
  label: string;
  hint: string;
  minMonths: number;
  maxMonths: number;
}

export const AGE_GROUPS: AgeGroup[] = [
  { id: 'bebes', label: '0 – 1 año', hint: 'Bebés', minMonths: 0, maxMonths: 12 },
  { id: 'peques', label: '1 – 3 años', hint: 'Primeros pasos', minMonths: 12, maxMonths: 36 },
  { id: 'preescolar', label: '3 – 6 años', hint: 'Preescolar', minMonths: 36, maxMonths: 72 },
  { id: 'escolar', label: '6 – 12 años', hint: 'Escolar', minMonths: 72, maxMonths: 144 },
];

export type PriceMode = 'mensual' | 'sesion';

export interface PricedProgram {
  program: Program;
  monthly: number;
  perSession: number;
  sessionsPerMonth: number;
}

export interface CalendarCell {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

interface LandingData {
  content: LandingContent;
  programs: Program[];
  team: Staff[];
  events: CalendarEvent[];
}

const LANDING_KEY = makeStateKey<LandingData>('ldc-landing');
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
/** Meses navegables en el calendario público, contando el actual. */
const CALENDAR_MONTHS_AHEAD = 6;

const monthOf = (date: string) => date.slice(0, 7);
const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const lastDayOf = (month: string) => addDays(`${shiftMonth(month, 1)}-01`, -1);

/** Estado de la landing pública. Se renderiza en el servidor (SSR) y se hidrata con TransferState. */
@Injectable({ providedIn: 'root' })
export class LandingFacade {
  private readonly programsRepo = inject(ProgramRepository);
  private readonly staffRepo = inject(StaffRepository);
  private readonly calendarRepo = inject(CalendarRepository);
  private readonly landingRepo = inject(LandingRepository);
  private readonly transferState = inject(TransferState);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _data = signal<LandingData>({
    content: DEFAULT_LANDING_CONTENT,
    programs: [],
    team: [],
    events: [],
  });
  private readonly _loaded = signal(false);
  private readonly _ageGroup = signal<string | null>(null);
  private readonly _priceMode = signal<PriceMode>('mensual');
  private readonly _selectedProgram = signal<string | null>(null);
  private readonly _month = signal(monthOf(today()));
  private readonly _selectedDate = signal<string | null>(null);

  readonly loaded = this._loaded.asReadonly();
  readonly content = computed(() => this._data().content);
  readonly programs = computed(() => this._data().programs);
  readonly team = computed(() => this._data().team);
  readonly ageGroups = AGE_GROUPS;
  readonly ageGroup = this._ageGroup.asReadonly();
  readonly priceMode = this._priceMode.asReadonly();

  readonly filteredPrograms = computed(() => {
    const group = AGE_GROUPS.find((g) => g.id === this._ageGroup());
    if (!group) return this.programs();
    return this.programs().filter(
      (p) => p.ageMinMonths < group.maxMonths && p.ageMaxMonths > group.minMonths,
    );
  });

  readonly pricedPrograms = computed<PricedProgram[]>(() =>
    this.programs().map((program) => {
      const sessionsPerMonth = program.sessionsPerWeek * 4;
      const monthly =
        program.pricePeriod === 'sesion' ? program.price * sessionsPerMonth : program.price;
      return {
        program,
        sessionsPerMonth,
        monthly,
        perSession:
          program.pricePeriod === 'sesion' ? program.price : Math.round(monthly / sessionsPerMonth),
      };
    }),
  );

  readonly selectedProgram = computed(
    () => this.programs().find((p) => p.id === this._selectedProgram()) ?? null,
  );

  // ---- Calendario --------------------------------------------------------
  readonly month = this._month.asReadonly();
  readonly monthLabel = computed(() => {
    const [y, m] = this._month().split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  });
  readonly canGoPrev = computed(() => this._month() > monthOf(today()));
  readonly canGoNext = computed(
    () => this._month() < shiftMonth(monthOf(today()), CALENDAR_MONTHS_AHEAD - 1),
  );

  readonly calendarCells = computed<CalendarCell[]>(() => {
    const month = this._month();
    const first = `${month}-01`;
    const start = addDays(first, -(weekdayOf(first) - 1));
    const last = lastDayOf(month);
    const end = addDays(last, 7 - weekdayOf(last));
    const now = today();
    const events = this._data().events;
    const cells: CalendarCell[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const wd = weekdayOf(d);
      cells.push({
        date: d,
        day: Number(d.slice(8)),
        inMonth: monthOf(d) === month,
        isToday: d === now,
        isWeekend: wd >= 6,
        events: events.filter((e) => e.startDate <= d && (e.endDate ?? e.startDate) >= d),
      });
    }
    return cells;
  });

  readonly selectedDate = this._selectedDate.asReadonly();
  readonly selectedDayEvents = computed(() => {
    const date = this._selectedDate();
    return date ? (this.calendarCells().find((c) => c.date === date)?.events ?? []) : [];
  });

  readonly upcomingEvents = computed(() => {
    const now = today();
    return this._data()
      .events.filter((e) => (e.endDate ?? e.startDate) >= now)
      .slice(0, 4);
  });

  // ---- Acciones ----------------------------------------------------------
  /**
   * Primer render: usa lo transferido por el servidor (sin parpadeo en la hidratación)
   * y luego refresca en segundo plano en el navegador.
   */
  async load(): Promise<void> {
    const transferred = this.transferState.get(LANDING_KEY, null);
    if (transferred) {
      this._data.set(transferred);
      this._loaded.set(true);
      this.transferState.remove(LANDING_KEY);
      if (this.isBrowser) setTimeout(() => void this.fetch(), 0);
      return;
    }
    const done = this.pendingTasks.add();
    try {
      await this.fetch();
      if (!this.isBrowser) this.transferState.set(LANDING_KEY, this._data());
    } finally {
      done();
    }
  }

  selectAgeGroup(id: string | null) {
    this._ageGroup.set(this._ageGroup() === id ? null : id);
  }

  setPriceMode(mode: PriceMode) {
    this._priceMode.set(mode);
  }

  openProgram(id: string) {
    this._selectedProgram.set(id);
  }

  closeProgram() {
    this._selectedProgram.set(null);
  }

  prevMonth() {
    if (this.canGoPrev()) this._month.update((m) => shiftMonth(m, -1));
    this._selectedDate.set(null);
  }

  nextMonth() {
    if (this.canGoNext()) this._month.update((m) => shiftMonth(m, 1));
    this._selectedDate.set(null);
  }

  selectDate(date: string | null) {
    this._selectedDate.set(this._selectedDate() === date ? null : date);
  }

  /** Link de WhatsApp con mensaje prellenado. */
  whatsappLink(message: string) {
    const number = this.content().contact.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  private async fetch() {
    const from = `${monthOf(today())}-01`;
    const to = lastDayOf(shiftMonth(monthOf(today()), CALENDAR_MONTHS_AHEAD - 1));
    try {
      const [content, programs, team, events] = await Promise.all([
        this.landingRepo.get(),
        this.programsRepo.listPublic(),
        this.staffRepo.listPublic(),
        this.calendarRepo.listPublic(from, to),
      ]);
      this._data.set({ content, programs, team, events });
    } catch (e) {
      // La landing nunca debe romperse: se queda con el contenido por defecto.
      console.error('[landing] no se pudo cargar el contenido', e);
    } finally {
      this._loaded.set(true);
    }
  }
}
