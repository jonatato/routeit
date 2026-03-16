# Wireframe — PDF Cuadernillo de Recuerdo

## Objetivo
Definir el layout imprimible del modo **Cuadernillo de recuerdo** para exportación PDF.

## Estructura general (A4 vertical recomendado)

```text
┌──────────────────────────────────────────────┐
│ PORTADA                                      │
│  - Título del viaje                          │
│  - Rango de fechas                           │
│  - Intro breve                               │
│  - Ruta resumen                              │
│  - Meta chips (días, ciudades, fecha export) │
│  - Índice de secciones seleccionadas         │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ BLOQUES DE CONTENIDO                         │
│  [Vuelos] [Resumen] [Itinerario] [Mapa]      │
│  [Listas] [Presupuesto] [Frases]             │
│  - Secciones activables según checkbox       │
│  - Estilo papel / editorial                  │
│  - Tarjetas con bordes cálidos               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ CIERRE DEL CUADERNILLO                       │
│  - “Notas del recuerdo”                      │
│  - Momentos destacados (auto)                │
│  - Checklist post-viaje                      │
└──────────────────────────────────────────────┘
```

## Wireframe por página

### Página 1 — Portada + Índice
```text
┌──────────────────────────────────────────────┐
│ [Kicker: Cuadernillo de recuerdo]            │
│ TÍTULO VIAJE                                 │
│ Fechas                                       │
│ Intro                                        │
│                                              │
│ [Ruta] ciudad • ciudad • ciudad              │
│ [chips: 8 días] [4 ciudades] [01/03/2026]    │
├──────────────────────────────────────────────┤
│ Índice del cuadernillo                       │
│ 1. Vuelos                                    │
│ 2. Itinerario                                │
│ 3. Listas útiles                             │
│ ...                                          │
└──────────────────────────────────────────────┘
```

### Páginas intermedias — Contenido
```text
┌──────────────────────────────────────────────┐
│ Título sección                               │
│ Subtítulo                                    │
│                                              │
│ [Card] ...                                   │
│ [Card] ...                                   │
│ [Card] ...                                   │
└──────────────────────────────────────────────┘
```

### Última página — Recuerdo final
```text
┌──────────────────────────────────────────────┐
│ Notas del recuerdo                           │
│ Texto guía para apuntes                      │
│                                              │
│ [Momentos destacados]      [Checklist final] │
│ - ...                       - ...            │
│ - ...                       - ...            │
└──────────────────────────────────────────────┘
```

## Tokens visuales del cuadernillo
- Fondo cálido tipo papel.
- Tarjetas con borde suave y esquinas redondeadas.
- Acento editorial (bordes laterales en días del itinerario).
- Tipografía legible para impresión.
- Saltos de página controlados en portada/cierre y secciones extensas.

## Implementación aplicada
- Selector en diálogo: `Exportación normal` / `Cuadernillo de recuerdo`.
- Nuevo flag en opciones: `visualStyle`.
- Modo cuadernillo añade portada, índice y página de cierre.
- Mantiene selección de secciones existentes.
- Nombre del archivo en cuadernillo: `*_cuadernillo_YYYY-MM-DD.pdf`.
