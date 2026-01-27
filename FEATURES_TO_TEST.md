# Lista de Nuevas Features para Probar

## 🎨 Prioridad Alta - Funcionalidades Principales

### 1. Exportación a PDF Funcional
- **Ubicación**: Botón "Exportar PDF" en la vista de itinerario
- **Qué probar**:
  - Hacer clic en el botón de exportar
  - Seleccionar qué secciones incluir (overview, itinerary, map, budget, etc.)
  - Elegir formato (A4 o Letter)
  - Elegir orientación (vertical u horizontal)
  - Verificar que el PDF se genera correctamente con todas las secciones seleccionadas

### 2. Notificaciones en Tiempo Real
- **Ubicación**: Campanita en el header (arriba a la derecha)
- **Qué probar**:
  - Hacer clic en la campanita para abrir el dropdown
  - Verificar que muestra notificaciones cuando hay cambios en itinerarios compartidos
  - Verificar que muestra notificaciones de cambios en Splitwise
  - Marcar notificaciones como leídas
  - Marcar todas como leídas
  - Verificar el contador de notificaciones no leídas

### 3. Modo Oscuro Funcional
- **Ubicación**: Perfil → Preferencias → Tema
- **Qué probar**:
  - Cambiar entre "Sistema", "Claro" y "Oscuro"
  - Verificar que el tema se aplica inmediatamente
  - Recargar la página y verificar que el tema se mantiene
  - Verificar que todos los componentes se ven bien en modo oscuro

## 📊 Prioridad Media - Mejoras de UX/UI

### 4. Sistema de Toasts (Notificaciones Visuales)
- **Ubicación**: Aparecen en la parte inferior de la pantalla
- **Qué probar**:
  - Realizar acciones que generen toasts (guardar, eliminar, etc.)
  - Verificar que los toasts aparecen con el estilo correcto
  - Verificar que desaparecen automáticamente después de unos segundos

### 5. Componentes Skeleton (Estados de Carga)
- **Ubicación**: Aparecen mientras se cargan datos
- **Qué probar**:
  - Navegar entre páginas y verificar que aparecen skeletons mientras cargan
  - Verificar que tienen animación de pulso
  - Verificar que se reemplazan correctamente cuando cargan los datos

### 6. Animaciones con Framer Motion
- **Ubicación**: Transiciones entre páginas y componentes
- **Qué probar**:
  - Navegar entre páginas y verificar animaciones suaves
  - Verificar micro-interacciones en botones y cards

### 7. Internacionalización (i18n)
- **Ubicación**: Perfil → Preferencias → Idioma
- **Qué probar**:
  - Cambiar entre Español, English, Français, Deutsch
  - Verificar que los textos cambian correctamente
  - Verificar que las fechas y números se formatean según el idioma

### 8. Sincronización Offline
- **Ubicación**: Indicador en la parte inferior cuando no hay conexión
- **Qué probar**:
  - Desconectar internet (modo avión)
  - Realizar cambios en la aplicación
  - Verificar que aparece el indicador "Sin conexión"
  - Reconectar internet
  - Verificar que los cambios se sincronizan automáticamente
  - Verificar que aparece "Sincronizando cambios..." mientras sincroniza

## 💰 Funcionalidades Splitwise

### 9. Gráficos de Gastos
- **Ubicación**: Split → Pestaña "Reportes"
- **Qué probar**:
  - Verificar gráfico de pastel de gastos por categoría
  - Verificar gráfico de barras de gastos mensuales
  - Verificar que los tooltips muestran valores correctos

### 10. Exportación PDF de Reportes Splitwise
- **Ubicación**: Split → Pestaña "Reportes" → Botón "Exportar PDF"
- **Qué probar**:
  - Hacer clic en "Exportar PDF"
  - Verificar que el PDF contiene:
    - Resumen general (total gastado, número de gastos, promedio)
    - Gastos por miembro
    - Gastos por categoría
    - Gastos recientes

### 11. Recordatorios de Pago
- **Ubicación**: Split → Pestaña "Overview"
- **Qué probar**:
  - Verificar que aparecen recordatorios de pagos pendientes
  - Verificar que se muestran notificaciones push para recordatorios
  - Verificar que los recordatorios tienen fecha y cantidad

## 📈 Analytics y Estadísticas

### 12. Dashboard de Analytics
- **Ubicación**: `/app/analytics` (añadir enlace en el menú si es necesario)
- **Qué probar**:
  - Verificar tarjetas de estadísticas (itinerarios creados, actualizados, gastos, pagos, PDFs exportados)
  - Verificar gráfico de actividad de los últimos 30 días
  - Verificar lista de eventos recientes
  - Verificar que los datos se actualizan correctamente

## ⚡ Mejoras de Rendimiento

### 13. Code Splitting y Lazy Loading
- **Ubicación**: Navegación entre páginas
- **Qué probar**:
  - Abrir DevTools → Network
  - Navegar entre páginas
  - Verificar que los chunks se cargan bajo demanda
  - Verificar que hay skeletons mientras cargan los componentes

### 14. Optimización de Imágenes
- **Ubicación**: Todas las imágenes de la aplicación
- **Qué probar**:
  - Verificar que las imágenes se cargan correctamente
  - Verificar lazy loading en imágenes grandes

## 🔔 Push Notifications

### 15. Notificaciones Push
- **Ubicación**: Service Worker registrado automáticamente
- **Qué probar**:
  - Verificar que se solicita permiso de notificaciones al iniciar sesión
  - Verificar que se reciben notificaciones cuando hay cambios
  - Verificar que las notificaciones muestran el icono del panda
  - Hacer clic en una notificación y verificar que abre la aplicación

## 📱 Mejoras de Navegación Móvil

### 16. Menú Móvil Mejorado
- **Ubicación**: Barra inferior en móvil
- **Qué probar**:
  - Verificar que el botón central (Itinerario) es más grande y redondo
  - Verificar que el menú tiene sombra y borde visible
  - Verificar que el botón central está centrado
  - Verificar que el estado activo se muestra correctamente
  - Verificar que el icono de perfil está en el menú inferior

## 🎯 Checklist de Pruebas Rápidas

- [ ] Exportar un itinerario a PDF con diferentes configuraciones
- [ ] Hacer clic en la campanita y verificar el dropdown de notificaciones
- [ ] Cambiar el tema a oscuro y verificar que todo se ve bien
- [ ] Cambiar el idioma y verificar traducciones
- [ ] Desconectar internet y verificar el indicador offline
- [ ] Ver los gráficos en Split → Reportes
- [ ] Exportar un reporte de Splitwise a PDF
- [ ] Ver el dashboard de Analytics
- [ ] Navegar entre páginas y verificar lazy loading
- [ ] Verificar que las notificaciones push funcionan
