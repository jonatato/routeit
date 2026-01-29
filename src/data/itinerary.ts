export type DayKind = 'flight' | 'travel' | 'city';

export interface ScheduleItem {
  time: string;
  activity: string;
  link?: string;
  mapLink?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  cost?: number;
  costCurrency?: string;
  costPayerId?: string;
  costSplitExpenseId?: string;
}

export interface ItineraryDay {
  id: string;
  dayLabel: string;
  date: string;
  city: string;
  plan: string;
  notes: string[];
  kind: DayKind;
  schedule: ScheduleItem[];
  tags?: string[];
}

export interface Phrase {
  spanish: string;
  pinyin: string;
  chinese: string;
}

export interface ItineraryLocation {
  city: string;
  label: string;
  lat: number;
  lng: number;
}

export interface TravelItinerary {
  id?: string;
  title: string;
  dateRange: string;
  intro: string;
  days: ItineraryDay[];
  budgetTiers: Array<{ label: string; daily: number; tone: 'secondary' | 'primary' | 'accent' }>;
  tagsCatalog?: Array<{ name: string; slug: string }>;
  foods: string[];
  tips: string[];
  avoid: string[];
  utilities: string[];
  packing: string[];
  money: string[];
  connectivity: string[];
  transport: string[];
  safety: string[];
  etiquette: string[];
  weather: string[];
  scams: string[];
  budgetTips: string[];
  emergency: string[];
  phrases: Phrase[];
  locations: ItineraryLocation[];
  route: string[];
  flights: {
    outbound: {
      date: string;
      fromTime: string;
      toTime: string;
      fromCity: string;
      toCity: string;
      duration: string;
      stops: string;
    };
    inbound: {
      date: string;
      fromTime: string;
      toTime: string;
      fromCity: string;
      toCity: string;
      duration: string;
      stops: string;
    };
  };
}

