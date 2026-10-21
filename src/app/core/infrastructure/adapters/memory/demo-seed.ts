import {
  Attendance,
  CalendarEvent,
  Charge,
  Payment,
  Program,
  Schedule,
  Staff,
  Student,
  UserProfile,
} from '../../../domain/models';
import { addDays, localDateTimeIso, today, weekdayOf } from '../../../domain/time';

/** Datos de demostración (solo modo demo, sin Supabase configurado). */

export const seedPrograms = (): Program[] => [
  {
    id: 'prg-bebes',
    name: 'Estimulación temprana',
    slug: 'estimulacion-temprana',
    summary: 'Juego sensorial y motor para los primeros meses de vida.',
    description:
      'Sesiones a domicilio enfocadas en el desarrollo motor, sensorial, cognitivo y del vínculo afectivo. Incluye guía para que la familia continúe las actividades durante la semana.',
    ageMinMonths: 3,
    ageMaxMonths: 12,
    modality: 'domicilio',
    price: 650,
    currency: 'BOB',
    pricePeriod: 'mensual',
    sessionsPerWeek: 2,
    sessionMinutes: 45,
    color: 'sky',
    icon: 'baby',
    features: [
      'Evaluación inicial del desarrollo',
      'Plan de actividades para casa',
      'Informe mensual',
    ],
    isFeatured: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'prg-exploradores',
    name: 'Pequeños exploradores',
    slug: 'pequenos-exploradores',
    summary: 'Lenguaje, movimiento y autonomía de 1 a 3 años.',
    description:
      'Estimulación integral para la etapa de los primeros pasos y palabras: lenguaje, motricidad gruesa y fina, juego simbólico y hábitos de autonomía.',
    ageMinMonths: 12,
    ageMaxMonths: 36,
    modality: 'domicilio',
    price: 780,
    currency: 'BOB',
    pricePeriod: 'mensual',
    sessionsPerWeek: 3,
    sessionMinutes: 50,
    color: 'yellow',
    icon: 'puzzle',
    features: [
      '3 visitas por semana',
      'Material didáctico incluido',
      'Informe mensual',
      'Seguimiento por WhatsApp',
    ],
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'prg-preescolar',
    name: 'Preparación preescolar',
    slug: 'preparacion-preescolar',
    summary: 'Prelectura, preescritura y habilidades sociales.',
    description:
      'Prepara a tu hijo para el kínder y la escuela: atención, motricidad fina, conciencia fonológica, nociones lógico-matemáticas y manejo de emociones.',
    ageMinMonths: 36,
    ageMaxMonths: 72,
    modality: 'mixto',
    price: 720,
    currency: 'BOB',
    pricePeriod: 'mensual',
    sessionsPerWeek: 2,
    sessionMinutes: 60,
    color: 'pink',
    icon: 'palette',
    features: ['Domicilio o centro', 'Cuadernillo de trabajo', 'Reunión trimestral con la familia'],
    isFeatured: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'prg-apoyo',
    name: 'Apoyo escolar',
    slug: 'apoyo-escolar',
    summary: 'Tareas, hábitos de estudio y refuerzo de materias.',
    description:
      'Profesoras que acompañan las tareas y refuerzan lectura, escritura y matemáticas, siguiendo el avance del colegio y enseñando técnicas de estudio.',
    ageMinMonths: 72,
    ageMaxMonths: 144,
    modality: 'domicilio',
    price: 850,
    currency: 'BOB',
    pricePeriod: 'mensual',
    sessionsPerWeek: 3,
    sessionMinutes: 90,
    color: 'green',
    icon: 'book',
    features: ['Refuerzo de materias', 'Preparación de exámenes', 'Reporte semanal'],
    isFeatured: false,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'prg-lenguaje',
    name: 'Estimulación del lenguaje',
    slug: 'estimulacion-lenguaje',
    summary: 'Sesiones individuales para hablar y comunicarse mejor.',
    description:
      'Trabajo individual en articulación, vocabulario y comprensión, coordinado con la familia y el colegio.',
    ageMinMonths: 24,
    ageMaxMonths: 96,
    modality: 'centro',
    price: 120,
    currency: 'BOB',
    pricePeriod: 'sesion',
    sessionsPerWeek: 1,
    sessionMinutes: 45,
    color: 'purple',
    icon: 'message',
    features: ['Evaluación del lenguaje', 'Sesiones individuales', 'Pautas para casa'],
    isFeatured: false,
    isActive: true,
    sortOrder: 5,
  },
];

