"use client";

const currentLevel = {
  label: "Nivel 1.1",
  title: "Entender oraciones",
  mission: "Descubre quién hizo qué, incluso cuando hay detalles, giros y palabras nuevas.",
  lessons: [
    { title: "Conservar la acción central", description: "Encuentra la acción principal aunque haya detalles en medio." },
    { title: "Unir palabras que van juntas", description: "Agrupa las partes de una oración para conservar el sentido." },
    { title: "Seguir el giro de los conectores", description: "Descubre cómo cambia una idea con «pero», «porque» o «aunque»." },
    { title: "Resolver vocabulario sin perder el hilo", description: "Usa el contexto y decide cuándo necesitas una aclaración." },
  ],
};

type Props = {
  onStart: () => void;
  onDiagnostic: () => void;
  onFlash: () => void;
  diagnosticStatus?: "not_started" | "active" | "completed";
  diagnosticStep?: number | null;
  activeStep?: number | null;
  completedCount?: number;
};

export default function Curriculum({ onStart, onDiagnostic, onFlash, diagnosticStatus, diagnosticStep, activeStep, completedCount = 0 }: Props) {
  const practicedFirst = completedCount > 0;
  return <section className="section-page learning-route" aria-labelledby="route-heading">
    <p className="eyebrow">TU RUTA · {currentLevel.label.toUpperCase()}</p>
    <h1 id="route-heading">{currentLevel.title}</h1>
    <p>{currentLevel.mission}</p>

    <div className="route-notice route-intro">
      <strong>{diagnosticStatus === "completed" ? "Tu punto de partida está listo" : "Empieza por descubrir tu punto de partida"}</strong>
      <span>{diagnosticStatus === "completed" ? "Ya guardamos tu diagnóstico. Puedes consultar el resultado y seguir con tu primera misión." : "Dos lecturas breves orientan tu ruta. Puedes detenerte y retomarlas después."}</span>
      <button className="mission-launch diagnostic-launch" onClick={onDiagnostic}>{diagnosticStatus === "completed" ? "Ver diagnóstico" : diagnosticStatus === "active" ? `Retomar · pregunta ${diagnosticStep ?? 1}/10` : "Hacer diagnóstico"}</button>
    </div>

    <div className="route-level-title">
      <div><span>MI RUTA</span><h2>Una habilidad a la vez.</h2></div>
      <small>{currentLevel.lessons.length} lecciones</small>
    </div>

    <ol className="route-steps" aria-label={`Lecciones de ${currentLevel.label}`}>
      {currentLevel.lessons.map((lesson, index) => {
        const available = index === 0;
        const card = <li key={lesson.title} className={`route-step ${available ? "route-step-current" : "route-step-locked"}`}>
          <span className="route-step-marker" aria-hidden="true">{available ? "○" : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}</span>
          <div className="route-step-copy">
            <span>{currentLevel.label.toUpperCase()} · LECCIÓN {index + 1}</span>
            <strong>{lesson.title}</strong>
            <small>{available ? activeStep ? `Retoma el paso ${activeStep} de 6` : practicedFirst ? "Practicada · continúa consolidando esta habilidad" : lesson.description : "Esta lección está en preparación"}</small>
          </div>
          {available ? <button className="route-step-action" aria-label={`${activeStep ? "Retomar" : practicedFirst ? "Volver a practicar" : "Abrir"} lección 1: ${lesson.title}`} onClick={onStart}>{activeStep ? "Seguir" : practicedFirst ? "Repetir" : "Empezar"}<span aria-hidden="true">→</span></button>
            : <span className="route-step-status">Próximamente</span>}
        </li>;
        if (!available) return card;
        return [card, <li key="numbers-break" className={`route-break ${practicedFirst ? "route-break-ready" : "route-break-waiting"}`}>
          <span className="route-break-icon" aria-hidden="true">✦</span>
          <div><span>PAUSA CURIOSA · DESPUÉS DE LA LECCIÓN 1</span><strong>Cifras fugaces</strong><small>Ocho destellos para retar tu atención. Cuenta solo para tu nivel de Prácticas.</small></div>
          <button disabled={!practicedFirst} onClick={onFlash}>{practicedFirst ? "Jugar" : "Al completar 1"}</button>
        </li>];
      })}
    </ol>

    <div className="route-next-level"><span>DESPUÉS</span><strong>Construir la idea del párrafo</strong><small>El siguiente nivel aparecerá cuando esta parte de la ruta esté lista.</small></div>
  </section>;
}
