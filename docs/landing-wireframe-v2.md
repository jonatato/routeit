# Landing Wireframe V2 (moderna + intuitiva)

Objetivo: mejorar claridad de valor, reducir ruido en primer scroll y mantener la hoja de estilos actual (`--surface-*`, `--primary`, `--border`, `--radius`).

## 1) Estructura propuesta (desktop)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                                       │
│ Logo Routeit | Producto | Como funciona | Precios | Entrar | CTA Empezar    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HERO (split 60/40)                                                           │
│ [Izquierda]                                                                  │
│  - Badge: "Planifica. Comparte. Viaja sin caos"                             │
│  - H1: Propuesta clara de valor                                              │
│  - Subtexto corto (1-2 lineas)                                               │
│  - CTA primaria + CTA secundaria                                             │
│  - Micro-prueba social (usuarios/equipos/itinerarios)                       │
│                                                                              │
│ [Derecha]                                                                    │
│  - Mock app panel-surface                                                    │
│  - Vista hoy + checklist + alerta                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TRUST STRIP                                                                  │
│ "Usado para viajes en equipo y personales" + metricas compactas             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ FEATURES (3 cards clave)                                                     │
│ 1. Itinerario vivo   2. Checklist inteligente   3. Colaboracion en tiempo real│
│ Cada card: icono, titulo, descripcion, mini bullet de resultado              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW IT WORKS (timeline horizontal 3 pasos)                                   │
│ Crear viaje -> Ajustar por dias -> Compartir y recibir avisos                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ USE CASE BLOCK (2 columnas)                                                  │
│ [Antes] caos con notas dispersas  | [Despues] Routeit centraliza todo        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ PRICING TEASER                                                               │
│ Free vs Pro (resumen de 3 puntos) + CTA Ver planes                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ FINAL CTA                                                                    │
│ "Empieza gratis hoy" + botones Entrar / Ver planes                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 2) Estructura propuesta (mobile)

```text
[Navbar compacta: Logo + Entrar + menu]
[Hero: H1 + subtexto + CTAs]
[Mock panel]
[Trust strip scroll-x]
[Features stack (1 columna)]
[How it works (pasos verticales)]
[Use case comparativo]
[Pricing teaser]
[Final CTA sticky en zona inferior del bloque]
```

Regla mobile: cada bloque debe responder a una sola pregunta del usuario.

## 3) Jerarquia UX (que debe entender en 8 segundos)

1. Que hace Routeit.
2. Para quien es (viajero solo o equipo).
3. Que resultado concreto obtiene (menos olvidos, mejor coordinacion).
4. Cual es el siguiente paso (CTA principal).

## 4) Sistema visual alineado con la app

- Fondo: `page-shell` o gradiente suave sobre `--surface-1/2`.
- Superficies: usar `panel-surface` para cards protagonistas.
- Bordes: `border-border`.
- Radios: `rounded-2xl` / `rounded-3xl` (consistentes con `--radius`).
- Color de accion: `primary` para CTA principal.
- Tipografia:
  - H1: `text-4xl md:text-5xl font-semibold`
  - Secciones: `text-2xl font-semibold`
  - Cuerpo: `text-sm md:text-base text-mutedForeground`
- Densidad: mas espacio vertical entre bloques, menos texto por card.

## 5) Componentes reutilizables sugeridos

- `LandingNav`
- `LandingHero`
- `LandingTrustStrip`
- `LandingFeatureGrid`
- `LandingHowItWorks`
- `LandingUseCase`
- `LandingPricingTeaser`
- `LandingFinalCta`

Esto permite mantener `src/pages/Landing.tsx` como ensamblador limpio.

## 6) Copy sugerido (borrador)

- H1: `Tu viaje organizado en un solo lugar.`
- Sub: `Plan diario, checklist y colaboracion en tiempo real para no olvidar nada.`
- CTA primaria: `Crear mi itinerario`
- CTA secundaria: `Ver planes`

## 7) Checklist de implementacion

- Reordenar landing segun el wireframe (sin cambiar paleta base).
- Reducir de 8+ bloques a 6 bloques fuertes.
- Unificar estilos de cards con `panel-surface`.
- Limitar parrafos a maximo 2 lineas en desktop.
- Asegurar contraste AA en textos secundarios.
- Validar mobile en 360px y 390px.
- Medir Core Web Vitals despues del cambio.

## 8) Exito esperado

- Menos rebote en landing.
- Mas clic en CTA principal.
- Mejor comprension de propuesta de valor en primer scroll.
