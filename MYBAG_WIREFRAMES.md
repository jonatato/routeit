# Wireframes: Rediseño de "Mi Maleta"

## 📱 Análisis de la Pantalla Actual

### Problemas identificados:
1. **Separación de checklist y catálogo**: El usuario debe hacer scroll entre su checklist y los items disponibles
2. **Filtros ocupan mucho espacio**: Los botones de categorías toman una línea completa
3. **Falta contexto visual**: No hay indicadores de progreso claros ni visualización por categorías
4. **UX poco optimizada para móvil**: Layout vertical consume mucho scroll
5. **Sin drag & drop**: No hay forma intuitiva de reorganizar items
6. **Sin categorización visual**: Los items del checklist están en una lista plana

---

## 🎨 Propuesta de Rediseño

### **Concepto Principal**: "Maleta Visual Inteligente"
- Vista de maleta dividida por categorías (como compartimentos reales)
- Drag & drop para añadir/organizar items
- Indicadores de progreso por categoría
- Vista compacta con expansión opcional
- Quick actions flotantes

---

## 📐 Wireframe 1: Vista Principal (Móvil)

```
┌─────────────────────────────────────────┐
│  ← Mi Maleta                    ⋮  🔍  │ ← Header sticky
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📊 Progreso Total              │   │
│  │  ████████░░░░  65% (13/20)      │   │ ← Card de progreso global
│  │  ✓ 13 completados  ⚪ 7 faltan  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🎒 Esenciales      ████░░  80%  ▼│ │ ← Categoría expandible
│  ├───────────────────────────────────┤ │
│  │ ☑ Pasaporte            [Documentos]│ │
│  │ ☑ Tarjeta crédito      [Documentos]│ │
│  │ ☐ Cargador móvil       [Electrónica]│
│  │ ☐ Powerbank           [Electrónica]│ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 👕 Ropa          ██░░░░  40%   ▼│ │
│  ├───────────────────────────────────┤ │
│  │ ☑ Camisetas (3)        [Ropa]    │ │
│  │ ☐ Pantalones (2)       [Ropa]    │ │
│  │ ☐ Zapatos cómodos      [Calzado] │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 💊 Salud         ░░░░░░  0%    ▼│ │
│  ├───────────────────────────────────┤ │
│  │   (Vacía - Añade items)           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🔌 Electrónica   ███░░░  60%   ▼│ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
        ┌───┐
        │ + │ ← Botón flotante para añadir
        └───┘
```

### Características:
- **Progreso visual por categoría**: Barra de progreso en cada categoría
- **Categorías colapsables**: Expandir/contraer para gestionar espacio
- **Items con tags inline**: Cada item muestra su categoría secundaria
- **Checklist integrado**: Todo en una sola vista, sin scroll entre secciones

---

## 📐 Wireframe 2: Modal "Añadir Items" (Móvil)

