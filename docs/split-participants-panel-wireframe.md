# Wireframe Panel Participantes (Split)

## Objetivo
Hacer el bloque de participantes más claro, visual y rápido de usar.

## Estructura

```text
+-------------------------------------------------------------+
| [icon] Participantes del gasto              [Todos] [Pagador]|
| Solo los seleccionados participan en el reparto.            |
|                                                             |
| +-------------------+  +-------------------+  +-----------+ |
| | [A] Ana      [✓]  |  | [J] Juan          |  | [M] Marta | |
| | Participa          |  | No participa      |  | Participa | |
| +-------------------+  +-------------------+  +-----------+ |
|                                                             |
| [3 seleccionados] [Reparto igual entre seleccionados]       |
+-------------------------------------------------------------+
```

## Comportamiento
- Click en tarjeta: alterna participa/no participa.
- `Todos`: selecciona todos.
- `Pagador`: selecciona solo el pagador.
- Si no hay ningún participante seleccionado: error de validación.
- En modo `Igual`, mostrar resumen "Reparto igual entre X personas".

## Estilo
- Fondo `bg-card`, borde `border-border`, radio `rounded-2xl`.
- Estados:
  - seleccionado: `border-primary`, `bg-primary/5`, check visible.
  - no seleccionado: `bg-background`, hover `bg-muted/40`.
- Tipografía semántica: `text-foreground`, `text-muted-foreground`.
