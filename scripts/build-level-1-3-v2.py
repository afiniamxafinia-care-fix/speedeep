"""Build versioned 1.3 curriculum SQL from reviewed, explicit case specifications."""
import json
from pathlib import Path

# Each passage is a separate, unseen text for either training or transfer.
# Facts are used to generate evidence-specific questions; a fact cannot be inferred from another passage.
sequence = [
 ({'p':'''La biblioteca cerraba antes de que terminaran muchas jornadas de trabajo. Primero registró solicitudes de acceso vespertino durante marzo, sin cambiar aún sus horarios.

En abril abrió solo los jueves por la tarde como prueba. El cartel de esa etapa decía que el martes seguía cerrado. El personal contó visitas y préstamos durante cuatro semanas.

Al comprobar que el servicio se utilizaba, añadió los martes desde mayo. El horario actual incluye martes y jueves por la tarde; el cartel de la prueba fue retirado.''','first':'Registró solicitudes vespertinas','middle':'Abrió solo los jueves','last':'Añadió los martes','old':'El cartel que excluía los martes','current':'Abre martes y jueves por la tarde'},
  {'p':'''El sendero del parque fue cerrado por suelo inestable. Primero el municipio colocó un aviso y prohibió el paso mientras revisaba el terreno.

Después reforzó el camino con grava y abrió únicamente la mitad. Una foto de esa semana muestra una cinta que detiene a los visitantes a mitad del recorrido.

La última inspección confirmó que el refuerzo resistía. Desde el lunes se recorre todo el sendero; la fotografía de la apertura parcial ya no describe la situación vigente.''','first':'Cerró el sendero','middle':'Abrió la mitad después del refuerzo','last':'Autorizó el recorrido completo','old':'La fotografía con una cinta a mitad del camino','current':'Se recorre todo el sendero'}),
 ({'p':'''El centro de salud entregaba fichas por orden de llegada. Primero detectó largas esperas y anotó que algunos pacientes se marchaban antes de recibir una consulta.

Luego permitió reservar por teléfono las consultas de la mañana. El aviso inicial decía que las citas vespertinas seguirían sin reserva durante la prueba.

Tras dos semanas añadió también la tarde. Hoy todos los turnos pueden reservarse por teléfono o en ventanilla; el aviso que excluía la tarde corresponde a una etapa anterior.''','first':'Detectó largas esperas con fichas','middle':'Reservó solo consultas matutinas','last':'Extendió la reserva a la tarde','old':'El aviso que excluía la tarde','current':'Todos los turnos pueden reservarse'},
  {'p':'''La escuela reunía hojas usadas en una sola caja. Primero una maestra propuso separar las que aún tenían una cara en blanco.

El grupo instaló bandejas y permitió usarlas solo a quinto grado durante una semana. El folleto de prueba indicaba que los otros alumnos debían esperar.

Al comprobar que había suficientes hojas, la escuela abrió las bandejas a todos los grados. Hoy cualquier grupo puede usarlas; la restricción del folleto quedó atrás.''','first':'Reunía hojas usadas en una caja','middle':'Probó bandejas solo para quinto grado','last':'Abrió las bandejas a todos los grados','old':'El folleto que limitaba el uso a quinto grado','current':'Todos los grados pueden usar las hojas'}),
 ({'p':'''El mercado recibía mercancía por la misma entrada que usaban sus clientes. Primero registró varios cruces peligrosos durante las descargas de junio.

Como prueba reservó la entrada norte para proveedores los lunes. El plano de esa etapa desviaba a los compradores hacia el acceso sur ese día.

En agosto construyó un paso de servicio y trasladó allí todas las entregas. Ahora las dos entradas principales son para compradores; el plano de junio dejó de reflejar el recorrido actual.''','first':'Registró cruces durante las descargas','middle':'Reservó la entrada norte los lunes','last':'Trasladó entregas al paso de servicio','old':'El plano que reservaba la entrada norte los lunes','current':'Ambas entradas principales son para compradores'},
  {'p':'''La cooperativa repartía pedidos una vez por semana. Primero identificó los barrios donde más entregas llegaban tarde.

Durante un mes añadió el viernes solo para el barrio central. La tabla publicada entonces mostraba dos recorridos semanales en esa zona y uno en las demás.

Después incorporó un vehículo compartido y extendió el segundo reparto a todos los barrios. Hoy todas las zonas reciben entregas martes y viernes; la tabla de prueba está archivada.''','first':'Identificó barrios con entregas tardías','middle':'Añadió viernes solo al barrio central','last':'Extendió viernes a todos los barrios','old':'La tabla con viernes exclusivo del barrio central','current':'Todas las zonas reciben entregas martes y viernes'})]
causes = [
 ({'p':'''En el huerto escolar algunas plantas se secaban después del fin de semana. El grupo sospechó del calor, pero también vio secas las macetas ubicadas bajo sombra.

Comparó dos grupos con la misma luz durante tres semanas. Solo uno recibió riego los sábados. Ese grupo mantuvo la humedad y perdió menos plantas.

La escuela organizó turnos de riego. Una lluvia llegó un martes de la prueba, pero la diferencia ya se había observado antes; coincidir en el calendario no prueba que esa lluvia causara el resultado.''','cause':'El riego de los sábados','evidence':'Con igual luz, las macetas regadas perdieron menos plantas','coincidence':'La lluvia de un martes','effect':'Se secaron menos plantas','limit':'La prueba duró solo tres semanas'},
  {'p':'''En una biblioteca aumentaron los préstamos vencidos. Algunos lectores dijeron que olvidaban la fecha de devolución, así que el equipo probó avisos antes del plazo.

Un grupo recibió recordatorios y otro siguió el procedimiento habitual. Durante cuatro semanas el primero devolvió más libros a tiempo. No cambiaron las multas ni los horarios.

La biblioteca amplió los avisos. Ese mes también pintaron la fachada, pero la pintura no ofrece un mecanismo para explicar la diferencia entre los dos grupos.''','cause':'Los recordatorios antes del vencimiento','evidence':'El grupo con avisos devolvió más libros a tiempo sin otros cambios','coincidence':'La pintura de la fachada','effect':'Aumentaron las devoluciones puntuales','limit':'Solo se observaron cuatro semanas'}),
 ({'p':'''Algunos pacientes faltaban a sus consultas porque confundían la hora. La clínica empezó a enviar un mensaje el día anterior con fecha y horario completos.

Durante un mes alternó semanas con aviso y sin aviso. Hubo menos ausencias cuando se enviaron mensajes; la cantidad de médicos y el tipo de consultas siguieron iguales.

El centro mantuvo los avisos. Una tormenta redujo la asistencia un viernes, pero ese episodio aislado no explica la diferencia repetida en otras semanas.''','cause':'Los mensajes con fecha y hora','evidence':'Hubo menos ausencias en semanas con aviso y el personal fue el mismo','coincidence':'La tormenta de un viernes','effect':'Disminuyeron las consultas perdidas','limit':'Un mes no garantiza el mismo efecto todo el año'},
  {'p':'''La cafetería desechaba pan al cierre porque preparaba la misma cantidad cada día. Decidió anotar ventas por horario antes de cambiar la producción.

Alternó días con la cantidad habitual y días con tandas pequeñas por la tarde. Vendió cantidades similares, pero sobraron menos piezas en los días de tandas pequeñas. El precio no cambió.

En la segunda semana colocaron flores en la entrada. Eso ocurrió al mismo tiempo, pero no explica por qué el sobrante bajó solo durante los días con el nuevo método.''','cause':'Preparar tandas pequeñas por la tarde','evidence':'Con ventas similares, sobraron menos piezas solo esos días','coincidence':'Las flores colocadas en la entrada','effect':'Se redujo el pan sobrante','limit':'La observación cubrió dos semanas'}),
 ({'p':'''El museo recibía preguntas repetidas sobre la ubicación de sus salas. Probó mapas sencillos en la entrada sin cambiar las rutas ni las piezas exhibidas.

En días alternos contó cuántas personas pedían indicaciones. Cuando había mapas visibles, menos visitantes preguntaban por las salas. La diferencia apareció antes de un cambio de temporada turística.

El museo instaló mapas permanentes. Más tarde abrió una exposición nueva, pero llegó después de observar la primera diferencia y no basta para explicarla.''','cause':'Los mapas visibles en la entrada','evidence':'En días alternos con mapas hubo menos preguntas sin cambios de ruta','coincidence':'La exposición inaugurada después','effect':'Disminuyeron las preguntas sobre ubicación','limit':'Se midieron preguntas, no toda la comprensión del museo'},
  {'p':'''La plaza se vaciaba al mediodía. La asociación pensó que faltaban bancas, pero las pocas que estaban bajo un árbol seguían ocupadas durante el calor.

Instaló toldos temporales sobre la mitad de las bancas y comparó sectores en días de temperatura similar. En la zona cubierta las personas permanecieron más tiempo; el horario de la plaza no cambió.

Hubo un concierto una noche de la prueba. La diferencia de permanencia se observó también en mediodías sin concierto, así que ese evento no explica el patrón.''','cause':'La sombra de los toldos','evidence':'Con temperatura similar, la permanencia aumentó en la zona cubierta','coincidence':'El concierto de una noche','effect':'Las personas permanecieron más tiempo al mediodía','limit':'La comparación fue en una temporada'})]
contrasts = [
 ({'p':'''El comité discutió abrir la biblioteca hasta las ocho. Laura apoyó hacerlo todos los días para quienes salen tarde del trabajo.

Diego también quería ampliar el acceso, pero propuso empezar solo los jueves. Le preocupaban las horas extra antes de conocer la asistencia. Ambos coincidieron en medir préstamos y visitas.

Acordaron probar cuatro jueves. Si llega más gente y alcanza el presupuesto, estudiarán más días. La propuesta de Diego no rechaza el horario nocturno: limita su alcance durante la prueba.''','a':'Laura quiere abrir todas las noches','b':'Diego quiere probar solo los jueves','shared':'Ambos buscan ampliar el acceso y medir visitas','difference':'La frecuencia antes de conocer demanda y costo','exception':'Más días solo si la asistencia y el presupuesto lo permiten'},
  {'p':'''La escuela debatió permitir celulares durante proyectos. Ana defendió usarlos para consultar mapas y registrar experimentos.

Bruno reconoció esa ventaja, pero pidió guardarlos durante las explicaciones. Temía que las alertas interrumpieran las consignas. Ambos aceptaron que el profesor definiera momentos de uso.

El acuerdo permite teléfonos solo en tareas que los necesitan y con notificaciones silenciadas. No es una prohibición total ni una autorización permanente; la condición depende del propósito de la actividad.''','a':'Ana apoya su uso para mapas y experimentos','b':'Bruno pide guardarlos durante explicaciones','shared':'Ambos aceptan momentos definidos por el profesor','difference':'Uso en tareas frente a uso durante explicaciones','exception':'Se usan cuando la tarea los necesita y sin alertas'}),
 ({'p':'''La cooperativa debía cambiar su reparto. Marta quería una ruta fija cada mañana para que las familias supieran cuándo esperar el vehículo.

Iván prefería agrupar entregas por zona dos veces por semana para ahorrar combustible. Ambos buscaban puntualidad, pero valoraban de forma distinta frecuencia y costo.

Acordaron mantener reparto diario para medicamentos urgentes. Los demás productos se agruparán por zona y su fecha se avisará al confirmar el pedido. La regla por zonas tiene una excepción explícita.''','a':'Marta propone una ruta diaria','b':'Iván propone agrupar por zona dos veces por semana','shared':'Ambos buscan entregas puntuales','difference':'Frecuencia diaria frente a menor costo por agrupación','exception':'Los medicamentos urgentes conservan entrega diaria'},
  {'p':'''El centro cultural revisó sus talleres. Sofía pidió sesiones nocturnas para personas que trabajan durante el día.

Raúl propuso mantener la tarde porque el transporte pasa más seguido a esa hora. No negaba la dificultad de quienes trabajan; le preocupaba el regreso nocturno. Ambos querían que más personas pudieran participar.

Decidieron ofrecer un taller nocturno cerca de una parada con servicio tardío y conservar los demás por la tarde. La decisión combina acceso y transporte en vez de imponer un único horario.''','a':'Sofía pide talleres nocturnos','b':'Raúl prefiere la tarde por el transporte','shared':'Ambos quieren mejorar el acceso','difference':'Disponibilidad laboral frente a facilidad del regreso','exception':'Un taller nocturno se ofrece cerca de transporte tardío'}),
 ({'p':'''El consejo del mercado discutió poner precios por unidad. Elena defendió aplicarlos a todos los productos para comparar tamaños distintos.

Tomás apoyó la medida para envases, pero señaló que algunas frutas se venden por pieza y varían de peso. Un precio por kilo sin pesar cada lote podría confundir. Ambos querían etiquetas claras.

El acuerdo exige precio por unidad en envases y por kilo donde haya báscula confiable. Sin báscula, las piezas variables mantienen precio por pieza y una advertencia. La regla depende de cómo se vende cada producto.''','a':'Elena propone precios por unidad para todo','b':'Tomás distingue productos de peso variable','shared':'Ambos quieren comparaciones claras','difference':'Regla universal frente a una según forma de venta','exception':'Sin báscula, las piezas variables conservan precio por pieza'},
  {'p':'''Una asociación evaluó prestar herramientas. Julia quería que cualquier vecino pudiera llevarlas una semana para reducir compras individuales.

Óscar apoyó el préstamo, pero pidió orientación para usar herramientas eléctricas. Algunas requieren protección y cuidado. Ambos querían un inventario y registro de devoluciones.

El reglamento permite el préstamo general de herramientas manuales; las eléctricas requieren una explicación breve. Esta condición no cancela el proyecto: distingue el riesgo de cada equipo y mantiene el acceso para quienes reciben orientación.''','a':'Julia propone préstamo semanal abierto','b':'Óscar pide orientación para equipos eléctricos','shared':'Ambos apoyan inventario y devoluciones','difference':'Acceso libre frente a orientación para equipos riesgosos','exception':'Las herramientas eléctricas requieren orientación previa'})]
inferences = [
 ({'p':'''La biblioteca inició un servicio de préstamo de tabletas. Doce personas pidieron una para libros digitales y ocho para buscar información escolar durante la primera semana.

El equipo registró reservas todas las tardes, pero no preguntó si los usuarios tenían otros dispositivos en casa. Algunas tabletas volvieron antes del plazo y otras en el último día.

La biblioteca ampliará horarios si las reservas siguen. Aún no ha medido si las tabletas mejoran las calificaciones ni si sustituyen la lectura en papel.''','explicit':'Hubo reservas todas las tardes','supported':'El servicio atrajo más de un propósito de uso','evidence':'Hubo solicitudes para libros y para información escolar','unknown':'Si los usuarios tenían otro dispositivo en casa','unsupported':'Las tabletas mejoraron las calificaciones de todos'},
  {'p':'''Un centro comunitario abrió un espacio de estudio dos noches por semana. Las mesas estuvieron ocupadas en seis de las primeras ocho sesiones y varias personas solicitaron más enchufes.

El registro indica lugares ocupados, pero no identifica a la misma persona en cada visita. Tampoco compara resultados escolares antes y después de abrir la sala.

El centro comprará extensiones seguras y seguirá observando la asistencia antes de añadir otra noche. Conoce la demanda en varias sesiones, pero no puede afirmar que todos los vecinos necesitan estudiar allí.''','explicit':'Las mesas se ocuparon en seis de ocho sesiones','supported':'Hubo demanda del espacio en varias noches','evidence':'Se ocuparon mesas en seis sesiones','unknown':'Cuántas personas distintas asistieron','unsupported':'La sala elevó las calificaciones de todos'}),
 ({'p':'''La escuela prestó bicicletas durante un mes a estudiantes que viven lejos. Treinta las usaron al menos una vez y dieciocho solicitaron otra la semana siguiente.

El personal contó préstamos, pero no registró cómo viajaban antes ni si dejaron de tomar el autobús. Dos bicicletas necesitaron reparación al terminar el mes.

La escuela considera ampliar el programa. Los registros muestran interés repetido de una parte de los usuarios, pero no demuestran un ahorro de transporte para cada familia.''','explicit':'Dieciocho estudiantes repitieron la solicitud','supported':'Una parte de los usuarios quiso repetir','evidence':'Dieciocho de treinta volvieron a solicitar una bicicleta','unknown':'Cómo viajaban antes los estudiantes','unsupported':'Todas las familias ahorraron en autobús'},
  {'p':'''El museo ofreció descripciones de audio. Durante tres jornadas se prestaron treinta auriculares y algunas personas recomendaron incluir más piezas.

El equipo preguntó qué salas visitaron, pero no registró cuánto tiempo pasaron ante cada obra. Tampoco aplicó pruebas de memoria antes y después de la visita.

Ahora preparará más descripciones y medirá su uso. Las solicitudes apoyan ampliar la oferta; no prueban que todos comprendieron mejor cada obra gracias al audio.''','explicit':'Se prestaron treinta auriculares','supported':'Algunos visitantes quieren más piezas con audio','evidence':'Varias personas recomendaron ampliar el recorrido','unknown':'Cuánto tiempo estuvieron frente a cada obra','unsupported':'Todos comprendieron mejor cada obra gracias al audio'}),
 ({'p':'''El mercado permitió pedidos por mensaje para recogerlos al salir del trabajo. En dos semanas recibió cuarenta pedidos y veintiséis se retiraron después de las seis.

El registro muestra horarios, pero no pregunta si esas personas antes compraban en otros puestos. Tampoco indica cuánto tiempo ahorró cada cliente.

Los comerciantes ampliarán una semana la prueba. Los retiros tardíos sugieren que ese horario sirve a una parte de los compradores, sin demostrar aún un aumento de ventas totales.''','explicit':'Veintiséis pedidos se recogieron después de las seis','supported':'El horario tardío parece útil para algunos clientes','evidence':'Veintiséis de cuarenta pedidos se retiraron tarde','unknown':'Si esos clientes compraban antes en otros puestos','unsupported':'Las ventas totales aumentaron por el nuevo servicio'},
  {'p':'''La clínica ofreció una línea para aclarar instrucciones de medicamentos. En el primer mes recibió cincuenta llamadas y la mayoría trató sobre horarios de toma.

El personal anotó los temas, pero no verificó si cada paciente cumplió después su tratamiento. Algunas personas llamaron dos veces por dudas diferentes.

La clínica actualizará las hojas de instrucciones. La frecuencia de preguntas revela un punto que conviene explicar mejor; no demuestra por sí sola que la línea eliminó errores médicos.''','explicit':'La mayoría de llamadas trató sobre horarios','supported':'Conviene aclarar mejor los horarios de toma','evidence':'La mayoría de preguntas se concentró en horarios','unknown':'Si cada paciente cumplió después el tratamiento','unsupported':'La línea eliminó los errores de medicación'})]
closures = [
 {'p':'''En abril el barrio desvió todos los vehículos junto a la escuela. Los vecinos observaron que esa medida también impedía llegar a una clínica.

En mayo limitaron el cierre a la hora de entrada escolar y contaron menos cruces peligrosos. Unas obras de pintura coincidieron con la prueba, pero no modificaron el flujo en otros horarios.

María quiere mantener el cierre todo el día; Luis prefiere proteger el acceso clínico fuera del horario escolar. El acuerdo vigente cierra solo de siete a ocho, mientras se recogen más datos.''','seq':'El cierre total pasó a uno de siete a ocho','old':'El desvío durante todo el día','cause':'El cierre durante la entrada redujo cruces peligrosos','coincidence':'Las obras de pintura','contrast':'María pide cierre total y Luis uno limitado','exception':'La clínica conserva acceso fuera del horario escolar','infer':'La medida puede equilibrar seguridad y acceso','unsupported':'Ya no habrá ningún cruce peligroso'},
 {'p':'''La biblioteca tenía un buzón de devoluciones dentro del edificio. Solo podía usarse cuando la biblioteca abría, aunque algunos lectores trabajaban hasta tarde.

En junio colocó otro buzón fuera y registró entregas durante los fines de semana. Las multas permanecieron iguales; un cartel nuevo con el horario anterior no explica las devoluciones fuera de ese horario.

Eva propone instalar buzones exteriores en todas las sucursales. Omar quiere comprobar primero la seguridad nocturna. Mantienen el buzón actual y estudiarán iluminación antes de abrir los otros.''','seq':'El buzón pasó del interior al exterior','old':'La regla de devolver solo durante la apertura','cause':'El acceso exterior permitió entregas en fin de semana','coincidence':'El cartel nuevo con el horario anterior','contrast':'Eva pide extenderlo ya y Omar revisar seguridad','exception':'Las demás sedes esperan una revisión de iluminación','infer':'Hay interés por devolver fuera del horario','unsupported':'Todas las sedes tendrán buzón exterior mañana'},
 {'p':'''El mercado abrió una fila rápida sin límite de productos. El primer día siguió habiendo espera porque algunos compradores llevaban carritos llenos.

La semana siguiente limitó la fila a diez productos. En días similares la espera bajó sin que cambiara el número de cajas. Un anuncio de radio salió después de la primera reducción.

Rosa quiere mantener siempre el límite; Pedro permitiría más artículos cuando no haya fila. Acordaron aplicarlo en horas concurridas y flexibilizarlo si está vacía. Falta observar la temporada alta.''','seq':'La fila sin límite pasó a diez productos en horas concurridas','old':'La fila rápida sin límite de artículos','cause':'El límite de productos contribuyó a bajar la espera','coincidence':'El anuncio de radio posterior','contrast':'Rosa quiere límite permanente y Pedro flexibilidad','exception':'Con la fila vacía se admiten más artículos','infer':'El límite parece útil con alta demanda','unsupported':'La espera desaparecerá en temporada alta'},
 {'p':'''El centro cultural recibía solicitudes de salas solo en ventanilla. Las personas que trabajaban durante ese horario tenían dificultad para reservar.

En febrero añadió solicitudes por internet y recibió más peticiones nocturnas. El precio y el tamaño de las salas permanecieron iguales. Llovió varios días, pero también llegaron solicitudes en días despejados.

Nora propone ampliar enseguida el horario de uso. Raúl quiere revisar primero si hay personal suficiente. Decidieron estudiar el costo y mantener por ahora el horario de las salas, aunque la reserva ya puede hacerse en línea.''','seq':'Las solicitudes pasaron de ventanilla a ventanilla e internet','old':'La solicitud exclusiva en ventanilla','cause':'El trámite en línea facilitó solicitar turnos fuera de ventanilla','coincidence':'La lluvia de algunos días','contrast':'Nora pide más horario ya y Raúl revisar personal','exception':'El horario de uso no cambia mientras se calcula el costo','infer':'Hay interés en reservar fuera del horario de ventanilla','unsupported':'Las salas ya abren todas las noches'},
 {'p':'''La cooperativa entregaba pedidos en su local central. El primer mapa solo mostraba ese lugar porque los puntos vecinales aún no estaban listos.

Después abrió dos puntos en otros barrios y registró más retiros cerca de casa. El precio quedó igual; un festival atrajo visitantes una tarde, pero los retiros siguieron altos otros días.

Alma quiere abrir enseguida un cuarto punto. Diego pide medir cuántas personas se necesitan. Por ahora permanecen los tres puntos y el cuarto dependerá de demanda y costo; no se ha medido el tiempo ahorrado por cada cliente.''','seq':'Del local único se pasó a tres puntos de entrega','old':'El mapa que solo mostraba el local central','cause':'Los puntos nuevos acercaron la recogida a los barrios','coincidence':'El festival de una tarde','contrast':'Alma quiere un cuarto ya y Diego medir su costo','exception':'El cuarto depende de la demanda y el personal','infer':'Hay demanda por retirar cerca de casa','unsupported':'Todos ahorraron una hora de traslado'},
 {'p':'''La escuela prestaba libros de vacaciones por una sola semana. Varias familias dijeron que no alcanzaban a terminarlos y pidieron más tiempo.

En la siguiente prueba amplió el plazo a tres semanas. Volvieron más libros completos dentro del periodo y no cambiaron los títulos ofrecidos. El afiche nuevo apareció después de iniciado el cambio.

Lucía propone dar tres semanas a todos. Mario prefiere una semana para los títulos con lista de espera. Acordaron tres semanas en general y una para los ejemplares muy solicitados; falta observar su desgaste a largo plazo.''','seq':'El plazo general pasó de una a tres semanas','old':'El aviso de una semana para todos los libros','cause':'El plazo mayor dio más tiempo para terminar las lecturas','coincidence':'El afiche publicado después del cambio','contrast':'Lucía pide tres semanas para todos y Mario distingue los solicitados','exception':'Los títulos con lista de espera mantienen una semana','infer':'El plazo original era corto para algunas familias','unsupported':'Todos los libros regresarán siempre sin daño'}]

