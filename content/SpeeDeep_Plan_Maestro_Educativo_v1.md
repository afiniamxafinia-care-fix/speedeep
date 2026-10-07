# SpeeDeep · Plan maestro educativo y matriz de evidencias v1

**Fecha:** 6 de octubre de 2026 (America/Mazatlan)  
**Estado:** especificación pedagógica para producción; umbrales de dominio, equivalencia de textos y pesos de tareas pendientes de calibración con lectores reales.  
**Público:** jóvenes y adultos que ya leen en español.  
**Autoridad:** «SpeeDeep · Plan canónico de estudios v1» como referencia editorial de este proyecto, decisiones de QSD de «Revisa acceso a SpeeDeep» y la Ruta de ocho bloques y 32 misiones aprobada. Esta matriz precisa cómo se enseña y observa cada habilidad; no declara implementadas las funciones aún pendientes.

## 1. Resultado que promete el programa

El lector elige una forma de leer apropiada para su propósito, comprende y conserva lo importante de textos nuevos, ajusta el ritmo cuando conviene y usa la información. SpeeDeep no promete multiplicar la PPM manteniendo comprensión profunda en todo género. La aceleración se demuestra solo frente a lecturas comparables y con calidad suficiente; explorar y localizar son modos legítimamente más rápidos para tareas diferentes.

El circuito completo es **diagnóstico → ruta provisional → enseñanza explícita dentro de la tarea → práctica guiada → salida nueva sin ayuda → aplicación en textos → recuperación diferida → transferencia → ajuste de ruta**. Cada misión es una acción para el alumno, no una explicación sobre qué es la técnica.

## 2. Dos escalas que deben convivir

**Microhabilidad:** resultado observable de una lección, como `sentence_action` en 1.1 o `paragraph_main_idea` en 2.1. Cada misión produce un resultado local por microhabilidad, con el error concreto, grado de ayuda y versión del contenido. `Completada` significa que terminó la misión; `Dominada` exige evidencia posterior consistente en dos conjuntos inéditos y recuperación posterior. La salida inmediata por sí sola es provisional.

**Seis indicadores longitudinales:** velocidad de lectura, comprensión, identificación de ideas, atención funcional observada, retención y adaptación al propósito. Se agrupan en Q, S y D. No se debe traducir automáticamente una respuesta de oración en una puntuación estable de comprensión global. Una tarea puede aportar evidencia a varias escalas, siempre con rubricas separables; ningún ítem se duplica artificialmente para engordar la muestra.

| Componente | Definición acordada | Ventana mínima de evidencia antes de publicar una cifra estable |
|---|---|---|
| Q · Calidad | 70 % comprensión + 30 % identificación de ideas | Comprensión: últimas cinco lecturas válidas y al menos 20 preguntas; ideas: cinco textos distintos. |
| S · Velocidad | PPM ajustadas frente a línea base y meta del ciclo | Mediana de las últimas cinco lecturas válidas y comparables; registrar propósito, género, dificultad, extensión, versión y comprensión. |
| D · Profundidad | 25 % atención + 40 % retención + 35 % adaptación al propósito | Atención: segmentos y controles en cinco prácticas; retención: tres controles diferidos; adaptación: tres propósitos distintos. |
| QSD | 40 % Q + 30 % S + 30 % D | Mostrar como `insuficiente` hasta reunir todas las evidencias requeridas; después distinguir provisional de estable. |

Los mínimos anteriores son **gates de publicación del índice**, no metas que cada lección deba completar por sí misma. Cada lección declara una contribución local al menos a un indicador; solo las observaciones válidas y elegibles entran en la ventana longitudinal. Cuando falta evidencia, mostrar la habilidad observada y la evidencia pendiente, sin rellenar el QSD con ceros. La nota local y el QSD no son la misma cifra.

## 3. Contrato obligatorio de una misión