```
┌─────────────────────────────────────────┐
│  Añadir Items                      ✕    │
├─────────────────────────────────────────┤
│  🔍 Buscar items...                     │ ← Búsqueda sticky
├─────────────────────────────────────────┤
│  [Todas] [📄Docs] [👕Ropa] [💊Salud]  │ ← Chips de filtro
├─────────────────────────────────────────┤
│                                         │
│  Recomendados para tu viaje  💡        │
│  ┌─────────────────────────────────┐   │
│  │ 🔌 Adaptador universal    [+]   │   │ ← Items sugeridos
│  │    Electrónica • Internacional  │   │   con contexto
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🧴 Protector solar SPF50  [+]   │   │
│  │    Salud • Playa              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────── Todos los items ───────       │
│                                         │
│  📄 Documentos                          │
│  ┌─────────────────────────────────┐   │
│  │ ✓ Pasaporte              [✓]    │   │ ← Ya añadido
│  │ 💳 Tarjeta crédito        [+]   │   │
│  │ 🎫 Reservas de hotel     [+]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  👕 Ropa                                │
│  ┌─────────────────────────────────┐   │
│  │ 👔 Camisetas             [+]   │   │
│  │ 👖 Pantalones            [+]   │   │
│  │ 🧦 Calcetines            [+]   │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Características:
- **Modal fullscreen en móvil**: Experiencia inmersiva
- **Recomendaciones contextuales**: Basadas en destino/clima del itinerario
- **Items agrupados por categoría**: Navegación más intuitiva
- **Estado visual claro**: Checkmark para items ya añadidos
- **Quick add**: Botón [+] para añadir sin confirmación

---

## 📐 Wireframe 3: Vista Desktop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Mi Maleta                                                    🔍  👤  🔔  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  Mi Checklist                │  │  Añadir Items                     │   │
│  │                              │  │                                   │   │
│  │  Progreso: 65% ████████░░░░  │  │  🔍 Buscar items...              │   │
│  │  13 de 20 items completados  │  │  [Todas] [📄] [👕] [💊] [🔌]    │   │
│  │                              │  │                                   │   │
│  │  ┌────────────────────────┐ │  │  💡 Recomendados               │   │
│  │  │ 🎒 Esenciales  80% ▼  │ │  │  ┌──────────────────────────┐  │   │
│  │  ├────────────────────────┤ │  │  │ 🔌 Adaptador      [+]   │  │   │
│  │  │ ☑ Pasaporte           │ │  │  │ 🧴 Protector solar [+]   │  │   │
│  │  │ ☑ Tarjeta crédito     │ │  │  └──────────────────────────┘  │   │
│  │  │ ☐ Cargador móvil      │ │  │                                   │   │
│  │  └────────────────────────┘ │  │  📄 Documentos                   │   │
│  │                              │  │  ┌──────────────────────────┐  │   │
│  │  ┌────────────────────────┐ │  │  │ ✓ Pasaporte      [✓]    │  │   │
│  │  │ 👕 Ropa       40%  ▼  │ │  │  │ 💳 Tarjeta        [+]    │  │   │
│  │  ├────────────────────────┤ │  │  │ 🎫 Reservas      [+]    │  │   │
│  │  │ ☑ Camisetas           │ │  │  └──────────────────────────┘  │   │
│  │  │ ☐ Pantalones          │ │  │                                   │   │
│  │  └────────────────────────┘ │  │  👕 Ropa                        │   │
│  │                              │  │  ┌──────────────────────────┐  │   │
│  │  ┌────────────────────────┐ │  │  │ 👔 Camisetas     [+]    │  │   │
│  │  │ 💊 Salud      0%   ▼  │ │  │  │ 👖 Pantalones    [+]    │  │   │
│  │  └────────────────────────┘ │  │  └──────────────────────────┘  │   │
│  │                              │  │                                   │   │
│  └──────────────────────────────┘  └──────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Características:
- **Layout de 2 columnas**: Checklist a la izquierda, catálogo a la derecha
- **Sin modales**: Todo visible simultáneamente
- **Drag & drop entre columnas**: Arrastrar items del catálogo al checklist
- **Sincronización en tiempo real**: Cambios se reflejan instantáneamente

---

## 📐 Wireframe 4: Vista Compacta / Lista

```
┌─────────────────────────────────────────┐
│  Mi Maleta    [🎨 Vista] [📊]      +    │ ← Controles de vista
├─────────────────────────────────────────┤
│  Progreso: ████████░░  65%              │
│  13/20 completados                      │
├─────────────────────────────────────────┤
│  🔍 Filtrar por categoría...            │
├─────────────────────────────────────────┤
│                                         │
│  ☑ 🛂 Pasaporte           [Docs] [×]   │ ← Modo lista simple
│  ☑ 💳 Tarjeta crédito     [Docs] [×]   │   con swipe actions
│  ☐ 🔌 Cargador móvil     [Electr] [×]   │
│  ☐ 🔋 Powerbank         [Electr] [×]   │
│  ☑ 👔 Camisetas (3)       [Ropa] [×]   │
│  ☐ 👖 Pantalones (2)      [Ropa] [×]   │
│  ☐ 👟 Zapatos cómodos   [Calzado] [×]   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ + Añadir item personalizado      │ │ ← Quick add manual
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Características:
- **Vista minimalista**: Lista plana sin categorías expandidas
- **Filtrado rápido**: Search box siempre visible
- **Swipe actions en móvil**: Deslizar para eliminar
- **Quick add en línea**: Añadir items sin modal

---

## 📐 Wireframe 5: Estadísticas y Compartir