# Distinct key arrangements across variants, with no predictable A-B-C cycle.
patterns={
 '3.1':[[1,0,2,2,0,1],[2,1,0,1,2,0],[0,2,1,0,1,2]],
 '3.2':[[2,0,1,0,2,1],[1,2,0,2,1,0],[0,1,2,1,0,2]],
 '3.3':[[0,2,1,1,0,2],[2,0,1,0,2,1],[1,2,0,2,1,0]],
 '3.4':[[1,2,0,0,1,2],[0,1,2,2,0,1],[2,0,1,1,2,0]],
 '3.C':[[2,1,0,1,0,2],[1,0,2,0,2,1],[0,2,1,2,1,0]]}

def Q(prompt,right,wrong1,wrong2,why,err1,err2,skill):
 return {'q':prompt,'options':[right,wrong1,wrong2],
         'feedback':['Bien. '+why,'Revisa la evidencia: '+why,'Revisa la evidencia: '+why],
         'errors':[None,err1,err2],'skill':skill}

def seq(d,transfer=False):
 s='text_sequence'; order=f"{d['first']}; {d['middle']}; {d['last']}"
 if transfer:return [Q('¿Cuál es el orden de los cambios?',order,f"{d['last']}; {d['middle']}; {d['first']}",f"{d['middle']}; {d['first']}; {d['last']}",'el texto presenta primero el problema, luego la prueba y al final la actualización.','orden_invertido','orden_invertido',s),Q('¿Qué dato antiguo ya no describe la situación?',d['old'],d['current'],d['last'],'la fuente antigua fue reemplazada por un dato posterior.','vigente_por_obsoleto','cambio_por_obsoleto',s)]
 return [Q('¿Qué sucedió primero?',d['first'],d['middle'],d['last'],'el primer párrafo presenta este hecho antes de la prueba.','orden_invertido','orden_invertido',s),Q('¿Qué ocurrió durante la prueba?',d['middle'],d['first'],d['last'],'la etapa intermedia se distingue del hecho inicial y de la decisión final.','orden_invertido','orden_invertido',s),Q('¿Cuál es el orden de las tres etapas?',order,f"{d['last']}; {d['middle']}; {d['first']}",f"{d['middle']}; {d['last']}; {d['first']}",'la secuencia avanza de observación a prueba y estado actual.','orden_invertido','orden_invertido',s),Q('¿Qué información debe usarse hoy?',d['current'],d['old'],d['middle'],'el último párrafo actualiza el dato de la prueba.','dato_obsoleto','prueba_por_vigente',s)]

