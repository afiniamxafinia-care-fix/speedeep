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
  onStart: (code: "1.1" | "1.2") => void;
  onDiagnostic: () => void;
  onFlash: () => void;
  diagnosticStatus?: "not_started" | "active" | "completed";
  diagnosticStep?: number | null;
  activeStep?: number | null;
  activeLessonCode?: string | null;
  completedCount?: number;
  sentenceActionState?: "not_started" | "completed" | "demonstrated";
  anchor?: { nextArticleId: string | null; baselinePpm: number | null; baselineComprehension: number | null; comparisonPpm: number | null; comparisonComprehension: number | null; deltaPpm: number | null };
  onReadAnchor: (articleId: string) => void;
  onExploreReading: () => void;
};

export default function Curriculum({ onStart, onDiagnostic, onFlash, diagnosticStatus, diagnosticStep, activeStep, activeLessonCode, completedCount = 0, sentenceActionState, anchor, onReadAnchor, onExploreReading }: Props) {
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

    {diagnosticStatus === "completed" && <div className="route-anchor">
      <span className="eyebrow">TU PUNTO DE PARTIDA · LECTURA REAL</span>
      <strong>{anchor?.baselinePpm === null || !anchor ? "Descubre tu velocidad inicial" : anchor.comparisonPpm === null ? `${anchor.baselinePpm} ppm · referencia provisional` : `De ${anchor.baselinePpm} a ${anchor.comparisonPpm} ppm`}</strong>
      <p>{anchor?.baselinePpm === null || !anchor ? "Lee un texto nuevo y responde sobre lo que entendiste. Verás tu velocidad y comprensión al terminar." : anchor.comparisonPpm === null ? completedCount < 2 ? `Comprensión inicial: ${anchor.baselineComprehension}%. Aplica ahora la lección 1.2 y después compara tu lectura.` : `Comprensión inicial: ${anchor.baselineComprehension}%. Otra lectura mostrará cómo cambia tu desempeño.` : `Cambio observado: ${anchor.deltaPpm && anchor.deltaPpm > 0 ? "+" : ""}${anchor.deltaPpm} ppm, con ${anchor.comparisonComprehension}% de comprensión en el segundo texto.`}</p>
      {anchor?.nextArticleId && (anchor.baselinePpm === null || completedCount >= 2) ? <button className="mission-launch" onClick={() => onReadAnchor(anchor.nextArticleId!)}>{anchor.baselinePpm === null ? "Hacer lectura inicial" : "Hacer lectura de comparación"}</button>
        : !anchor?.nextArticleId && anchor?.baselinePpm === null ? <button className="mission-launch" onClick={onExploreReading}>Elegir otra lectura</button> : null}
      <small>Este punto de referencia no otorga un club ni una calificación QSD.</small>
    </div>}

    <div className="route-level-title">
      <div><span>MI RUTA</span><h2>Una habilidad a la vez.</h2></div>
      <small>{currentLevel.lessons.length} lecciones</small>
    </div>
    <p className="route-state-guide"><span><i className="route-state-dot route-state-dot-current"/> En curso</span><span><i className="route-state-dot route-state-dot-completed"/> Completada</span><span><i className="route-state-dot route-state-dot-locked"/> Próximamente</span></p>

    <ol className="route-steps" aria-label={`Lecciones de ${currentLevel.label}`}>
      {currentLevel.lessons.map((lesson, index) => {
        const available = index <= 1 && (index === 0 || practicedFirst);
        const code = `1.${index+1}` as "1.1" | "1.2";
        const inProgress = activeLessonCode === code && activeStep;
        const completed = available && index < completedCount && !inProgress;
        const card = <li key={lesson.title} className={`route-step ${completed ? "route-step-completed" : available ? "route-step-current" : "route-step-locked"}`}>
          <span className="route-step-marker" aria-hidden="true">{completed ? "✓" : available ? "○" : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}</span>
          <div className="route-step-copy">
            <span>{currentLevel.label.toUpperCase()} · LECCIÓN {index + 1}</span>
            <strong>{lesson.title}</strong>
            <small>{available ? inProgress ? `En curso · paso ${activeStep} de 6` : code === "1.1" && sentenceActionState === "demonstrated" ? "Habilidad demostrada con oraciones nuevas y recuperación posterior" : completed ? "Completada · seguirás aplicando esta habilidad" : lesson.description : index === 1 ? "Completa la lección 1 para abrirla" : "Esta lección está en preparación"}</small>
          </div>
          {available ? <button className={`route-step-action ${completed ? "route-step-action-optional" : ""}`} aria-label={`${inProgress ? "Retomar" : completed ? "Practicar de nuevo, opcional" : "Abrir"} lección ${index+1}: ${lesson.title}`} onClick={() => onStart(code)}>{inProgress ? "Seguir" : completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button>
            : <span className="route-step-status">Próximamente</span>}
        </li>;
        if (!available || index !== 0) return card;
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