1. `lesson_code`, versión, bloque, orden, microhabilidad principal, prerrequisitos y misión en lenguaje de acción.
2. Ítems con identificador, versión, familia de variantes, género/dificultad si hay texto, respuestas protegidas y rubrica por habilidad y error. La misma respuesta puede tener evidencias distintas solo si las mide por separado.
3. **Intento inicial** para descubrir el error; **intervención** breve sobre ese error; práctica guiada con ayudas que se retiran; dos o más casos nuevos de salida sin ayuda, ajustables tras pilotaje.
4. Resultado local: primera respuesta sin ayuda, ayudas usadas, reintentos, aciertos por objetivo, errores específicos y grado de certeza. Una respuesta acertada después de una pista demuestra práctica asistida, no desempeño autónomo.
5. Repaso insertado después en otra misión y recuperación diferida; evaluación de transferencia en material nuevo y, cuando procede, en otro género. No reutilizar el mismo ítem como prueba de mejora.
6. Mapa de evidencia Q/S/D: indicador, rol (`enseñanza`, `práctica`, `comprobación`, `repaso`, `evaluación`, `laboratorio`), elegibilidad, ponderación versionada y razón de exclusión. La salida local existe incluso cuando aún no hay QSD estable.
7. Feedback y siguiente acción según error: continuar, apoyo puntual, reto de recuperación o reevaluación. El desbloqueo académico se basa en prerrequisitos demostrados; la pausa curiosa no bloquea.

**Convenciones de la matriz:** `Q:C` comprensión, `Q:I` identificación de ideas, `S:V` velocidad comparable, `D:A` atención funcional, `D:R` recuerdo diferido, `D:P` adaptación al propósito. Un código señala qué **resultado local** produce la lección; su elegibilidad para QSD requiere el gate de la sección 2. La PPM no se calcula con oraciones, destellos o la relectura del mismo pasaje. Las señales de atención provienen de controles específicos, nunca de pausa de pantalla por sí sola. `F` significa solo formación hasta comprobar con material nuevo.

## 4. Matriz curricular completa

La evidencia de salida es la que se obtiene **sin ayuda**. Los repasos se insertan en lecciones posteriores con casos nuevos; sus resultados no obligan a rehacer toda la lección original.

