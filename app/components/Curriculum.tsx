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

export default function Curriculum({ onStart, onDiagnostic, diagnosticStatus, diagnosticStep, activeStep, completedCount }: { onStart: () => void; onDiagnostic: () => void; diagnosticStatus?: "not_started" | "active" | "completed"; diagnosticStep?: number | null; activeStep?: number | null; completedCount?: number }) {
  return <section className="section-page" aria-labelledby="route-heading">
    <p className="eyebrow">TU PLAN DE ESTUDIOS</p><h1 id="route-heading">Ruta de lectura</h1>
    <p>32 misiones en ocho bloques. Cada misión enseña una acción que aplicarás en textos nuevos.</p>
    <div className="route-notice"><strong>{diagnosticStatus === "completed" ? "Tu punto de partida quedó guardado" : "Descubre tu punto de partida"}</strong><span>{diagnosticStatus === "completed" ? "Empieza con la primera habilidad. El diagnóstico orienta tu enseñanza y no certifica dominio; podrás revisar tus resultados aquí." : "Lee dos textos nuevos a tu ritmo y responde preguntas de comprensión. Puedes interrumpir y retomar."}</span><button className="mission-launch diagnostic-launch" onClick={onDiagnostic}>{diagnosticStatus === "completed" ? "Ver resultado" : diagnosticStatus === "active" ? `Retomar pregunta ${diagnosticStep ?? 1}/10` : "Comenzar diagnóstico"}</button></div>
    <div className="block-list">{blocks.map((block, index) => <article className="block-card" key={block.title}>
      <div className="block-heading"><span>Bloque {index + 1}</span><strong>{block.title}</strong></div>
      <ol>{block.lessons.map((lesson, lessonIndex) => <li key={lesson}><span>{index + 1}.{lessonIndex + 1}</span>{lesson}{index === 0 && lessonIndex === 0 ? <button className="mission-launch" onClick={onStart}>{activeStep ? `Retomar · ${activeStep}/6` : completedCount ? "Practicar otra variante" : "Abrir misión"}</button> : <small title="Esta misión aún no está publicada">Próximamente</small>}</li>)}</ol>
    </article>)}</div>
  </section>;
}