def cause(d,transfer=False):
 s='text_causality';a=[Q('¿Qué medida explica mejor el resultado observado?',d['cause'],d['coincidence'],d['limit'],'la medida se comparó con el resultado; una coincidencia no basta.','coincidencia_por_causa','limite_por_causa',s),Q('¿Qué observación apoya esa explicación?',d['evidence'],d['coincidence'],d['effect'],'la comparación aporta la evidencia concreta.','coincidencia_por_evidencia','resultado_por_evidencia',s),Q('¿Qué hecho coincidió sin explicar por sí solo la diferencia?',d['coincidence'],d['cause'],d['evidence'],'ocurrió cerca en el tiempo, pero no explica el contraste observado.','causa_por_coincidencia','evidencia_por_coincidencia',s),Q('¿Qué conclusión respeta los límites de la prueba?',f"{d['effect']}; {d['limit'].lower()}",f"{d['effect']} en todos los casos futuros",'No hubo cambio alguno','el resultado se limita al periodo y condiciones observadas.','generalizacion_excesiva','evidencia_omitida',s)]
 return [a[0],a[2]] if transfer else a

def contrast(d,transfer=False):
 s='text_contrast';a=[Q('¿Qué propone la primera persona?',d['a'],d['b'],d['shared'],'la primera postura aparece antes de la objeción.','postura_invertida','acuerdo_por_postura',s),Q('¿Qué propone la segunda persona?',d['b'],d['a'],d['shared'],'la segunda postura plantea una condición distinta.','postura_invertida','acuerdo_por_postura',s),Q('¿En qué difieren las propuestas?',d['difference'],d['shared'],'No existe diferencia entre ellas','comparten una meta, pero difieren en alcance o condición.','acuerdo_por_diferencia','contraste_omitido',s),Q('¿Qué excepción conserva el acuerdo?',d['exception'],'La regla se aplica siempre sin condición',d['a'],'la decisión final expresa una condición concreta.','excepcion_omitida','postura_por_acuerdo',s)]
 return a[2:] if transfer else a