| Misión | Lo que el alumno hace para aprender | Salida nueva y error que identifica | Aporte local | Espiral y transferencia |
|---|---|---|---|---|
| **1.1 Acción central** | Separa acción principal de detalles previos, intercalados y negaciones; recibe corrección sobre el verbo elegido. | Dice quién hizo qué en dos oraciones inéditas; errores `detalle_por_accion`, `negacion`. | `Q:C` · `sentence_action` | Una oración integrada en párrafo de 2.1; luego instrucciones de 8.1. |
| **1.2 Grupos de sentido** | Reúne sujeto, acción y complemento; retira marcas visuales gradualmente. | Interpreta agente, acción y destinatario en oración sin separadores; `corte_de_grupo`. | `Q:C` · `sentence_grouping` | Referentes de 2.3 y continuidad de 5.2. |
| **1.3 Conectores** | Cambia un conector, compara conclusiones y explica el giro de sentido. | Distingue causa, contraste y concesión en frases nuevas; `relacion_invertida`. | `Q:C` · `sentence_connector` | Contrastes de 3.3 y una noticia de 8.3. |
| **1.4 Vocabulario contextual** | Infiera por pistas, distingue cuándo el contexto alcanza y cuándo consultar; retoma la frase. | Resuelve palabra nueva y significado global, o pide aclaración pertinente; `inferencia_sin_pista`. | `Q:C`, `D:P` · `lexical_repair` | 4.2 en texto real; 5.4 ante densidad léxica. |
| **1 · Integración** | Resuelve oraciones mezcladas con distractores sin marcas ni ayudas. | Dos conjuntos inéditos con acción, grupos, conectores y vocabulario; cada error queda etiquetado. | `Q:C`; `D:A` solo con control diseñado | Párrafo nuevo al iniciar 2.1 y género distinto después. |
| **2.1 Idea central** | Compara tema, ejemplo y proposición que cubre el párrafo. | Elige/formula la idea que explica el conjunto; `tema_por_idea`. | `Q:I`, `Q:C` · `paragraph_main_idea` | Resumen en 2.4 y argumento de 6.4. |
| **2.2 Idea y apoyo** | Clasifica razones, ejemplos y datos y justifica el vínculo. | Señala qué sustenta la idea y qué solo ilustra; `ejemplo_por_tesis`. | `Q:I`, `Q:C` · `paragraph_support` | Evidencia en 3.2 y 8.3. |
| **2.3 Referentes** | Une pronombres y expresiones con su antecedente, corrige una lectura equivocada. | Mantiene quién/qué cambió en párrafo nuevo; `referente_erroneo`. | `Q:C` · `paragraph_reference` | Reparación en 4.2 y documentos de 8.1. |
| **2.4 Esencia** | Reduce un párrafo a una frase fiel y compara lo omitido. | Síntesis que conserva mensaje sin detalle accesorio; `resumen_parcial`. | `Q:I`, `Q:C` · `paragraph_summary` | Explicar y recuperar en 7.1–7.3. |
| **2 · Integración** | Lee párrafos nuevos de dos géneros y selecciona idea, soporte y referentes. | Respuestas separadas por habilidad y texto; `apoyo_por_idea`. | `Q:I`, `Q:C` | Texto de varias partes en 3.1. |
| **3.1 Secuencia** | Ordena eventos y actualiza la información que cambia. | Reconstruye orden y estado vigente; `dato_obsoleto`. | `Q:C` · `text_sequence` | Instrucciones de 8.1 y recuerdo diferido en 7.4. |
| **3.2 Causas** | Encuentra pistas para distinguir causa de coincidencia. | Justifica una consecuencia con fragmento; `coincidencia_por_causa`. | `Q:C` · `text_causality` | Decisión de 8.2. |
| **3.3 Contrastes** | Confronta dos posturas y separa regla de excepción. | Describe semejanza/diferencia con evidencia; `excepcion_por_regla`. | `Q:C`, `Q:I` · `text_contrast` | Evaluación de 8.3. |
| **3.4 Inferencia** | Formula una conclusión y la vincula a pistas verificables. | Separa explícito, inferido y no respaldado; `inferencia_sin_evidencia`. | `Q:C` · `text_inference` | Transferencia a noticia o aviso de 8.3. |
| **3 · Integración** | Lee texto nuevo y resuelve secuencia, causa, contraste e inferencia. | Preguntas independientes con evidencia citada. | `Q:C`, `Q:I` si pregunta de idea | Material de otro género en 6 y 8. |
| **4.1 Notar la pérdida** | Marca dónde deja de entender y contrasta su juicio con un control de sentido. | Reconoce ruptura real y evita alarma falsa; `duda_no_detectada`. | `D:A`, `Q:C` · `monitor_break` | Control breve en próximas lecturas, sin inferir atención por tiempo. |
| **4.2 Reparar** | Elige relectura focalizada, aclaración, referente o continuar y prueba el resultado. | Corrige una interpretación con mínimo retroceso necesario; `reparacion_inadecuada`. | `D:A`, `Q:C`, `D:P` · `repair_choice` | Vocabulario de 1.4 y lectura densa de 5.4. |
| **4.3 Volver con propósito** | Busca un fragmento preciso y justifica el cambio de respuesta. | Localiza evidencia pertinente; `relectura_sin_objetivo`. | `D:A`, `D:P`, `Q:C` · `targeted_reread` | Búsqueda de 6.3 y revisión de 8.2. |
| **4.4 Recuperar foco** | Tras interrupción controlada, identifica última idea y próximo objetivo. | Reanuda en texto nuevo sin perder el hilo; `retoma_desorientada`. | `D:A`, `Q:C` · `focus_resume` | Aplicación natural en textos extensos; sin castigar interrupciones externas. |
| **4 · Integración** | Resuelve controles de sentido repartidos en un texto y elige reparaciones. | Detección, acción y comprensión después de reparar, por separado. | `D:A`, `Q:C`, `D:P` | Se repite con otro género y otra sesión. |
| **5.1 Ritmo útil** | Lee dos pasajes comparables a ritmos distintos, responde y contrasta el resultado. | Selecciona un ritmo con comprensión conservada; `acelera_y_pierde_sentido`. | `S:V`, `Q:C` · `useful_pace` | Otra lectura inédita comparable en ciclo posterior. |
| **5.2 Continuidad** | Practica continuidad entre frases en un pasaje conocido; aplica en otro nuevo. | PPM válida solo en el nuevo, con comprensión; `pausa_no_funcional`. | `S:V`, `Q:C` · `phrase_continuity` | Texto nuevo equivalente; la relectura queda como `F`. |
| **5.3 Releer con fin** | Hace una segunda lectura para aclarar algo específico y compara qué cambió. | Distingue mejora del texto repetido de transferencia en pasaje nuevo; `mejora_solo_memoria`. | `S:V` solo en transferencia, `Q:C` · `purposeful_reread` | Control posterior sin familiaridad con el texto. |
| **5.4 Ajuste de ritmo** | Alterna tramos densos y sencillos según una tarea explícita. | Cambia el ritmo manteniendo comprensión proporcional al propósito; `ritmo_rigido`. | `S:V`, `Q:C`, `D:P` · `pace_adaptation` | Propósitos y géneros de 6.1–6.4. |
| **5 · Integración** | Lee pasajes inéditos comparables con una misma misión y monitorea calidad. | Mediana posterior y respuestas de comprensión; no contar un único pico. | `S:V`, `Q:C`, `D:A` si hay controles | Repetir evaluación comparable en ciclo siguiente. |
| **6.1 Pregunta previa** | Formula qué necesita saber y qué evidencia bastaría. | Define propósito antes de texto nuevo y reconoce si se cumplió; `objetivo_vago`. | `D:P`, `Q:C` · `question_first` | Mismo género con otra misión después. |
| **6.2 Explorar** | Revisa títulos y estructura, predice relevancia y declara límites. | Decide si vale leer a fondo sin fingir conocimiento de detalles; `exploracion_por_comprension`. | `D:P`, `Q:I` cuando identifica estructura · `preview` | Contrasta luego con lectura a fondo. PPM de exploración no se mezcla con S de lectura profunda. |
| **6.3 Localizar** | Busca un dato y verifica su condición, fecha o actualización. | Encuentra el dato vigente en documento nuevo; `dato_fuera_de_contexto`. | `D:P`, `Q:C` · `locate` | Trámite e instrucciones de 8.1; tiempo de búsqueda separado. |
| **6.4 Leer a fondo** | Contrasta afirmación, soporte y límite para una conclusión. | Justifica con evidencia sin saltar condiciones; `conclusion_excesiva`. | `D:P`, `Q:C`, `Q:I` · `deep_read` | Noticia distinta en 8.3. |
| **6 · Integración** | Recibe tres misiones y elige explorar, localizar o leer a fondo. | Tres propósitos explícitos y precisión por modo; no fusionar sus velocidades. | `D:P`, `Q:C`, `S:V` solo dentro de modos comparables | Elección autónoma en 8.4. |
| **7.1 Recuperar sin mirar** | Reconstruye idea y datos y compara con el texto al terminar. | Recuperación inmediata fiel, sin copiar; `recuerdo_de_detalle_sin_idea`. | `Q:I`, `D:R` solo en control diferido · `free_recall` | Pregunta posterior sobre contenido y texto nuevos en sesiones futuras. |
| **7.2 Organizar** | Dibuja/elige estructura de causa, secuencia o contraste. | Esquema fiel de texto nuevo; `estructura_incorrecta`. | `Q:I`, `Q:C`, `D:R` si se revisita después · `organize` | Explicación en 7.3 y decisión en 8.2. |
| **7.3 Explicar** | Cuenta una idea para una audiencia concreta y recibe feedback sobre fidelidad. | Explicación pertinente sin inventar hechos; `detalle_irrelevante`. | `Q:C`, `D:P`, `D:R` si diferido · `explain` | Audiencia y género distintos en 8.4. |
| **7.4 Recordar después** | Vuelve tras horas o días, intenta sin texto y usa pista solo si falla. | Idea y dato recuperados en fecha posterior; `olvido_idea`, `olvido_dato`. | `D:R`, `Q:I` si se puntúa aparte · `delayed_recall` | Nuevos controles diferidos sobre otras lecturas. |
| **7 · Integración** | Lee, organiza y vuelve para recuperar sin apoyo. | Registra inmediato y diferido por separado en material nuevo. | `D:R`, `Q:I`, `Q:C` | Aplicación de información en 8.2. |
| **8.1 Instrucciones** | Sigue condiciones y orden de un documento práctico. | Decide pasos correctos y excepción aplicable; `paso_omitido`. | `Q:C`, `D:P`, `D:A` si hay control | Otro formato: aviso, manual o trámite. |
| **8.2 Decisiones** | Compara alternativas con restricciones y consecuencias. | Elige y justifica con datos relevantes; `dato_ignorado`. | `Q:C`, `Q:I`, `D:P`, `D:R` si diferido | Nueva decisión con otras opciones. |
| **8.3 Afirmaciones** | Separa hecho, opinión, evidencia y duda en noticia/argumento. | Conclusión proporcionada a las fuentes; `certeza_excesiva`. | `Q:C`, `Q:I`, `D:P` | Otro género y postura contraria. |
| **8.4 Misión propia** | Define propósito, elige modo, lee y resuelve una tarea auténtica. | Justifica elección, comprensión, recuerdo posterior y uso en género nuevo. | `Q:C`, `Q:I`, `S:V` si comparable, `D:A`, `D:R`, `D:P` | Evaluación longitudinal por ciclos, sin graduación por una sola sesión. |

