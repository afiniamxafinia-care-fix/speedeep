# Speedeep

Entrenamiento de lectura rápida con comprensión. La primera entrega establece el tablero de inicio como prototipo navegable y el modelo de datos independiente de Speedeep.

## Desarrollo local

```bash
npm install
npm run dev
```

## Estado

- Tablero visual con evolución, práctica guiada, Live, Club de los 300 ppm, referidos y prueba gratuita.
- Los perfiles, métricas y contadores sociales de la pantalla son datos de demostración; no se guardan todavía.
- El esquema inicial de Supabase está en `supabase/migrations/20261006000000_speedeep_initial_schema.sql`.
- Stripe, autenticación y persistencia de sesiones quedan pendientes de integración en la siguiente etapa.