export const seedStaff = (): Staff[] => [
  {
    id: 'stf-ana',
    fullName: 'Ana Gutiérrez',
    roleTitle: 'Directora · Estimuladora',
    bio: 'Licenciada en Psicopedagogía con 10 años acompañando a bebés y familias.',
    photoUrl: null,
    specialties: ['Estimulación temprana', 'Neurodesarrollo'],
    email: 'ana@lluviadecolores.com',
    phone: '+591 70000001',
    color: 'sky',
    isActive: true,
    showOnLanding: true,
    sortOrder: 1,
  },
  {
    id: 'stf-carla',
    fullName: 'Carla Méndez',
    roleTitle: 'Estimuladora',
    bio: 'Especialista en psicomotricidad y juego. Le encanta la música en cada sesión.',
    photoUrl: null,
    specialties: ['Psicomotricidad', 'Música'],
    email: 'carla@lluviadecolores.com',
    phone: '+591 70000002',
    color: 'yellow',
    isActive: true,
    showOnLanding: true,
    sortOrder: 2,
  },
  {
    id: 'stf-sofia',
    fullName: 'Sofía Rojas',
    roleTitle: 'Fonoaudióloga',
    bio: 'Acompaña a niños en el desarrollo del lenguaje y la comunicación.',
    photoUrl: null,
    specialties: ['Lenguaje', 'Lectoescritura'],
    email: 'sofia@lluviadecolores.com',
    phone: '+591 70000003',
    color: 'purple',
    isActive: true,
    showOnLanding: true,
    sortOrder: 3,
  },
  {
    id: 'stf-maria',
    fullName: 'María José Vaca',
    roleTitle: 'Profesora de apoyo escolar',
    bio: 'Profesora de primaria con técnicas de estudio para cada estilo de aprendizaje.',
    photoUrl: null,
    specialties: ['Matemáticas', 'Hábitos de estudio'],
    email: 'mariajose@lluviadecolores.com',
    phone: '+591 70000004',
    color: 'green',
    isActive: true,
    showOnLanding: true,
    sortOrder: 4,
  },
  {
    id: 'stf-lucia',
    fullName: 'Lucía Paz',
    roleTitle: 'Estimuladora',
    bio: 'Educadora infantil enfocada en preescolar y habilidades sociales.',
    photoUrl: null,
    specialties: ['Preescolar', 'Emociones'],
    email: 'lucia@lluviadecolores.com',
    phone: '+591 70000005',
    color: 'pink',
    isActive: true,
    showOnLanding: true,
    sortOrder: 5,
  },
];

const student = (
  id: string,
  fullName: string,
  birthDate: string,
  programId: string,
  guardianName: string,
  guardianEmail: string,
  address: string,
): Student => ({
  id,
  fullName,
  birthDate,
  programId,
  guardianName,
  guardianEmail,
  guardianPhone: '+591 7' + id.length + '000000',
  address,
  notes: '',
  qrToken: `${id}-qr-0001`,
  isActive: true,
});

export const seedStudents = (): Student[] => [
  student(
    'std-emilia',
    'Emilia Suárez',
    '2025-12-02',
    'prg-bebes',
    'Lucía Suárez',
    'lucia.suarez@mail.com',
    'Equipetrol, calle 7 #45',
  ),
  student(
    'std-mateo',
    'Mateo Aguilera',
    '2024-06-15',
    'prg-exploradores',
    'Daniela Rivero',
    'daniela@mail.com',
    'Urb. Las Palmas, casa 12',
  ),
  student(
    'std-thiago',
    'Thiago Montaño',
    '2024-11-20',
    'prg-exploradores',
    'Paola Montaño',
    'paola@mail.com',
    'Av. Banzer 4to anillo',
  ),
  student(
    'std-isabella',
    'Isabella Cuéllar',
    '2022-03-08',
    'prg-preescolar',
    'Marcelo Cuéllar',
    'marcelo@mail.com',
    'Barrio Sirari',
  ),
  student(
    'std-valentina',
    'Valentina Paredes',
    '2019-08-30',
    'prg-apoyo',
    'Jorge Paredes',
    'padre@demo.com',
    'Calle Libertad #890',
  ),
  student(
    'std-santiago',
    'Santiago Rivera',
    '2018-01-12',
    'prg-apoyo',
    'Andrea Rivera',
    'andrea@mail.com',
    'Condominio Los Robles',
  ),
  student(
    'std-luciana',
    'Luciana Flores',
    '2021-05-25',
    'prg-lenguaje',
    'Carmen Flores',
    'carmen@mail.com',
    'Centro LDC',
  ),
];

