# 🚀 Wireframes - Botón Liquidar Deuda (Estilo Splitwise)

## 📋 Objetivo
Botón simple y directo para liquidar deudas entre personas, similar a Splitwise. Al hacer clic, muestra un modal/diálogo con las opciones de liquidación disponibles.

---

## 📱 Wireframe Mobile

```
┌─────────────────────────────────────┐
│ 💸 Balance Total                    │
│ +150.00 EUR                         │
│ ┌─────────────┬─────────────┐      │
│ │ Debes       │ Te deben    │      │
│ │ 50.00 EUR   │ 200.00 EUR  │      │
│ └─────────────┴─────────────┘      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💳 Liquidar Deudas                  │
└─────────────────────────────────────┘
     ↓ (Al hacer clic)

┌─────────────────────────────────────┐
│ 💳 Liquidar Deuda            [✕]   │
├─────────────────────────────────────┤
│                                     │
│ Selecciona a quién pagarle:         │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [AP] Ana Pérez                  ││
│ │      Le debes 45.00€            ││
│ │                    [Liquidar]   ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [CM] Carlos Martínez            ││
│ │      Le debes 30.00€            ││
│ │                    [Liquidar]   ││
│ └─────────────────────────────────┘│
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ O recibe pagos de:                  │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [LG] Laura García               ││
│ │      Te debe 25.00€             ││
│ │                 [Registrar]     ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

## 💻 Wireframe Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ 💸 Balance Total: +150.00 EUR                                │
│ ┌──────────────────┬──────────────────┐                     │
│ │ Debes 50.00 EUR  │ Te deben 200 EUR │                     │
│ └──────────────────┴──────────────────┘                     │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 💳 Liquidar Deudas                                     │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

        ↓ (Al hacer clic, modal centrado)

┌────────────────────────────────────────────────────┐
│ 💳 Liquidar Deuda                         [✕]     │
├────────────────────────────────────────────────────┤
│                                                    │
│ 💰 Personas a las que les debes:                  │
│                                                    │
│ ┌────────────────────────────────────────────────┐│
│ │ [AP] Ana Pérez                                 ││
│ │      Debes: 45.00€                            ││
│ │      ┌──────────────────┐  ┌───────────────┐ ││
│ │      │ Liquidar todo ✓  │  │ Parcial...    │ ││
│ │      └──────────────────┘  └───────────────┘ ││
│ └────────────────────────────────────────────────┘│
│                                                    │
│ ┌────────────────────────────────────────────────┐│
│ │ [CM] Carlos Martínez                           ││
│ │      Debes: 30.00€                            ││
│ │      ┌──────────────────┐  ┌───────────────┐ ││
│ │      │ Liquidar todo ✓  │  │ Parcial...    │ ││
│ │      └──────────────────┘  └───────────────┘ ││
│ └────────────────────────────────────────────────┘│
│                                                    │
│ ────────────────────────────────────────────────  │
│                                                    │
│ 📥 Personas que te deben:                         │
│                                                    │
│ ┌────────────────────────────────────────────────┐│
│ │ [LG] Laura García                              ││
│ │      Te debe: 25.00€                          ││
│ │      ┌─────────────────────────────┐          ││
│ │      │ Marcar como recibido ✓      │          ││
│ │      └─────────────────────────────┘          ││
│ └────────────────────────────────────────────────┘│
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🎯 Características Principales

### **1. Botón Principal**
```tsx
┌──────────────────────────────┐
│ 💳 Liquidar Deudas           │
└──────────────────────────────┘
```

**Ubicación:** Justo después del `HeroBalance`

**Estilos:**
- Ancho completo en móvil
- Color: Primary con gradiente suave
- Icono: 💳 (CreditCard)
- Tamaño: Grande y visible

### **2. Modal de Liquidación**

#### **Sección: "Personas a las que les debes"**
- Lista de personas con balance positivo (acreedores)
- Muestra avatar + nombre + cantidad adeudada
- Dos opciones por persona:
  - **"Liquidar todo ✓"**: Registra pago del monto completo
  - **"Parcial..."**: Abre input para monto personalizado

#### **Sección: "Personas que te deben"**
- Lista de personas con balance negativo (deudores)
- Muestra avatar + nombre + cantidad que te deben
- Una opción:
  - **"Marcar como recibido ✓"**: Registra que recibiste el pago

### **3. Flujo de "Liquidar todo"**

```
Usuario hace clic en "Liquidar todo ✓"
              ↓
    Modal de confirmación:
    "¿Liquidar 45.00€ con Ana Pérez?"
              ↓
    [Confirmar]  [Cancelar]
              ↓
    Registra el pago
              ↓
    Toast: "✅ Deuda liquidada con Ana Pérez"
              ↓
    Modal se cierra automáticamente
    Balances se actualizan
