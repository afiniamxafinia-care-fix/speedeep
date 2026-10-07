"use client";
import { useState } from "react";

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
  onStart: (code: "1.1" | "1.2" | "1.3" | "1.4" | "1.C" | "2.1" | "2.2" | "2.3" | "2.4") => void;
  onDiagnostic: () => void;
  onFlash: () => void;
  diagnosticStatus?: "not_started" | "active" | "completed";
  diagnosticStep?: number | null;
  activeStep?: number | null;
  activeLessonCode?: string | null;
  completedCount?: number;
  sentenceActionState?: "not_started" | "completed" | "demonstrated";
  integration?: { attempted: boolean; passed: boolean; correct: number | null };
  paragraphFirstCompleted?: boolean;
  paragraphSecondCompleted?: boolean;
  paragraphThirdCompleted?: boolean;
  paragraphFourthCompleted?: boolean;
  anchor?: { nextArticleId: string | null; baselinePpm: number | null; baselineComprehension: number | null; comparisonPpm: number | null; comparisonComprehension: number | null; deltaPpm: number | null };
  calibration?: { nextArticleId: string | null; count: number; latestPpm: number | null; latestComprehension: number | null };
  onReadAnchor: (articleId: string) => void;
  onExploreReading: () => void;
};

export default function Curriculum({ onStart, onDiagnostic, onFlash, diagnosticStatus, diagnosticStep, activeStep, activeLessonCode, completedCount = 0, sentenceActionState, integration, paragraphFirstCompleted, paragraphSecondCompleted, paragraphThirdCompleted, paragraphFourthCompleted, anchor, calibration, onReadAnchor, onExploreReading }: Props) {
  const practicedFirst = completedCount > 0;
  const [selectedLevel, setSelectedLevel] = useState<"1.1" | "1.2" | null>(null);
  const currentTab = selectedLevel ?? (integration?.passed ? "1.2" : "1.1");
  return <section className="section-page learning-route" aria-labelledby="route-heading">
    <p className="eyebrow">TU RUTA · NIVEL {currentTab}</p>
    <h1 id="route-heading">{currentTab === "1.1" ? currentLevel.title : "Construir la idea del párrafo"}</h1>
    <p>{currentTab === "1.1" ? currentLevel.mission : "Encuentra la idea, el apoyo y las conexiones entre las oraciones."}</p>

    <nav className="level-tabs" aria-label="Niveles de la ruta">
      {(["1.1", "1.2", "1.3", "1.4"] as const).map(level => {
        const unlocked = level === "1.1" || level === "1.2" && Boolean(integration?.passed);
        return <button key={level} type="button" className={currentTab === level ? "level-tab current" : "level-tab"} aria-current={currentTab === level ? "step" : undefined} disabled={!unlocked} onClick={() => setSelectedLevel(level as "1.1" | "1.2")}><strong>{level}</strong><small>{level === "1.1" ? integration?.passed ? "REPASAR" : "ACTUAL" : level === "1.2" ? currentTab === level ? "ACTUAL" : unlocked ? "ABRIR" : "PRÓXIMO" : "PRÓXIMO"}</small></button>;
      })}
    </nav>

    {currentTab === "1.1" ? <>

    <div className="route-notice route-intro">
      <strong>{diagnosticStatus === "completed" ? "Tu punto de partida está listo" : "Empieza por descubrir tu punto de partida"}</strong>
      <span>{diagnosticStatus === "completed" ? "Ya guardamos tu diagnóstico. Puedes consultar el resultado y seguir con tu primera misión." : "Dos lecturas breves orientan tu ruta. Puedes detenerte y retomarlas después."}</span>
      <button className="mission-launch diagnostic-launch" onClick={onDiagnostic}>{diagnosticStatus === "completed" ? "Ver diagnóstico" : diagnosticStatus === "active" ? `Retomar · pregunta ${diagnosticStep ?? 1}/10` : "Hacer diagnóstico"}</button>
    </div>

    {diagnosticStatus === "completed" && <div className="route-anchor">
      <span className="eyebrow">TU VELOCIDAD · LECTURAS COMPARABLES</span>
      <strong>{calibration?.count ? `${calibration.count} de 3 lecturas · última ${calibration.latestPpm} ppm` : "Mide tu punto de partida"}</strong>
      <p>{calibration?.count ? `Última comprensión: ${calibration.latestComprehension}%. Cada lectura se ve al terminar; la mediana aparecerá con tres resultados válidos.` : "Tres textos nuevos de dificultad y longitud similares. Lee cada uno cuando estés listo: el reloj empieza al tocar «Iniciar lectura»."}</p>
      {calibration?.count !== undefined && calibration.count >= 3 ? <span className="route-calibration-done">✓ Ya tienes una velocidad de referencia estable en Home.</span>
        : calibration?.nextArticleId ? <button className="mission-launch" onClick={() => onReadAnchor(calibration.nextArticleId!)}>Leer texto {Math.min(3,(calibration.count ?? 0)+1)} de 3</button>
        : <button className="mission-launch" onClick={onExploreReading}>Elegir otra lectura</button>}
      {anchor?.baselinePpm !== null && anchor?.baselinePpm !== undefined && <small>Tus lecturas anteriores ({anchor.baselinePpm} ppm de referencia inicial) permanecen en el historial; usaban el cronómetro anterior.</small>}
    </div>}

    <div className="route-level-title">
      <div><span>MI RUTA</span><h2>Una habilidad a la vez.</h2></div>
      <small>{currentLevel.lessons.length} lecciones + comprobación</small>
    </div>
    <p className="route-state-guide"><span><i className="route-state-dot route-state-dot-current"/> En curso</span><span><i className="route-state-dot route-state-dot-completed"/> Completada</span><span><i className="route-state-dot route-state-dot-locked"/> Próximamente</span></p>

    <ol className="route-steps" aria-label={`Lecciones de ${currentLevel.label}`}>
      {currentLevel.lessons.map((lesson, index) => {
        const available = index === 0 || completedCount >= index;
        const code = `1.${index+1}` as "1.1" | "1.2" | "1.3" | "1.4";
        const inProgress = activeLessonCode === code && activeStep;
        const completed = available && index < completedCount && !inProgress;
        const card = <li key={lesson.title} className={`route-step ${completed ? "route-step-completed" : available ? "route-step-current" : "route-step-locked"}`}>
          <span className="route-step-marker" aria-hidden="true">{completed ? "✓" : available ? "○" : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}</span>
          <div className="route-step-copy">
            <span>{currentLevel.label.toUpperCase()} · LECCIÓN {index + 1}</span>
            <strong>{lesson.title}</strong>
            <small>{available ? inProgress ? `En curso · paso ${activeStep} de 6` : code === "1.1" && sentenceActionState === "demonstrated" ? "Habilidad demostrada con oraciones nuevas y recuperación posterior" : completed ? "Completada · seguirás aplicando esta habilidad" : lesson.description : `Completa la lección ${index} para abrirla`}</small>
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

    <div className={`route-closure ${integration?.passed ? "route-closure-passed" : ""}`}>
      <span className="eyebrow">NIVEL 1.1 · COMPROBACIÓN</span>
      <strong>Comprende oraciones nuevas</strong>
      <p>{integration?.passed ? `Comprobado: ${integration.correct}/6 al primer intento y evidencia de las cuatro habilidades.` : integration?.attempted ? `Ronda realizada: ${integration.correct}/6 al primer intento. Practica lo que faltó y prueba otra variante.` : "Seis oraciones inéditas para aplicar acción, agrupación, conectores y vocabulario sin pistas."}</p>
      {completedCount >= 4 ? <button className="mission-launch" onClick={() => onStart("1.C")}>{activeLessonCode === "1.C" ? `Seguir · paso ${activeStep} de 6` : integration?.passed ? "Practicar otra variante" : integration?.attempted ? "Probar otra variante" : "Comenzar comprobación"}</button>
        : <small>Se abre al completar la lección 4.</small>}
    </div>

    </> : <>
      <div className="route-level-title"><div><span>MI RUTA · NIVEL 1.2</span><h2>Una habilidad a la vez.</h2></div><small>4 lecciones + comprobación</small></div>
      <ol className="route-steps" aria-label="Lecciones del nivel 1.2">
        {([
          { code: "2.1", title: "Di de qué trata el párrafo", detail: "Distingue la idea completa del tema o un detalle.", completed: paragraphFirstCompleted, available: true },
          { code: "2.2", title: "Separa idea y apoyo", detail: "Encuentra el dato que sostiene una idea.", completed: paragraphSecondCompleted, available: paragraphFirstCompleted },
          { code: "2.3", title: "Conecta oraciones", detail: "Sigue a quién o a qué se refiere cada frase.", completed: paragraphThirdCompleted, available: paragraphSecondCompleted },
          { code: "2.4", title: "Conserva la esencia", detail: "Resume un párrafo sin copiar detalles secundarios.", completed: paragraphFourthCompleted, available: paragraphThirdCompleted },
        ] as const).map((lesson, index) => <li key={lesson.code} className={`route-step ${lesson.completed ? "route-step-completed" : lesson.available ? "route-step-current" : "route-step-locked"}`}>
          <span className="route-step-marker" aria-hidden="true">{lesson.completed ? "✓" : lesson.available ? "○" : "🔒"}</span>
          <div className="route-step-copy"><span>NIVEL 1.2 · LECCIÓN {index+1}</span><strong>{lesson.title}</strong><small>{activeLessonCode === lesson.code ? `En curso · paso ${activeStep} de 6` : lesson.completed ? "Completada · podrás practicarla de nuevo" : lesson.available ? lesson.detail : index === 3 ? "Próximamente" : `Completa la lección ${index}`}</small></div>
          {lesson.available ? <button className={`route-step-action ${lesson.completed ? "route-step-action-optional" : ""}`} onClick={() => onStart(lesson.code)}>{activeLessonCode === lesson.code ? "Seguir" : lesson.completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button> : <span className="route-step-status">Próximamente</span>}
        </li>)}
      </ol>
    </>}
  </section>;
}