const sch = (
  id: string,
  staffId: string,
  studentId: string,
  programId: string,
  weekday: Schedule['weekday'],
  startTime: string,
  endTime: string,
): Schedule => ({
  id,
  staffId,
  studentId,
  programId,
  weekday,
  startTime,
  endTime,
  notes: '',
  isActive: true,
});

export const seedSchedules = (): Schedule[] => [
  sch('sch-1', 'stf-ana', 'std-emilia', 'prg-bebes', 1, '09:00', '09:45'),
  sch('sch-2', 'stf-ana', 'std-emilia', 'prg-bebes', 4, '09:00', '09:45'),
  sch('sch-3', 'stf-carla', 'std-mateo', 'prg-exploradores', 1, '10:00', '10:50'),
  sch('sch-4', 'stf-carla', 'std-mateo', 'prg-exploradores', 3, '10:00', '10:50'),
  sch('sch-5', 'stf-carla', 'std-mateo', 'prg-exploradores', 5, '10:00', '10:50'),
  sch('sch-6', 'stf-carla', 'std-thiago', 'prg-exploradores', 2, '15:00', '15:50'),
  sch('sch-7', 'stf-carla', 'std-thiago', 'prg-exploradores', 4, '15:00', '15:50'),
  sch('sch-8', 'stf-carla', 'std-thiago', 'prg-exploradores', 6, '09:30', '10:20'),
  sch('sch-9', 'stf-lucia', 'std-isabella', 'prg-preescolar', 2, '16:00', '17:00'),
  sch('sch-10', 'stf-lucia', 'std-isabella', 'prg-preescolar', 4, '16:00', '17:00'),
  sch('sch-11', 'stf-maria', 'std-valentina', 'prg-apoyo', 1, '15:00', '16:30'),
  sch('sch-12', 'stf-maria', 'std-valentina', 'prg-apoyo', 3, '15:00', '16:30'),
  sch('sch-13', 'stf-maria', 'std-valentina', 'prg-apoyo', 5, '15:00', '16:30'),
  sch('sch-14', 'stf-maria', 'std-santiago', 'prg-apoyo', 2, '17:00', '18:30'),
  sch('sch-15', 'stf-maria', 'std-santiago', 'prg-apoyo', 4, '17:00', '18:30'),
  sch('sch-16', 'stf-sofia', 'std-luciana', 'prg-lenguaje', 3, '11:00', '11:45'),
];

