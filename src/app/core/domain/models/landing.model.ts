import { BrandColor } from './common.model';

export interface HeroContent {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface AboutContent {
  title: string;
  body: string;
  stats: { value: string; label: string }[];
  values: { title: string; text: string; color: BrandColor }[];
}

export interface Testimonial {
  name: string;
  relation: string;
  quote: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContactContent {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  hours: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}

/** Contenido editable de la landing. Cada clave es una fila de `landing_sections`. */
export interface LandingContent {
  hero: HeroContent;
  about: AboutContent;
  testimonials: Testimonial[];
  faq: FaqItem[];
  contact: ContactContent;
}

export type LandingSectionKey = keyof LandingContent;

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    eyebrow: 'Estimulación temprana y apoyo escolar',
    title: 'Cada niño aprende a su ritmo,',
    highlight: 'nosotras le damos color',
    subtitle:
      'Estimuladoras y profesoras especializadas que visitan a tu hijo en casa o lo reciben en nuestro centro, con seguimiento de cada sesión.',
    ctaPrimary: 'Ver servicios',
    ctaSecondary: 'Hablar por WhatsApp',
  },
  about: {
    title: 'Acompañamos el desarrollo de tu hijo',
    body: 'En Lluvia de Colores creemos que los primeros años son una oportunidad única. Diseñamos programas de estimulación y apoyo escolar adaptados a cada etapa, con profesionales que hacen del juego su herramienta principal.',
    stats: [
      { value: '+50', label: 'familias acompañadas' },
      { value: '6', label: 'estimuladoras' },
      { value: '5', label: 'años de experiencia' },
    ],
    values: [
      {
        title: 'Juego con propósito',
        text: 'Cada actividad tiene un objetivo de desarrollo.',
        color: 'yellow',
      },
      {
        title: 'Seguimiento real',
        text: 'Registramos cada visita y te mostramos el avance.',
        color: 'green',
      },
      {
        title: 'Cariño profesional',
        text: 'Equipo formado, cálido y comprometido.',
        color: 'pink',
      },
    ],
  },
  testimonials: [
    {
      name: 'Daniela R.',
      relation: 'Mamá de Mateo, 2 años',
      quote:
        'Mateo espera la visita de su estimuladora toda la semana. Avanzó muchísimo en lenguaje.',
    },
    {
      name: 'Jorge P.',
      relation: 'Papá de Valentina, 7 años',
      quote: 'El apoyo escolar le devolvió la confianza con las matemáticas. Muy recomendados.',
    },
    {
      name: 'Lucía M.',
      relation: 'Mamá de Emilia, 10 meses',
      quote: 'Me encanta poder ver a qué hora llegó la profe y cuánto duró cada sesión.',
    },
  ],
  faq: [
    {
      question: '¿Desde qué edad pueden empezar?',
      answer:
        'La estimulación temprana puede iniciar desde los 3 meses. El apoyo escolar es para niños de 6 a 12 años.',
    },
    {
      question: '¿Las sesiones son a domicilio?',
      answer:
        'Sí. La mayoría de nuestros programas son a domicilio y algunos también se ofrecen en el centro.',
    },
    {
      question: '¿Cómo sé que la estimuladora asistió?',
      answer:
        'Cada visita se registra escaneando un código QR en tu casa. Desde tu cuenta puedes ver la hora de entrada y salida.',
    },
    {
      question: '¿Cómo pago la mensualidad?',
      answer:
        'Por ahora aceptamos transferencia y efectivo. Muy pronto podrás pagar directamente desde tu cuenta.',
    },
  ],
  contact: {
    phone: '+591 72419691',
    whatsapp: '59172419691',
    email: 'hola@lluviadecolores.site',
    address: 'Av. 7mo anillo y Av. Canal Pedro Vélez, Paseo Comercial Berchatti, local 16',
    city: 'Santa Cruz, Bolivia',
    hours: 'Lunes a sábado, 8:00 – 19:00',
    facebook: 'https://www.facebook.com/profile.php?id=100078783914695',
    instagram: 'https://www.instagram.com/lluviadecolores_scz',
    tiktok: '',
  },
};