**Cobertura:** Q recibe evidencia de los bloques 1–3 y vuelve a aparecer en 4–8; S se enseña explícitamente en 5 y se observa solo donde hay pasajes comparables; D:A se enseña en 4, D:P en 6 y D:R en 7, con controles distribuidos antes y después. Así cada habilidad tiene enseñanza, salida y transferencia; la distribución longitudinal cumple los mínimos sin fingir que cada lección mide seis cosas.

## 5. Diagnóstico y colocación de Prácticas

El diagnóstico académico actual de **dos textos y diez respuestas** es una orientación provisional de sentido de oración, idea, causa, inferencia y dato explícito. No tiene banco ni repeticiones suficientes para certificar QSD, clubes, PPM o el nivel de destellos. Ya recomienda un rango inicial de lecturas y una categoría según los errores observados; esas sugerencias todavía requieren ajuste longitudinal. Se amplía con lecturas inéditas comparables y recuerdo posterior para recomendar entrada adelantada cuando exista evidencia suficiente.

Al terminar el diagnóstico, se crea un **perfil inicial por familia de práctica**. Las dificultades de comprensión orientan qué categorías recomendar, no el tiempo de exposición visual. En el piloto de Cifras fugaces ya se ofrece una ronda de ocho destellos al escalón cómodo: con 7/8 o más inicia provisionalmente un escalón arriba; en otro caso permanece en el inicial. El resultado cuenta como primera ronda de Prácticas. Cada familia futura, como palabras, necesitará una calibración propia y bancos controlados. El alumno puede repetir un destello si el dispositivo demoró o estuvo oculto, sin penalización.

