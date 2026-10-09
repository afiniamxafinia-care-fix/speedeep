# Observaciones de prueba y trabajo local pendiente

Estado: prueba de la persona usuaria terminada; auditoría técnica iniciada. No aplicar migraciones ni publicar estos cambios antes de cerrar la revisión de contenido, progresión y experiencia móvil.

## Hallazgos comunicados el 8 de octubre de 2026

1. En 1.3 un mismo pasaje aparece hasta cuatro veces, una vez por pregunta. En el banco activo de 1.3 v2, cada variante de 3.1–3.4 comparte el pasaje de los pasos 1–4; los pasos 5–6 comparten otro. El cierre 3.C agrupa de forma similar. Se verificó en `20261008070000_speedeep_level_1_3_v2.sql`.
2. Aprobar 2.C abre 3.1 antes de completar la lectura integradora de 1.2. Tanto la Ruta como `private.begin_curriculum_lesson` conceden acceso con la comprobación, mientras Home recomienda la lectura integradora. La secuencia solicitada es lecciones → comprobación → lectura integradora → siguiente subnivel.
3. La animación del indicador de ppm se recorta en la parte superior de su SVG.
4. Falta una tarjeta QSD visible con resumen y desglose por Q, S y D; cada subnivel debe mostrar qué habilidades desarrolla.

## Preparación local

- Se reservó espacio superior en el SVG del indicador y se añadieron etiquetas de habilidades por subnivel.
- Se preparó una tarjeta QSD desplegable. Q muestra el porcentaje de comprensión solo cuando la referencia del panel tiene evidencia suficiente; S muestra ppm comparables sin fingir una puntuación S; D aparece pendiente hasta tener una medición de propósito. El porcentaje de la cabecera es **cobertura de medición**, nunca nota académica ni certificación.
- La Ruta queda preparada para abrir el siguiente subnivel cuando exista una lectura integradora completada además de la comprobación. El acceso real en base de datos sigue pendiente de una migración que se revisará en la auditoría; estos cambios no deben publicarse solos.

## Diseño pendiente para preguntas de un mismo texto

Mostrar una sola vez el pasaje y, debajo, la lista de sus preguntas en orden. Conservar los seis registros, la primera respuesta, la retroalimentación individual, los reintentos y las dos transferencias de texto nuevo. La API debe entregar solo las preguntas y opciones del **grupo consecutivo que comparte pasaje** dentro del intento autenticado; jamás enviar las claves. Guardar cada respuesta en el orden actual para preservar la puntuación. Tras responder las preguntas 1–4, cambiar al texto nuevo para 5–6 y desplazar el panel al inicio.

Antes de implementar, decidir durante la auditoría si un resultado insuficiente de comprensión permite avanzar al siguiente subnivel tras completar la lectura, o si requiere una nueva lectura inédita. No usar la misma lectura repetida como evidencia nueva de ppm o certificación.

## Cierre de auditoría pendiente

- Recibir las observaciones de la persona usuaria al terminar 1.3 y 1.4.
- Validar contenido, claves, variantes, puntuaciones, progresión y lecturas integradoras para 1.1–1.4.
- Alinear el bloqueo de la interfaz y `private.begin_curriculum_lesson` con el criterio aprobado; contemplar usuarios que ya habían avanzado antes del cambio.
- Probar en móvil los grupos de preguntas, la animación de ppm, el desplegable QSD y los estados de lectura fallida o repetida.
- Publicar solo después del cierre de la auditoría.

## Resultados adicionales del recorrido completo

- Las cuatro comprobaciones 1.C–4.C se terminaron en la cuenta de prueba; las cuatro lecturas integradoras publicadas tienen seis preguntas y 330–353 palabras, dentro de la serie comparable. Sin embargo, la lectura 1.1 no registra ninguna finalización y ya hay completaciones en 1.2, 1.3 y 1.4: evidencia directa de que la comprobación podía saltarse la lectura. El cambio de regla debe respetar los avances históricos y no bloquear retroactivamente a quien ya cruzó de nivel.
- Las veinte unidades de lección/cierre 1.1–1.4 tienen tres variantes con seis casos, clave y rúbrica por caso. Las doce variantes de cierre cubren las habilidades exigidas y no muestran índices de respuesta fuera de rango. Esto valida integridad estructural, **no** exactitud pedagógica de todas las respuestas o umbrales.
- Prácticas tiene solo tres ejercicios publicados en cada categoría no lectora (12 en total). Los intentos con origen Ruta incluyen varias rondas en la misma pausa; la función `begin_training` no limita intentos por `route_level` + `route_after`. La pantalla vuelve a ofrecer pestañas y catálogo aunque la categoría ya se eligió.

## Propuesta de Prácticas para revisión

- Una pausa curiosa de Ruta abre directamente **un solo reto** de la categoría sugerida, elegido entre ejercicios vigentes y priorizando los no vistos. La pausa queda completada al enviar ese reto; nuevas rondas de esa categoría se hacen desde Prácticas, sin alterar las notas de la Ruta ni los ppm.
- El control de una sola ronda debe estar también en la base de datos, con transacción y bloqueo por usuario + pausa, no solo deshabilitando un botón en pantalla. Los intentos previos cuentan como pausa completada, pero se conserva el historial.
- En el Laboratorio, tocar una categoría abre un ejercicio automáticamente. Al terminar puede ofrecerse otro reto variable de la misma categoría; no se muestra el catálogo completo ni se obliga a elegir la categoría dos veces.
- Ampliar el banco de tres a por lo menos seis por categoría, con casos genuinamente diferentes, retroalimentación y clave revisada. La aleatorización debe reducir repeticiones recientes, no prometer novedad cuando ya se agotó el banco.