/** Genera visitas de los últimos 21 días a partir de los horarios (determinista). */
export const seedAttendances = (): Attendance[] => {
  const result: Attendance[] = [];
  const now = Date.now();
  const schedules = seedSchedules();
  for (let back = 21; back >= 0; back--) {
    const date = addDays(today(), -back);
    const wd = weekdayOf(date);
    for (const s of schedules.filter((x) => x.weekday === wd)) {
      const seed = (back * 31 + Number(s.id.split('-')[1]) * 17) % 100;
      if (seed < 7) continue; // ausencias ocasionales
      const lateMin = seed < 20 ? 8 + (seed % 10) : seed % 5;
      const [h, m] = s.startTime.split(':').map(Number);
      const startMin = h * 60 + m + lateMin;
      const checkIn = localDateTimeIso(
        date,
        `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`,
      );
      if (new Date(checkIn).getTime() > now) continue;
      const [eh, em] = s.endTime.split(':').map(Number);
      const endMin = eh * 60 + em + (seed % 6);
      const checkOut = localDateTimeIso(
        date,
        `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
      );
      result.push({
        id: `att-${date}-${s.id}`,
        staffId: s.staffId,
        studentId: s.studentId,
        scheduleId: s.id,
        checkInAt: checkIn,
        checkOutAt: new Date(checkOut).getTime() > now ? null : checkOut,
        source: 'qr',
        notes: '',
      });
    }
  }
  return result;
};

export const seedEvents = (): CalendarEvent[] => {
  const t = today();
  const month = t.slice(0, 8);
  const nextMonth = addDays(`${month}01`, 32).slice(0, 8);
  return [
    {
      id: 'evt-1',
      title: 'Taller para padres: límites con amor',
      description: 'Taller presencial gratuito para familias inscritas.',
      kind: 'taller',
      startDate: `${month}18`,
      endDate: null,
      color: 'pink',
      isPublic: true,
    },
    {
      id: 'evt-2',
      title: 'Inscripciones gestión 2027',
      description: 'Reserva tu cupo con descuento por pronto pago.',
      kind: 'inscripcion',
      startDate: `${month}24`,
      endDate: `${nextMonth}10`,
      color: 'green',
      isPublic: true,
    },
    {
      id: 'evt-3',
      title: 'Día de juego en familia',
      description: 'Circuito de psicomotricidad en el centro.',
      kind: 'evento',
      startDate: `${month}08`,
      endDate: null,
      color: 'yellow',
      isPublic: true,
    },
    {
      id: 'evt-4',
      title: 'Feriado: Todos Santos',
      description: 'No hay sesiones.',
      kind: 'feriado',
      startDate: `${nextMonth}02`,
      endDate: null,
      color: 'red',
      isPublic: true,
    },
    {
      id: 'evt-5',
      title: 'Muestra de fin de año',
      description: 'Presentación de los niños de preescolar.',
      kind: 'evento',
      startDate: `${nextMonth}20`,
      endDate: null,
      color: 'purple',
      isPublic: true,
    },
  ];
};

export const seedCharges = (): Charge[] => {
  const period = today().slice(0, 7);
  const prev = addDays(`${period}-01`, -1).slice(0, 7);
  const programs = seedPrograms();
  const out: Charge[] = [];
  for (const s of seedStudents()) {
    const p = programs.find((x) => x.id === s.programId)!;
    const amount = p.pricePeriod === 'sesion' ? p.price * p.sessionsPerWeek * 4 : p.price;
    out.push({
      id: `chg-${prev}-${s.id}`,
      studentId: s.id,
      concept: `Mensualidad ${p.name}`,
      period: prev,
      amount,
      currency: 'BOB',
      dueDate: `${prev}-10`,
      status: 'pagado',
      paidAt: localDateTimeIso(`${prev}-08`, '10:00'),
    });
    const paid = ['std-mateo', 'std-valentina', 'std-luciana'].includes(s.id);
    out.push({
      id: `chg-${period}-${s.id}`,
      studentId: s.id,
      concept: `Mensualidad ${p.name}`,
      period,
      amount,
      currency: 'BOB',
      dueDate: `${period}-10`,
      status: paid ? 'pagado' : today() > `${period}-10` ? 'vencido' : 'pendiente',
      paidAt: paid ? localDateTimeIso(`${period}-05`, '11:00') : null,
    });
  }
  return out;
};

export const seedPayments = (): Payment[] =>
  seedCharges()
    .filter((c) => c.status === 'pagado')
    .map((c) => ({
      id: `pay-${c.id}`,
      chargeId: c.id,
      amount: c.amount,
      method: 'transferencia' as const,
      status: 'aprobado' as const,
      provider: null,
      providerReference: null,
      paidAt: c.paidAt!,
      notes: '',
    }));

/** Cuentas de la demo. Contraseña para todas: `demo1234`. */
export const seedProfiles = (): UserProfile[] => [
  { id: 'usr-admin', email: 'admin@demo.com', fullName: 'Administración LDC', role: 'admin' },
  { id: 'usr-ana', email: 'ana@lluviadecolores.com', fullName: 'Ana Gutiérrez', role: 'teacher' },
  {
    id: 'usr-carla',
    email: 'carla@lluviadecolores.com',
    fullName: 'Carla Méndez',
    role: 'teacher',
  },
  { id: 'usr-padre', email: 'padre@demo.com', fullName: 'Jorge Paredes', role: 'parent' },
];