Después, las rondas de ocho ajustan **por familia**: dos seguidas de al menos 7/8 suben un grado; una de 3/8 o menos, o dos seguidas de 5/8 o menos, bajan uno; una longitud nueva recupera exposición cómoda. La familia de cifras ya usa una escalera 3–8 dígitos y tres pasos de exposición por longitud; palabras y letras transpuestas requieren bancos y escalas propias. El origen Ruta o Prácticas suma al **mismo perfil de esa familia**. Nada de `optional_lab` altera QSD, nivel académico, PPM de lectura o los once clubes.

Se muestran **dos métricas de velocidad** claramente separadas: `ritmo de práctica` para lecturas libres/entrenamiento, y `S del QSD` solo para primeras lecturas válidas de pasajes inéditos, comparables por modo, género, dificultad y longitud, con comprensión suficiente. Una práctica puede alimentar S únicamente si fue diseñada y registrada desde el inicio como evaluación elegible, sin ayudas y con controles de calidad; etiquetar retrospectivamente una sesión libre no la convierte en prueba. Las cifras fugaces muestran longitud, exposición en milisegundos y precisión, nunca PPM de lectura. Las estimaciones visuales no deben anunciarse en microsegundos.

## 6. Natural Spiral y estados visibles

`En curso` (círculo turquesa) → `Completada` (✓ turquesa) → `Dominada` (hito lima) tras demostración consistente y recuperación posterior. `Repaso dirigido` (lavanda) aparece solo cuando la evidencia de una **microhabilidad identificada** lo justifica; `Próximamente/bloqueada` conserva explicación neutral. Coral sirve para feedback y aviso concreto, no para etiquetar al lector. Color y símbolo van siempre acompañados de texto accesible.

