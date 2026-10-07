# Speedeep

Entrenamiento de lectura rápida con comprensión. La experiencia inicial está diseñada primero para móvil e incluye práctica guiada, métricas de lectura, hitos progresivos y felicitaciones sociales en Arena.

## Desarrollo local

```bash
npm install
npm run dev
```

Configura `.env.local` con estas variables:

```bash
SUPABASE_URL=https://wisfyiydkmfbfghnaxfm.supabase.co
SUPABASE_ANON_KEY=<publishable-key>
```

Después ejecuta `npm run dev`.

No uses la clave `service_role` en la app. La autenticación acepta enlaces mágicos y códigos de un solo uso por correo. En Supabase Auth, configura Site URL y Redirect URLs con `https://speedeep.vercel.app`. Verifica el proveedor de correo y sus límites de envío antes del lanzamiento público.

## Flujo de medición

- La práctica carga una lectura publicada y preguntas activas desde Supabase.
- El inicio se ancla en una marca de tiempo creada por la base de datos. Las respuestas correctas permanecen en el esquema privado; Supabase califica y guarda cada intento.
- El cronómetro mide el tiempo de lectura visible, separado de las preguntas. Una sesión dura al menos 10 segundos.
- El resumen de comprensión utiliza el primer intento válido de cada versión de texto. El ritmo utiliza lecturas de evaluación de al menos 300 palabras, con comprensión mínima de 70% y tres preguntas o más; una relectura se guarda para entrenamiento pero no multiplica evidencia. Por ahora se muestran PPM crudas, sin ajustes de dificultad no calibrados.
- QSD permanece como `insufficient` hasta que exista evidencia para las seis habilidades; no se muestra una calificación inventada.

Las siete migraciones locales constan en el historial de producción. `20261006081024` agrega el inicio seguro y guardado de prácticas. `20261006084218` añade el catálogo y el contenido v2. No vuelvas a ejecutar migraciones aplicadas.

## Contenido v2

- Ocho lecturas publicadas: dos breves originales y seis nuevas de 355 a 413 palabras, con cinco preguntas cada una. Los casos profesionales se identifican como ficticios cuando corresponde.
- Doce ejercicios en cuatro formatos: idea principal (opción única), secuencias (tocar tarjetas en orden), búsqueda de datos (consulta visible) y relevancia (selección múltiple).
- Biblioteca móvil disponible desde Prácticas y desde las cuatro tarjetas de habilidad en Home. Cada usuario puede elegir una lectura concreta.
- Calificación en funciones protegidas de Supabase: los clientes no reciben claves antes de enviar y no pueden escribir puntuaciones directamente.
- Secuencias: porcentaje de posiciones correctas. Relevancia: 100 × max(0, aciertos − selecciones incorrectas) / elementos esperados. Opción única: 100 o 0. Todos son resultados de un ejercicio; no acreditan una habilidad ni alimentan QSD automáticamente.
- Los retos se guardan en `training_attempts`, separados de las sesiones cronometradas. Después de enviar se muestra la solución y una explicación.
- Fuente editorial con claves: `content/practice-pack-v2.json`. Es material administrativo, no se envía al navegador. `scripts/build-practice-seed.py` construye la migración revisable para la versión inicial, no debe ejecutarse contra una base donde ya se aplicó.

## Estado de publicación

- Primera versión desplegada en producción: https://speedeep.vercel.app. Vercel tiene configuradas SUPABASE_URL y SUPABASE_ANON_KEY con una clave publicable.
- Build y comprobación de TypeScript pasan; ESLint pasa con una advertencia sobre la imagen de perfil. Se fijó ESLint 9.39.1 para compatibilidad con el plugin React incluido en Next.
- Se probó inicio, calificación, guardado y rechazo de reenvíos en una transacción revertida, sin conservar usuarios ni resultados de prueba. Las rutas publicadas responden y la verificación de un código inválido llega a Supabase.
- Site URL y Redirect URLs están configuradas a https://speedeep.vercel.app. La cuenta de prueba indicada por el propietario confirmó acceso y cuatro sesiones guardadas; SMTP personalizado queda pendiente por decisión del propietario.
- Arena, felicitaciones, edición persistente del perfil y el cálculo completo de QSD todavía no están conectados al flujo real.
- Stripe y pagos siguen pendientes.
