"use client";

const blocks = [
  { title: "Construir el sentido de la oración", lessons: ["Conservar la acción central", "Unir palabras que van juntas", "Seguir el giro de los conectores", "Resolver vocabulario sin perder el hilo"] },
  { title: "Construir la idea del párrafo", lessons: ["Decir de qué trata", "Separar idea y apoyo", "Conectar oraciones", "Conservar la esencia"] },
  { title: "Relacionar partes de un texto", lessons: ["Seguir una secuencia", "Entender causas y efectos", "Reconocer contrastes", "Inferir con evidencia"] },
  { title: "Controlar la comprensión y la atención", lessons: ["Detectar pérdida de sentido", "Elegir la reparación", "Volver al texto con propósito", "Recuperar el foco"] },
  { title: "Ganar fluidez sin soltar el significado", lessons: ["Encontrar un ritmo útil", "Reducir pausas evitables", "Releer para mejorar", "Ajustar ante dificultad"] },
  { title: "Elegir un modo de lectura", lessons: ["Leer con una pregunta", "Explorar", "Localizar", "Leer a fondo"] },
  { title: "Recordar y usar información", lessons: ["Recuperar sin mirar", "Organizar lo aprendido", "Explicar a alguien", "Recordar después"] },
  { title: "Transferir a la vida real", lessons: ["Entender instrucciones", "Decidir con información", "Evaluar una afirmación", "Misión elegida por el lector"] },
];

export default function Curriculum({ onStart }: { onStart: () => void }) {
  return <section className="section-page" aria-labelledby="route-heading">
    <p className="eyebrow">TU PLAN DE ESTUDIOS</p><h1 id="route-heading">Ruta de lectura</h1>
    <p>32 misiones en ocho bloques. Cada misión enseña una acción que aplicarás en textos nuevos.</p>
    <div className="route-notice"><strong>Diagnóstico inicial pendiente</strong><span>La ubicación personalizada y el desbloqueo por dominio se activarán al integrar las evaluaciones de la ruta. Las lecturas de Prácticas no acreditan estas lecciones.</span></div>
    <div className="block-list">{blocks.map((block, index) => <article className="block-card" key={block.title}>
      <div className="block-heading"><span>Bloque {index + 1}</span><strong>{block.title}</strong></div>
      <ol>{block.lessons.map((lesson, lessonIndex) => <li key={lesson}><span>{index + 1}.{lessonIndex + 1}</span>{lesson}{index === 0 && lessonIndex === 0 ? <button className="mission-launch" onClick={onStart}>Explorar misión</button> : <small>Bloqueada</small>}</li>)}</ol>
    </article>)}</div>
  </section>;
}