export const chinaTrip: TravelItinerary = {
  title: 'Mi Viaje 2026',
  dateRange: 'Vie 9 Oct → Vie 31 Oct',
  intro:
    'Itinerario completo con horarios sugeridos, organizado por día y por ciudad, pensado para minimizar traslados y maximizar experiencias.',
  budgetTiers: [
    { label: 'Económico', daily: 45, tone: 'secondary' },
    { label: 'Cómodo', daily: 85, tone: 'primary' },
    { label: 'Confort', daily: 140, tone: 'accent' },
  ],
  tagsCatalog: [
    { name: 'Comida', slug: 'comida' },
    { name: 'Transporte', slug: 'transporte' },
    { name: 'Cultura', slug: 'cultura' },
    { name: 'Naturaleza', slug: 'naturaleza' },
    { name: 'Compras', slug: 'compras' },
  ],
  utilities: [
    'Alipay (pago y enlace con Wise)',
    'WeChat Pay (pago y enlace con Wise)',
    'Didi (taxis)',
    'Amap / Gaode Maps (mapas locales)',
    'Google Translate + Google Lens',
    'Trip.com (reservas)',
    'Civitatis / GetYourGuide (tours)',
    'eSIM + VPN (Holafly)',
    'Seguro de viaje (Heymondo)',
  ],
  packing: [
    'Pasaporte + copia física + copia digital en la nube',
    'Powerbank 20.000 mAh (permitido en cabina)',
    'Adaptador universal + regleta pequeña',
    'Zapatillas cómodas y antideslizantes',
    'Chubasquero ligero + paraguas plegable',
    'Botiquín básico (antiácidos, ibuprofeno, tiritas)',
    'Mascarillas y gel hidroalcohólico',
    'Ropa por capas (mañanas frescas / tardes templadas)',
    'Dinero en efectivo pequeño (billetes de 20/50 RMB)',
    'Baterías extra para cámara y móvil',
  ],
  money: [
    'Paga casi todo con Alipay o WeChat Pay (configura antes del viaje).',
    'Usa Wise para vincular tarjetas y evitar comisiones altas.',
    'Retira efectivo en cajeros de Bank of China si hace falta.',
    'Lleva algo de efectivo para mercados o puestos sin QR.',
  ],
  connectivity: [
    'Instala VPN antes de llegar (Google, WhatsApp, Instagram bloqueados).',
    'Activa eSIM internacional para datos (Holafly o similar).',
    'Descarga mapas offline en Amap/Google Maps antes de salir.',
  ],
  transport: [
    'Trenes bala: llega 45-60 min antes con pasaporte.',
    'Didi es el equivalente a Uber. Evita taxis sin taxímetro.',
    'Metro: barato y eficiente; evita horas pico (8-9h, 18-19h).',
    'Vuelos internos: check-in online y control de seguridad estricto.',
  ],
  safety: [
    'Lleva siempre el pasaporte y guarda copia digital.',
    'Evita barrios desiertos de noche y usa Didi.',
    'No aceptes “tours gratuitos” en zonas turísticas.',
  ],
  etiquette: [
    'En templos, habla bajo y respeta zonas de culto.',
    'No claves los palillos en el arroz (mala suerte).',
    'Entrega y recibe objetos con ambas manos.',
  ],
  weather: [
    'Octubre es templado: 12-22°C en el norte, algo más cálido en el sur.',
    'Lluvias ocasionales en Zhangjiajie: llevar impermeable.',
  ],
  scams: [
    'Estafa del té en Pekín: evita invitaciones espontáneas.',
    'Fotos con “monjes” a cambio de dinero en zonas turísticas.',
    'Precios inflados en taxis sin taxímetro.',
  ],
  budgetTips: [
    'Reserva trenes y vuelos con antelación para mejores precios.',
    'Come en puestos locales: calidad alta y coste bajo.',
    'Compra entradas combinadas cuando sea posible.',
  ],
  emergency: [
    'Emergencias generales: 110',
    'Ambulancia: 120',
    'Bomberos: 119',
    'Policía turística (Pekín): 12367',
  ],
  phrases: [
    { spanish: 'Hola', pinyin: 'Nǐ hǎo', chinese: '你好' },
    { spanish: 'Gracias', pinyin: 'Xièxiè', chinese: '谢谢' },
    { spanish: '¿Cuánto cuesta?', pinyin: 'Duōshao qián?', chinese: '多少钱？' },
    { spanish: 'No picante', pinyin: 'Bù yào là', chinese: '不要辣' },
    { spanish: 'Baño', pinyin: 'Cèsuǒ', chinese: '厕所' },
  ],
  locations: [
    { city: 'Pekín', label: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { city: "Xi'an", label: "Xi'an", lat: 34.3416, lng: 108.9398 },
    { city: 'Chengdu', label: 'Chengdu', lat: 30.5728, lng: 104.0668 },
    { city: 'Chongqing', label: 'Chongqing', lat: 29.563, lng: 106.5516 },
    { city: 'Furong Ancient Town', label: 'Furong', lat: 28.999, lng: 109.602 },
    { city: 'Zhangjiajie', label: 'Zhangjiajie', lat: 29.1167, lng: 110.4792 },
    { city: 'Shanghái', label: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  ],
  route: [
    'Pekín',
    "Xi'an",
    'Chengdu',
    'Chongqing',
    'Furong Ancient Town',
    'Zhangjiajie',
    'Shanghái',
  ],
  foods: [
    'Pekín: pato laqueado, jiaozi, zhajiangmian',
    "Xi'an: roujiamo, biangbiang noodles, liangpi",
    'Chengdu: hotpot, mapo tofu, dan dan noodles',
    'Chongqing: hotpot picante, xiaomian',
    'Zhangjiajie: setas locales, platos con chile',
    'Shanghái: xiaolongbao, shengjianbao, hong shao rou',
  ],
  tips: [
    'Lleva efectivo pequeño para mercados y snacks callejeros.',
    'Compra entradas online el día anterior cuando sea posible.',
    'Empieza temprano en parques y murallas para evitar multitudes.',
    'Lleva siempre pasaporte y una copia digital.',
    'Baterías/powerbank y adaptador universal en el día a día.',
    'Ten instalada una VPN antes de llegar a China.',
  ],
  avoid: [
    'Cambiar dinero en hoteles o aeropuertos (mejor Wise/Alipay).',
    'Subir sin reservas a la Muralla o Parque en horas pico.',
    'Comprar tours sin verificar reseñas.',
    'Perder el pasaporte en traslados (siempre encima).',
    'Olvidar que muchas apps occidentales no funcionan sin VPN.',
  ],
  flights: {
    outbound: {
      date: 'Vie, 09 oct 2026',
      fromTime: '12:30',
      toTime: '05:45',
      fromCity: 'Barcelona',
      toCity: 'Beijing',
      duration: '11h 15min',
      stops: 'Directo',
    },
    inbound: {
      date: 'Sáb, 31 oct 2026',
      fromTime: '11:10',
      toTime: '19:50',
      fromCity: 'Shanghai',
      toCity: 'Barcelona',
      duration: '15h 40min',
      stops: '1 cambiar',
    },
  },
  days: [
    {
      id: 'flight-1',
      dayLabel: '✈️',
      date: 'Vie 9',
      city: 'Barcelona → Pekín',
      plan: 'Vuelo BCN → Pekín',
      notes: ['Vuelo largo', 'Llegada día siguiente', 'Entry declaration en Alipay'],
      kind: 'flight',
      schedule: [
        { time: '07:00', activity: 'Llegada al aeropuerto + check-in' },
        { time: '09:30', activity: 'Embarque y vuelo internacional' },
        { time: 'Noche', activity: 'Vuelo y descanso en cabina' },
      ],
    },
    {
      id: 'day-1',
      dayLabel: '1',
      date: 'Sáb 10',
      city: 'Pekín',
      plan: 'Llegada + centro histórico',
      notes: ['Control de seguridad en Tian’anmen', 'Entrar por la Puerta Sur'],
      kind: 'city',
      schedule: [
        { time: '08:00–08:45', activity: 'Desayuno (ligero) en el hotel' },
        { time: '09:00–10:00', activity: 'Plaza de Tian’anmen (control de seguridad)' },
        { time: '10:00–13:00', activity: 'Ciudad Prohibida (entrar por Puerta Sur)' },
        { time: '13:00–14:00', activity: 'Almuerzo en Jingshan (local sencillo)' },
        { time: '14:00–15:00', activity: 'Colina del Carbón (mejor vista panorámica)' },
        { time: '15:15–16:45', activity: 'Parque Beihai (paseo tranquilo)' },
        { time: '17:30–18:30', activity: 'Descanso en hotel' },
        { time: '19:00–21:00', activity: 'Wangfujing nocturno (street food)' },
        { time: '21:30', activity: 'Regreso al hotel' },
      ],
    },
    {
      id: 'day-2',
      dayLabel: '2',
      date: 'Dom 11',
      city: 'Pekín',
      plan: 'Pekín histórico + hutongs',
      notes: ['WeChat Pay: pago/enlace con Wise'],
      kind: 'city',
      schedule: [
        { time: '08:00–08:45', activity: 'Desayuno' },
        { time: '09:00–11:30', activity: 'Templo del Cielo (ambiente local)' },
        { time: '12:00–13:30', activity: 'Almuerzo en Qianmen' },
        { time: '14:30–16:00', activity: 'Hutongs Nanluoguxiang + té' },
        { time: '16:30–17:30', activity: 'Torres Tambor y Campana' },
        { time: '19:00–20:30', activity: 'Cena en hutongs (pato laqueado opcional)' },
        { time: '21:00', activity: 'Regreso al hotel' },
      ],
    },
    {
      id: 'day-3',
      dayLabel: '3',
      date: 'Lun 12',
      city: 'Pekín',
      plan: 'Muralla China (Huanghuacheng Great Wall)',
      notes: ['Menos gente · ir temprano', 'Taxi privado o tour'],
      kind: 'city',
      schedule: [
        { time: '07:00–07:30', activity: 'Desayuno temprano' },
        { time: '07:30–09:30', activity: 'Traslado a Huanghuacheng' },
        { time: '09:30–13:00', activity: 'Muralla China (Huanghuacheng)' },
        { time: '13:00–14:00', activity: 'Almuerzo local' },
        { time: '14:00–16:30', activity: 'Regreso a Pekín (siesta recomendada)' },
        { time: '17:30–19:00', activity: 'Paseo suave o compras finales' },
        { time: '19:30', activity: 'Cena' },
      ],
    },
    {
      id: 'day-4',
      dayLabel: '4',
      date: 'Mar 13',
      city: "Pekín → Xi'an",
      plan: 'Llegada + centro histórico',
      notes: ['Taxi al hotel', 'Noodles biangbiang', 'Día tranquilo'],
      kind: 'travel',
      schedule: [
        { time: '12:00–14:00', activity: "Llegada a Xi’an (estación) + taxi al hotel" },
        { time: '14:00–15:00', activity: 'Check-in + almuerzo (biangbiang noodles)' },
        { time: '15:30–17:00', activity: "Muralla de Xi’an (paseo atardecer)" },
        { time: '17:30–18:30', activity: 'Torre del Tambor (subir arriba)' },
        { time: '18:30–19:30', activity: 'Torre de la Campana (muy cerca)' },
        { time: '19:30–21:30', activity: 'Barrio Musulmán nocturno (street food)' },
        { time: '22:00', activity: 'Regreso al hotel' },
      ],
    },
    {
      id: 'day-5',
      dayLabel: '5',
      date: 'Mié 14',
      city: "Xi'an",
      plan: 'Guerreros de Terracota',
      notes: ['Día clave', 'Taxi o tour'],
      kind: 'city',
      schedule: [
        { time: '07:30–08:00', activity: 'Desayuno temprano' },
        { time: '08:00–09:30', activity: 'Traslado a Terracota (Lintong)' },
        { time: '09:30–12:30', activity: 'Guerreros de Terracota (imprescindible)' },
        { time: '12:30–13:30', activity: 'Almuerzo local' },
        { time: '13:30–15:00', activity: 'Museo/Mausoleo Qin (opcional)' },
        { time: '15:00–16:30', activity: "Regreso a Xi’an" },
        { time: '17:00–18:30', activity: 'Descanso en hotel' },
        { time: '19:00–20:30', activity: 'Cena (dumplings)' },
        { time: '20:30–21:30', activity: 'Espectáculo Tang (recomendado)' },
      ],
    },
    {
      id: 'day-6',
      dayLabel: '6',
      date: 'Jue 15',
      city: "Xi'an",
      plan: 'Muralla + barrio musulmán',
      notes: ['Ideal al atardecer', 'Street food TOP'],
      kind: 'city',
      schedule: [
        { time: '08:00–08:45', activity: 'Desayuno' },
        { time: '09:00–11:00', activity: "Muralla de Xi’an (paseo)" },
        { time: '12:30–13:30', activity: 'Almuerzo en el centro' },
        { time: '17:00–19:30', activity: 'Barrio Musulmán (noche)' },
        { time: '20:00', activity: 'Regreso al hotel' },
      ],
    },
    {
      id: 'day-7',
      dayLabel: '7',
      date: 'Vie 16',
      city: "Xi'an → Chengdu",
      plan: 'Tren bala ~3h',
      notes: ['Llegada a mediodía', 'Taxi al hotel'],
      kind: 'travel',
      schedule: [
        { time: '08:30–09:30', activity: 'Check-out + traslado estación' },
        { time: '10:00–13:00', activity: 'Tren bala a Chengdu' },
        { time: '13:30–14:30', activity: 'Llegada + taxi al hotel' },
        { time: '15:00–16:00', activity: 'Check-in + almuerzo ligero' },
        { time: '17:00–19:00', activity: 'Paseo suave por el centro' },
        { time: '19:30', activity: 'Cena temprana' },
      ],
    },
    {
      id: 'day-8',
      dayLabel: '8',
      date: 'Sáb 17',
      city: 'Chengdu',
      plan: 'Pandas + parques',
      notes: ['Pandas muy temprano', 'Casas de té'],
      kind: 'city',
      schedule: [
        { time: '07:00–07:30', activity: 'Desayuno temprano' },
        { time: '07:30–08:30', activity: 'Traslado base pandas' },
        { time: '08:30–11:00', activity: 'Centro de Pandas (hora activa)' },
        { time: '11:00–12:30', activity: 'Regreso a la ciudad' },
        { time: '13:00–14:00', activity: 'Almuerzo (noodles Sichuan)' },
        { time: '14:30–16:30', activity: 'People’s Park + casas de té' },
        { time: '16:30–17:30', activity: 'Ritual de té tradicional' },
        { time: '18:30–20:00', activity: 'Cena en Kuanzhai' },
        { time: '20:30–21:30', activity: 'Ópera Sichuan (cambio de máscaras)' },
      ],
    },
    {
      id: 'day-9',
      dayLabel: '9',
      date: 'Dom 18',
      city: 'Chengdu',
      plan: 'Cultura + relax',
      notes: ['Ideal para bajar revoluciones'],
      kind: 'city',
      schedule: [
        { time: '08:30–09:15', activity: 'Desayuno tranquilo' },
        { time: '09:30–11:00', activity: 'Museo de Chengdu' },
        { time: '11:30–13:00', activity: 'Kuanzhai Alley (arquitectura)' },
        { time: '13:00–14:00', activity: 'Almuerzo en Kuanzhai' },
        { time: '15:00–17:00', activity: 'Compras / masaje' },
        { time: '17:30–18:30', activity: 'Preparar equipaje' },
        { time: '19:00', activity: 'Cena temprana' },
      ],
    },
    {
      id: 'day-10',
      dayLabel: '10',
      date: 'Lun 19',
      city: 'Chengdu',
      plan: 'Gastronomía · hotpot',
      notes: ['Street food + tour gastronómico'],
      kind: 'city',
      schedule: [
        { time: '09:30–11:00', activity: 'Mercado local y snacks' },
        { time: '11:30–12:30', activity: 'Café o pausa en parque' },
        { time: '13:00–14:00', activity: 'Almuerzo ligero' },
        { time: '16:30–18:00', activity: 'Tour gastronómico / cooking class' },
        { time: '19:30–21:00', activity: 'Cena hotpot (nivel de picante bajo)' },
      ],
    },
    {
      id: 'day-11',
      dayLabel: '11',
      date: 'Mar 20',
      city: 'Chengdu → Chongqing',
      plan: 'Tren ~1h30',
      notes: ['Amap (Gaode Maps)'],
      kind: 'travel',
      schedule: [
        { time: '09:00', activity: 'Salida a estación' },
        { time: '10:30', activity: 'Tren a Chongqing' },
        { time: '12:30', activity: 'Llegada + check-in' },
        { time: '19:00', activity: 'Cena' },
      ],
    },
    {
      id: 'day-12',
      dayLabel: '12',
      date: 'Mié 21',
      city: 'Chongqing',
      plan: 'Skyline nocturno',
      notes: ['Google Translate + Lens', 'Ciudad con muchos desniveles'],
      kind: 'city',
      schedule: [
        { time: '09:00–10:30', activity: 'Jiefangbei + paseo urbano' },
        { time: '10:45–11:30', activity: 'Estación Liziba (tren atravesando edificio)' },
        { time: '12:00–13:00', activity: 'Almuerzo local' },
        { time: '14:00–15:30', activity: 'Teleférico del Yangtze (vistas)' },
        { time: '16:00–18:00', activity: 'Hongyadong + miradores' },
        { time: '19:30–21:00', activity: 'Skyline nocturno en Chaotianmen + hotpot' },
      ],
    },
    {
      id: 'day-13',
      dayLabel: '13',
      date: 'Jue 22',
      city: 'Chongqing → Furong Ancient Town',
      plan: 'Llegar antes de las 14:00',
      notes: ['Pasaporte encima todo el rato'],
      kind: 'travel',
      schedule: [
        { time: '08:00–10:30', activity: 'Salida en tren/bus hacia Furong' },
        { time: '12:30–13:30', activity: 'Llegada + check-in' },
        { time: '16:00–18:00', activity: 'Paseo por el casco antiguo' },
        { time: '19:00–20:30', activity: 'Cena con vistas' },
      ],
    },
    {
      id: 'day-14',
      dayLabel: '14',
      date: 'Vie 23',
      city: 'Furong → Zhangjiajie',
      plan: 'Cascada nocturna + traslado',
      notes: ['Llegar a Wulingyuan si es posible'],
      kind: 'travel',
      schedule: [
        { time: '09:00–11:00', activity: 'Cascada de Furong (mejor luz)' },
        { time: '12:00–13:00', activity: 'Almuerzo' },
        { time: '15:00–16:00', activity: 'Tren a Zhangjiajie' },
        { time: '17:30–18:30', activity: 'Llegada + check-in en Wulingyuan' },
        { time: '19:00–20:30', activity: 'Cascada de Furong (noche) si hay tiempo' },
      ],
    },
    {
      id: 'day-15',
      dayLabel: '15',
      date: 'Sáb 24',
      city: 'Zhangjiajie',
      plan: 'Parque Nacional (Avatar)',
      notes: ['Entrar temprano', 'Ascensor Bailong'],
      kind: 'city',
      schedule: [
        { time: '06:30–07:00', activity: 'Desayuno muy temprano' },
        { time: '07:00–07:30', activity: 'Entrada al parque (Wulingyuan)' },
        { time: '07:30–09:30', activity: 'Ascensor Bailong → Yuanjiajie' },
        { time: '09:30–11:30', activity: 'Miradores Yuanjiajie (Avatar)' },
        { time: '11:30–12:30', activity: 'Almuerzo sencillo en parque' },
        { time: '12:30–14:30', activity: 'Tianzi Mountain' },
        { time: '14:30–16:00', activity: 'Teleférico de bajada' },
        { time: '17:00–18:30', activity: 'Descanso en hotel' },
        { time: '19:00–20:30', activity: 'Cena en Wulingyuan' },
      ],
    },
    {
      id: 'day-16',
      dayLabel: '16',
      date: 'Dom 25',
      city: 'Zhangjiajie',
      plan: 'Cascadas y senderos',
      notes: ['Golden Whip Stream', 'Plan B por niebla'],
      kind: 'city',
      schedule: [
        { time: '08:00–11:00', activity: 'Golden Whip Stream (paseo plano)' },
        { time: '11:30–13:00', activity: 'Almuerzo' },
        { time: '13:30–16:30', activity: 'Senderos y miradores' },
        { time: '17:30–18:30', activity: 'Descanso en hotel' },
        { time: '19:00–20:30', activity: 'Cena en Wulingyuan' },
      ],
    },
    {
      id: 'day-17',
      dayLabel: '17',
      date: 'Lun 26',
      city: 'Zhangjiajie',
      plan: 'Miradores y descanso',
      notes: ['Último día en parque'],
      kind: 'city',
      schedule: [
        { time: '08:00–09:00', activity: 'Desayuno' },
        { time: '09:30–12:00', activity: 'Miradores secundarios o paseo suave' },
        { time: '12:30–13:30', activity: 'Almuerzo' },
        { time: '15:00–17:00', activity: 'Descanso + preparar equipaje' },
        { time: '19:00', activity: 'Cena temprana' },
      ],
    },
    {
      id: 'day-18',
      dayLabel: '18',
      date: 'Mar 27',
      city: 'Zhangjiajie → Shanghái',
      plan: 'Vuelo corto',
      notes: [],
      kind: 'travel',
      schedule: [
        { time: '08:00–09:30', activity: 'Traslado al aeropuerto' },
        { time: '10:30–12:30', activity: 'Vuelo a Shanghái' },
        { time: '13:30–14:30', activity: 'Llegada + check-in' },
        { time: '19:00', activity: 'Cena con vistas' },
      ],
    },
    {
      id: 'day-19',
      dayLabel: '19',
      date: 'Mié 28',
      city: 'Shanghái',
      plan: 'Skyline + cultura + compras',
      notes: ['Bund temprano', 'Crucero al atardecer'],
      kind: 'city',
      schedule: [
        { time: '07:30–08:30', activity: 'Desayuno (hotel/café cercano)' },
        { time: '08:30–09:00', activity: 'Traslado al Bund' },
        { time: '09:00–10:30', activity: 'Paseo por el Bund' },
        { time: '10:30–11:00', activity: 'Traslado a Yuyuan Garden' },
        { time: '11:00–12:30', activity: 'Jardín Yuyuan + barrio antiguo' },
        { time: '12:30–13:30', activity: 'Almuerzo (Nanxiang Steamed Bun)' },
        { time: '13:30–14:00', activity: 'Traslado al Templo del Buda de Jade' },
        { time: '14:00–15:00', activity: 'Templo del Buda de Jade' },
        { time: '15:00–15:30', activity: 'Traslado a Lujiazui' },
        { time: '15:30–17:00', activity: 'Torre de Shanghái / Oriental Pearl' },
        { time: '17:00–17:30', activity: 'Paseo por Lujiazui' },
        { time: '17:30–18:00', activity: 'Traslado al río Huangpu' },
        { time: '18:00–19:00', activity: 'Crucero por el río Huangpu' },
        { time: '19:00–19:30', activity: 'Traslado a Nanjing Road' },
        { time: '19:30–21:00', activity: 'Paseo + compras en Nanjing Road' },
        { time: '21:00–21:30', activity: 'Regreso al hotel' },
        { time: '21:30–22:30', activity: 'Cena ligera' },
        { time: '22:30–23:30', activity: 'Preparar maletas + descanso' },
      ],
    },
    {
      id: 'day-20',
      dayLabel: '20',
      date: 'Jue 29',
      city: 'Shanghái',
      plan: 'Concesión francesa + barrios creativos',
      notes: ['Metro más rápido que taxi en hora punta'],
      kind: 'city',
      schedule: [
        { time: '08:30–09:30', activity: 'Desayuno tranquilo' },
        { time: '09:30–12:00', activity: 'Concesión francesa (paseo + cafés)' },
        { time: '12:30–13:30', activity: 'Almuerzo en Xintiandi' },
        { time: '14:00–15:30', activity: 'Tianzifang (galerías y tiendas)' },
        { time: '16:00–17:30', activity: 'Museo de Shanghái o cafés' },
        { time: '19:00–20:30', activity: 'Cena en la zona' },
      ],
    },
    {
      id: 'day-21',
      dayLabel: '21',
      date: 'Vie 30',
      city: 'Shanghái',
      plan: 'Día ligero + maletas',
      notes: ['Descanso antes del vuelo'],
      kind: 'city',
      schedule: [
        { time: '09:30–10:30', activity: 'Brunch ligero' },
        { time: '11:00–12:30', activity: 'Últimas compras / paseo suave' },
        { time: '13:00–14:00', activity: 'Almuerzo' },
        { time: '15:00–17:00', activity: 'Descanso + preparar maletas' },
        { time: '19:00', activity: 'Cena temprana' },
      ],
    },
    {
      id: 'flight-2',
      dayLabel: '✈️',
      date: 'Vie 31',
      city: 'Shanghái → Barcelona',
      plan: 'Vuelo Shanghái → BCN',
      notes: ['Llegada 19:50'],
      kind: 'flight',
      schedule: [
        { time: '08:00', activity: 'Check-out + traslado aeropuerto' },
        { time: '12:00', activity: 'Embarque y vuelo internacional' },
        { time: '19:50', activity: 'Llegada a BCN' },
      ],
    },
  ],
};