def infer(d,transfer=False):
 s='text_inference';a=[Q('¿Qué dato aparece explícitamente?',d['explicit'],d['supported'],d['unsupported'],'ese hecho se puede señalar directamente en el pasaje.','inferencia_por_explicito','inferencia_sin_evidencia',s),Q('¿Qué se puede inferir sin exagerar?',d['supported'],d['unsupported'],d['unknown'],'la conclusión conserva los límites de los datos.','inferencia_sin_evidencia','desconocido_por_inferencia',s),Q('¿Qué pista respalda la inferencia?',d['evidence'],d['unknown'],d['unsupported'],'esa observación sí fue registrada.','dato_no_medido','conclusion_por_evidencia',s),Q('¿Qué información sigue sin conocerse?',d['unknown'],d['explicit'],d['evidence'],'el texto dice que no fue recogida.','explicito_por_desconocido','evidencia_por_desconocido',s)]
 return [a[1],Q('¿Qué afirmación excede la evidencia?',d['unsupported'],d['supported'],d['explicit'],'el pasaje no permite afirmar ese resultado general.','inferencia_respaldada_por_excesiva','explicito_por_excesivo',s)] if transfer else a

cases=[]
for code,groups,make in [('3.1',sequence,seq),('3.2',causes,cause),('3.3',contrasts,contrast),('3.4',inferences,infer)]:
 for variant,(train,new) in zip('ABC',groups):
  for step,(source,q) in enumerate([(train,x) for x in make(train)]+[(new,x) for x in make(new,True)],1):
   cases.append((code,variant,step,'probe' if step<3 else 'guided' if step<5 else 'transfer',source['p'],q))