```
┌─────────────────────────────────────────┐
│  Mi Maleta              [Compartir] ✕   │
├─────────────────────────────────────────┤
│                                         │
│  📊 Resumen de tu Maleta                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        Progreso General         │   │
│  │                                 │   │
│  │    ████████░░░░░░░░  65%        │   │
│  │                                 │   │
│  │    13 completados               │   │
│  │     7 pendientes                │   │
│  │    20 total                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Por Categoría:                         │
│  ┌─────────────────────────────────┐   │
│  │ 🎒 Esenciales       ████░░  80% │   │
│  │ 👕 Ropa            ██░░░░  40% │   │
│  │ 🔌 Electrónica     ███░░░  60% │   │
│  │ 💊 Salud           ░░░░░░   0% │   │
│  │ 🎒 Accesorios      ██░░░░  50% │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Peso estimado: ~8 kg                   │
│  Volumen: Cabina ✓                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📤 Compartir Checklist          │   │
│  │                                 │   │
│  │ [📋 Copiar lista]               │   │
│  │ [✉️ Enviar por email]           │   │
│  │ [🔗 Generar enlace]             │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Características:
- **Estadísticas visuales**: Gráficos de progreso por categoría
- **Estimaciones útiles**: Peso y volumen de equipaje
- **Funciones de compartir**: Enviar checklist a compañeros de viaje
- **Export**: Copiar como texto plano o PDF

---

## 🎯 Funcionalidades Clave del Rediseño

### 1. **Organización por Categorías**
```typescript
const categories = [
  { id: 'essentials', name: 'Esenciales', icon: '🎒', color: '#9b87f5' },
  { id: 'clothing', name: 'Ropa', icon: '👕', color: '#7dd3fc' },
  { id: 'electronics', name: 'Electrónica', icon: '🔌', color: '#fbbf24' },
  { id: 'health', name: 'Salud', icon: '💊', color: '#fb923c' },
  { id: 'accessories', name: 'Accesorios', icon: '🎒', color: '#a78bfa' },
  { id: 'documents', name: 'Documentos', icon: '📄', color: '#60a5fa' },
];
```

### 2. **Sistema de Progreso**
- Progreso global: % de items completados vs total
- Progreso por categoría: Visualización individual
- Indicadores de completitud: Colores y badges

### 3. **Quick Actions**
- **Swipe left**: Marcar como completado
- **Swipe right**: Eliminar
- **Long press**: Ver detalles o editar
- **Tap**: Toggle check

### 4. **Smart Suggestions**
- Basadas en destino del itinerario
- Clima y época del año
- Duración del viaje
- Actividades planificadas

### 5. **Modos de Vista**
- **Vista por categorías** (default): Organizado en compartimentos
- **Vista lista**: Todo en una lista plana
- **Vista compacta**: Solo nombres, sin detalles

### 6. **Personalización**
- Añadir items custom
- Editar nombres y cantidades
- Crear categorías personalizadas
- Reordenar items (drag & drop)

---

## 📱 Interacciones Móvil

### Gestos:
- **Tap en categoría**: Expandir/contraer
- **Tap en item**: Toggle checkbox
- **Long press en item**: Menú de opciones (editar/eliminar/mover)
- **Swipe left**: Completar
- **Swipe right**: Eliminar
- **Pull to refresh**: Recargar desde servidor

### Botones flotantes:
- **[+]**: Añadir items desde catálogo
- **[📊]**: Ver estadísticas
- **[📤]**: Compartir checklist

---

## 🎨 Paleta de Colores

```css
/* Por categoría */
--category-essentials: #9b87f5;    /* Lavanda */
--category-clothing: #7dd3fc;      /* Azul cielo */
--category-electronics: #fbbf24;   /* Amarillo */
--category-health: #fb923c;        /* Naranja */
--category-accessories: #a78bfa;   /* Púrpura */
--category-documents: #60a5fa;     /* Azul */

/* Estados */
--checked: #22c55e;    /* Verde */
--unchecked: #e5e7eb;  /* Gris claro */
--progress-bg: #f3f4f6;
--progress-fill: var(--primary);
```

---

## 🚀 Animaciones y Transiciones

### Micro-interacciones:
1. **Check/Uncheck**: Animación de escala + color
2. **Añadir item**: Slide-in desde el botón [+]
3. **Eliminar item**: Fade-out + slide-left
4. **Expandir categoría**: Smooth height transition
5. **Progreso**: Animación de barra de progreso
6. **Swipe actions**: Reveal de botones con spring

### Transiciones:
```css
.category-expand {
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-check {
  animation: checkBounce 0.4s ease-out;
}

@keyframes checkBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

---

## 📊 Arquitectura de Componentes

```
<MyBagPage>
  ├─ <ProgressCard />
  ├─ <CategorySection>
  │   ├─ <CategoryHeader />
  │   ├─ <ProgressBar />
  │   └─ <ChecklistItem> (múltiples)
  │       ├─ <Checkbox />
  │       ├─ <ItemIcon />
  │       ├─ <ItemName />
  │       ├─ <ItemTags />
  │       └─ <ItemActions />
  ├─ <FloatingAddButton />
  └─ <AddItemsModal>
      ├─ <SearchBar />
      ├─ <FilterChips />
      ├─ <SuggestedItems />
      └─ <CategoryItemList>
          └─ <AvailableItem> (múltiples)
```

---

## 💡 Resumen de Mejoras

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Organización** | Lista plana | Categorías visuales |
| **Progreso** | Solo contador | Barras + porcentajes |
| **Navegación** | Scroll largo | Categorías colapsables |
| **Añadir items** | Scroll al catálogo | Modal flotante |
| **Visual feedback** | Básico | Animaciones + colores |
| **Mobile UX** | Click básico | Gestures + quick actions |
| **Context aware** | No | Sugerencias inteligentes |
| **Compartir** | No disponible | Export + share links |

---

## 🎯 Próximos Pasos

1. ✅ Wireframes completados
2. ⏭️ Implementar componentes base
3. ⏭️ Añadir sistema de categorías
4. ⏭️ Implementar gestures y animaciones
5. ⏭️ Integrar con backend (Supabase)
6. ⏭️ Testing en dispositivos móviles
7. ⏭️ Pulir animaciones y micro-interacciones

---

**Fecha**: 28 de enero de 2026  
**Versión**: 1.0  
**Estado**: Wireframes completos - Listo para implementación