El detector compara ventanas de tareas **válidas, equivalentes, nuevas y de la misma habilidad**; requiere más de una señal independiente y comprueba confianza, dificultad, modo, ayudas y tiempo desde la última práctica. Un solo fallo, fatiga, ausencia de datos o caída del QSD global no activan repaso. Los umbrales numéricos de caída se calibrarán con datos reales y se versionarán; el sistema no debe presentar un descenso provisional como pérdida de dominio.

Si la caída persiste, insertar en la siguiente misión un reto corto con variante nueva del error preciso; después evaluar otra variante sin ayuda y programar una comprobación posterior. Si la recuperación funciona, continuar sin rehacer la lección. Si vuelve a fallar, abrir la sección pertinente de la lección previa con pistas progresivas; la repetición completa queda como opción cuando la dificultad es amplia. En velocidad, revisar primero comparabilidad y comprensión antes de recomendar fluidez. El alumno ve «Practiquemos [acción concreta]» y por qué apareció, no una etiqueta de fracaso.

## 7. Contrato de datos y puertas de calidad para implementar

El sistema ya tiene `curriculum_lessons/cases/attempts/responses`, `diagnostic_*`, `practice_sessions/responses/segments`, `assessment_cycles`, `skill_score_snapshots` y `flash_profiles/rounds`. Faltan vínculos explícitos de **microhabilidad + indicador QSD + rol de intento + equivalencia de material** para cada salida, un registro de recomendaciones y repasos, y una política reproducible de elegibilidad. Antes de modificar tablas, probar el contrato con 1.1–1.4 y un control de párrafo.

| Registro mínimo | Por qué se necesita |
|---|---|
| `user_id`, `lesson_code`, `content_version`, `micro_skill_code`, `indicator_code` | Atribución trazable; una lección no vuelve a contar bajo otra versión sin revisión. |
| `item_id`, `variant_family`, `article_id/version`, `genre`, `difficulty`, `purpose`, `mode` | Evitar medir dos veces el mismo material y comparar tareas incompatibles. |
| `attempt_role`, `first_unassisted_score`, `max_points`, `help_used`, `error_code`, `response_time`, `validity_reason` | Separar enseñanza, reintento y evidencia autónoma; invalidar fallos técnicos. |
| `source_attempt_id`, `assessment_stage`, `due_at`, `completed_at` | Vincular recuperación diferida a la lectura original sin confundirla con recuerdo inmediato. |
| `formula_version`, `confidence_state`, `window_ids`, `baseline`, `target` | Poder reconstruir QSD y explicar cuándo faltó evidencia o se ajustó una fórmula. |

**Orden de ejecución:** (1) fijar rúbricas y etiquetas de 1.1–1.4 con banco A/B más un tercer conjunto de transferencia y control diferido; (2) separar resultado local de elegibilidad QSD; (3) ampliar diagnóstico y calibrar cada familia de Prácticas; (4) producir bloques 2–8 según esta matriz, con pasajes inéditos comparables; (5) activar QSD y Natural Spiral solo después de comprobar ventanas, sesgos de dificultad y acciones de recuperación con usuarios reales. Mantener la pausa curiosa ya operativa entre 1.1 y 1.2 como opcional, compartida con Prácticas.

## 8. Fundamento y límites de la evidencia

El diseño usa instrucción explícita, práctica guiada con feedback y aplicación independiente, junto con evaluación de comprensión y recuperación diferida. La evidencia sobre lectura muestra compromiso entre velocidad y comprensión; la recuperación ayuda al recuerdo, pero la transferencia exige comprobar la habilidad en ejemplos nuevos. Las guías citadas trabajan principalmente con estudiantes escolares: la adaptación para adultos hispanohablantes y los umbrales propios de SpeeDeep requieren pilotaje, no se presentan como resultados científicos ya probados de la app.

- Rayner et al. (2016), *So Much to Read, So Little Time*: https://pubmed.ncbi.nlm.nih.gov/26769745/
- IES What Works Clearinghouse, *Improving Adolescent Literacy*: https://ies.ed.gov/ncee/wwc/practiceguide/8
- IES What Works Clearinghouse, *Providing Reading Interventions for Students in Grades 4–9*: https://ies.ed.gov/ncee/wwc/PracticeGuide/29
- Pan y Rickard (2018), revisión de transferencia de aprendizaje con recuperación: https://pubmed.ncbi.nlm.nih.gov/29733621/