for variant,first in zip('ABC',[0,2,4]):
 a,b=closures[first:first+2]
 questions=[
  (a,Q('¿Qué cambió desde el inicio?',a['seq'],a['old'],'No hubo ninguna actualización','la primera etapa fue reemplazada por otra.','dato_obsoleto','actualizacion_omitida','text_sequence')),
  (a,Q('¿Qué explica mejor el resultado observado?',a['cause'],a['coincidence'],'La opinión por sí sola','la medida tiene apoyo en la comparación descrita.','coincidencia_por_causa','opinion_por_causa','text_causality')),
  (a,Q('¿Qué conclusión es proporcional a lo observado?',a['infer'],a['unsupported'],'No se observó nada','la inferencia reconoce lo que aún no se ha demostrado.','inferencia_sin_evidencia','evidencia_omitida','text_inference')),
  (b,Q('¿En qué difieren las posturas?',b['contrast'],'Ambos dicen exactamente lo mismo','No hubo ninguna propuesta','el texto compara dos alcances o condiciones distintas.','contraste_omitido','postura_omitida','text_contrast'))]
 if variant=='A':
  questions += [(b,Q('¿Qué información antigua ya no aplica?',b['old'],b['seq'],b['exception'],'la actualización posterior reemplazó esa regla.','cambio_por_obsoleto','vigente_por_obsoleto','text_sequence')),(b,Q('¿Qué coincidencia no explica por sí sola el cambio?',b['coincidence'],b['cause'],b['infer'],'el texto distingue el hecho cercano de la medida comparada.','causa_por_coincidencia','inferencia_por_coincidencia','text_causality'))]
 elif variant=='B':
  questions += [(b,Q('¿Qué excepción quedó en el acuerdo?',b['exception'],'La regla no tiene excepción',b['old'],'el acuerdo explicita la condición.','excepcion_omitida','dato_obsoleto','text_contrast')),(b,Q('¿Qué afirmación va más allá de los datos?',b['unsupported'],b['infer'],b['seq'],'esa conclusión absoluta no fue demostrada.','inferencia_respaldada_por_excesiva','dato_explicito_por_inferencia','text_inference'))]
 else:
  questions += [(b,Q('¿Qué dato anterior ya no está vigente?',b['old'],b['seq'],b['exception'],'el pasaje actualiza esa regla anterior.','cambio_por_obsoleto','vigente_por_obsoleto','text_sequence')),(b,Q('¿Qué afirmación carece de respaldo?',b['unsupported'],b['infer'],b['seq'],'el texto no mide ese resultado absoluto.','inferencia_respaldada_por_excesiva','dato_explicito_por_inferencia','text_inference'))]
 for step,(source,q) in enumerate(questions,1):cases.append(('3.C',variant,step,'transfer',source['p'],q))