```

### **4. Flujo de "Pago Parcial"**

```
Usuario hace clic en "Parcial..."
              ↓
    Muestra input inline:
    ┌────────────────────────────┐
    │ Cantidad: [___] EUR        │
    │ (Máx: 45.00€)              │
    │ [Registrar] [Cancelar]     │
    └────────────────────────────┘
              ↓
    Usuario ingresa monto
              ↓
    [Registrar] → Valida ≤ deuda total
              ↓
    Registra el pago
              ↓
    Toast: "✅ Pagados 20.00€ a Ana Pérez"
```

---

## 🎨 Estilos y Diseño

### **Botón Principal**
```tsx
className="w-full rounded-xl bg-gradient-to-r from-primary/95 to-primary p-4 text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
```

### **Modal**
```tsx
// Overlay
className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"

// Content
className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl"
```

### **Card de Persona (Deudor)**
```tsx
className="rounded-xl border border-border bg-gradient-to-br from-red-50 to-red-100/50 p-4 dark:from-red-950/20 dark:to-red-900/10"
```

### **Card de Persona (Acreedor)**
```tsx
className="rounded-xl border border-border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 dark:from-emerald-950/20 dark:to-emerald-900/10"
```

### **Botones de Acción**
```tsx
// Liquidar todo
className="bg-primary text-white hover:bg-primary/90"

// Parcial
className="border border-border bg-background hover:bg-muted"

// Marcar como recibido
className="bg-emerald-600 text-white hover:bg-emerald-700"
```

---

## 🔄 Estados Interactivos

### **1. Liquidación en Proceso**
```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Liquidando...
</Button>
```

### **2. Lista Vacía (Sin deudas)**
```tsx
┌────────────────────────────────┐
│ ✅ ¡No tienes deudas!          │
│                                │
│ Tu balance está equilibrado    │
└────────────────────────────────┘
```

### **3. Solo Acreedores o Solo Deudores**
- Si solo debes: Muestra solo sección de deudas
- Si solo te deben: Muestra solo sección de cobros

---

## 📊 Ventajas vs Panel de Pago Rápido

| Característica | Panel Pago Rápido | Liquidar Deuda |
|----------------|-------------------|----------------|
| **Clics para liquidar** | 4-5 clics | 2 clics | ✅ |
| **Selección de persona** | Manual | Lista filtrada | ✅ |
| **Cantidad sugerida** | No | Sí (automática) | ✅ |
| **Casos de uso** | Pagos generales | Liquidar deudas | ✅ |
| **Claridad visual** | Formulario | Lista de personas | ✅ |
| **Móvil-friendly** | Aceptable | Excelente | ✅ |

---

## 🚀 Componentes a Crear

1. **`SettleDebtsButton.tsx`** - Botón principal
2. **`SettleDebtsDialog.tsx`** - Modal con lista de personas
3. **`DebtCard.tsx`** - Card individual de persona con botones

---

## 💡 UX Insights

### **Flujo tipo Splitwise:**
1. Ver balance en HeroBalance
2. Clic en "Liquidar Deudas"
3. Ver lista clara de personas
4. Clic en "Liquidar todo" junto a la persona
5. Confirmación rápida
6. ✅ ¡Listo!

**Total: 3 clics para liquidar una deuda completa** 🚀

### **Mensajes de Confirmación:**
```
"¿Confirmar pago de 45.00€ a Ana Pérez?"
- Esto salda tu deuda con Ana.
[Sí, liquidar]  [Cancelar]
```

### **Feedback Visual:**
- Animación de check ✓ al liquidar
- Card se desvanece con fade-out
- Si no quedan más deudas → Mensaje de celebración 🎉