out=[]
for code,variant,step,role,passage,q in cases:
 key=patterns[code]['ABC'.index(variant)][step-1]
 places=[key]+[x for x in range(3) if x!=key]
 options=[None]*3;feedback=[None]*3;errors=[None]*3
 for original,place in enumerate(places):
  options[place]=q['options'][original];feedback[place]=q['feedback'][original];errors[place]=q['errors'][original]
 out.append(dict(code=code,variant=variant,step=step,role=role,passage=passage,question=q['q'],options=options,correct=key,feedback=feedback,skill=q['skill'],errors=errors))
assert len(out)==90
assert len(set(x['passage'] for x in out))==30
assert all(len(set(x['options']))==3 for x in out)
assert all(65<=len(x['passage'].split())<=130 for x in out),[(x['code'],x['variant'],len(x['passage'].split())) for x in out if not 65<=len(x['passage'].split())<=130]
assert all({x['skill'] for x in out if x['code']=='3.C' and x['variant']==v}=={'text_sequence','text_causality','text_contrast','text_inference'} for v in 'ABC')
assert all(''.join(str(x['correct']) for x in out if x['code']==code and x['variant']==v)!='012012' for code in patterns for v in 'ABC')

seed=json.dumps(out,ensure_ascii=False,separators=(',',':'))
header='''begin;
-- Existing v1 attempts/responses remain attached to v1; new attempts use version 2.
do $seed$
declare item jsonb; cid uuid;
begin
 for item in select value from jsonb_array_elements($cases$'''
footer='''$cases$::jsonb) loop
  insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
  values(item->>'code',2,item->>'variant',(item->>'step')::smallint,item->>'role',item->>'passage',item->>'question',item->'options') returning id into cid;
  insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
  values(cid,(item->>'correct')::smallint,item->'feedback');
  insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
  values(cid,item->'errors',item->>'skill');
 end loop;
end $seed$;
update public.curriculum_lessons set content_version=2,
 title=case code when '3.1' then 'Ordena los hechos y actualiza los datos' when '3.2' then 'Distingue causas de coincidencias' when '3.3' then 'Compara posturas y excepciones' when '3.4' then 'Infiere con evidencias' else 'Cierre: relacionar textos' end,
 mission='Relaciona partes de un texto y fundamenta lo que concluyes.',
 skill_code=case code when '3.1' then 'text_sequence' when '3.2' then 'text_causality' when '3.3' then 'text_contrast' when '3.4' then 'text_inference' else 'text_integration' end
 where code in ('3.1','3.2','3.3','3.4','3.C');
'''
# Keep the existing function implementation byte for byte except the 1.3 prerequisite gate.
previous=Path('supabase/migrations/20261008015000_speedeep_curriculum_v2_and_route_tracking.sql').read_text()
start=previous.index('create or replace function private.begin_curriculum_lesson(p_lesson_code text)')
end=previous.index('end $$;',start)+len('end $$;')
function=previous[start:end]
old="end and status='completed') then\n   raise exception 'Completa la lección anterior del nivel 1.3.'"
new="end and status='completed' and transfer_correct>=1) then\n   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.3.'"
assert old in function
function=function.replace(old,new)
Path('supabase/migrations/20261008070000_speedeep_level_1_3_v2.sql').write_text(header+seed+footer+function+'\ncommit;\n')
print('cases',len(out),'passages',len(set(x['passage'] for x in out)),'word range',min(len(x['passage'].split()) for x in out),max(len(x['passage'].split()) for x in out),'migration bytes',len((header+seed+footer+function).encode()))
