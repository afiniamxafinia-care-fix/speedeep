"use client";
import { useState } from "react";
import type { PracticeKind } from "@/app/components/PracticeLibrary";

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
  onStart: (code: "1.1" | "1.2" | "1.3" | "1.4" | "1.C" | "2.1" | "2.2" | "2.3" | "2.4" | "2.C" | "3.1" | "3.2" | "3.3" | "3.4" | "3.C") => void;
  onDiagnostic: () => void;
  onFlash: () => void;
  onCuriousPractice: (kind: PracticeKind) => void;
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
  paragraphIntegration?: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] };
  textCompleted?: string[];
  textIntegration?: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] };
  curiousRotation?: number;
  anchor?: { nextArticleId: string | null; baselinePpm: number | null; baselineComprehension: number | null; comparisonPpm: number | null; comparisonComprehension: number | null; deltaPpm: number | null };
  calibration?: { nextArticleId: string | null; count: number; latestPpm: number | null; latestComprehension: number | null };
  onReadAnchor: (articleId: string) => void;
  onExploreReading: () => void;
};

export default function Curriculum({ onStart, onDiagnostic, onFlash, onCuriousPractice, diagnosticStatus, diagnosticStep, activeStep, activeLessonCode, completedCount = 0, sentenceActionState, integration, paragraphFirstCompleted, paragraphSecondCompleted, paragraphThirdCompleted, paragraphFourthCompleted, paragraphIntegration, textCompleted = [], textIntegration, curiousRotation = 0, anchor, calibration, onReadAnchor, onExploreReading }: Props) {
  const practicedFirst = completedCount > 0;
  const [selectedLevel, setSelectedLevel] = useState<"1.1" | "1.2" | "1.3" | null>(null);
  const currentTab = selectedLevel ?? (integration?.passed ? "1.2" : "1.1");
  const rotatingKind = (first: PracticeKind, second: PracticeKind) => curiousRotation % 2 === 0 ? first : second;
  const curiousBreak = (level: string, after: number, available: boolean, kind: PracticeKind) => <li key={`${level}-curious-${after}`} className={`route-break ${available ? "route-break-ready" : "route-break-waiting"}`}>
    <span className="route-break-icon" aria-hidden="true">✦</span><div><span>PAUSA CURIOSA · DESPUÉS DE LA LECCIÓN {after}</span><strong>{({ main_idea: "Idea principal", sequence: "Secuencias", find_data: "Busca el dato", relevance: "Lo relevante", reading: "Lectura" } as const)[kind]}</strong><small>Reto breve con ejercicios variables. Su resultado se guarda en Prácticas; es opcional para avanzar.</small></div>
    <button disabled={!available} onClick={() => onCuriousPractice(kind)}>{available ? "Jugar" : `Al completar ${after}`}</button>
  </li>;
  return <section className="section-page learning-route" aria-labelledby="route-heading">
    <p className="eyebrow">TU RUTA · NIVEL {currentTab}</p>
    <h1 id="route-heading">{currentTab === "1.1" ? currentLevel.title : currentTab === "1.2" ? "Construir la idea del párrafo" : "Relacionar partes de un texto"}</h1>
    <p>{currentTab === "1.1" ? currentLevel.mission : currentTab === "1.2" ? "Encuentra la idea, el apoyo y las conexiones entre las oraciones." : "Reconoce cómo se organiza un texto y sigue sus ideas hasta sintetizarlo."}</p>

    <nav className="level-tabs" aria-label="Niveles de la ruta">
      {(["1.1", "1.2", "1.3", "1.4"] as const).map(level => {
        const unlocked = level === "1.1" || level === "1.2" && Boolean(integration?.passed) || level === "1.3" && Boolean(paragraphIntegration?.passed);
        return <button key={level} type="button" className={currentTab === level ? "level-tab current" : "level-tab"} aria-current={currentTab === level ? "step" : undefined} disabled={!unlocked} onClick={() => setSelectedLevel(level as "1.1" | "1.2" | "1.3")}><strong>{level}</strong><small>{currentTab === level ? "ACTUAL" : unlocked ? "ABRIR" : "PRÓXIMO"}</small></button>;
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
        if (index === 2) return [card, curiousBreak("1.1", 3, completedCount >= 3, rotatingKind("sequence", "relevance"))];
        if (index !== 0) return card;
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

    </> : currentTab === "1.2" ? <>
      <div className="route-level-title"><div><span>MI RUTA · NIVEL 1.2</span><h2>Una habilidad a la vez.</h2></div><small>4 lecciones + comprobación</small></div>
      <ol className="route-steps" aria-label="Lecciones del nivel 1.2">
        {([
          { code: "2.1", title: "Di de qué trata el párrafo", detail: "Distingue la idea completa del tema o un detalle.", completed: paragraphFirstCompleted, available: true },
          { code: "2.2", title: "Separa idea y apoyo", detail: "Encuentra el dato que sostiene una idea.", completed: paragraphSecondCompleted, available: paragraphFirstCompleted },
          { code: "2.3", title: "Conecta oraciones", detail: "Sigue a quién o a qué se refiere cada frase.", completed: paragraphThirdCompleted, available: paragraphSecondCompleted },
          { code: "2.4", title: "Conserva la esencia", detail: "Resume un párrafo sin copiar detalles secundarios.", completed: paragraphFourthCompleted, available: paragraphThirdCompleted },
        ] as const).flatMap((lesson, index) => { const card = <li key={lesson.code} className={`route-step ${lesson.completed ? "route-step-completed" : lesson.available ? "route-step-current" : "route-step-locked"}`}>
          <span className="route-step-marker" aria-hidden="true">{lesson.completed ? "✓" : lesson.available ? "○" : "🔒"}</span>
          <div className="route-step-copy"><span>NIVEL 1.2 · LECCIÓN {index+1}</span><strong>{lesson.title}</strong><small>{activeLessonCode === lesson.code ? `En curso · paso ${activeStep} de 6` : lesson.completed ? "Completada · podrás practicarla de nuevo" : lesson.available ? lesson.detail : index === 3 ? "Próximamente" : `Completa la lección ${index}`}</small></div>
          {lesson.available ? <button className={`route-step-action ${lesson.completed ? "route-step-action-optional" : ""}`} onClick={() => onStart(lesson.code)}>{activeLessonCode === lesson.code ? "Seguir" : lesson.completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button> : <span className="route-step-status">Próximamente</span>}
        </li>; return index === 0 ? [card, curiousBreak("1.2", 1, Boolean(paragraphFirstCompleted), rotatingKind("main_idea", "find_data"))] : index === 2 ? [card, curiousBreak("1.2", 3, Boolean(paragraphThirdCompleted), rotatingKind("relevance", "sequence"))] : [card]; })}
      </ol>
      <div className={`route-closure ${paragraphIntegration?.passed ? "route-closure-passed" : ""}`}>
        <span className="eyebrow">NIVEL 1.2 · COMPROBACIÓN</span>
        <strong>Comprende párrafos nuevos</strong>
        <p>{paragraphIntegration?.passed ? `Comprobado: ${paragraphIntegration.correct}/6 al primer intento, con idea, apoyo, referentes y resumen.` : paragraphIntegration?.attempted ? `Ronda realizada: ${paragraphIntegration.correct}/6 al primer intento. ${paragraphIntegration.missing.length ? `Practica ${paragraphIntegration.missing.map(skill => ({ paragraph_main_idea: "idea principal", paragraph_support: "apoyo", paragraph_reference: "referentes", paragraph_summary: "resumen" })[skill as "paragraph_main_idea" | "paragraph_support" | "paragraph_reference" | "paragraph_summary"] ?? skill).join(", ")} y prueba otra variante.` : "Practica una ronda de seis párrafos inéditos para demostrar idea principal, apoyo, referentes y resumen."}` : "Seis párrafos inéditos para comprobar idea principal, apoyo, referentes y resumen."}</p>
        {paragraphFourthCompleted ? <button className="mission-launch" onClick={() => onStart("2.C")}>{activeLessonCode === "2.C" ? `Seguir · paso ${activeStep} de 6` : paragraphIntegration?.passed ? "Practicar otra variante" : paragraphIntegration?.attempted ? "Probar otra variante" : "Comenzar comprobación"}</button> : <small>Se abre al completar la lección 4.</small>}
      </div>
      {paragraphIntegration?.passed && <div className="route-anchor"><span className="eyebrow">SIGUIENTE · NIVEL 1.3</span><strong>Tu siguiente nivel está abierto</strong><p>Cuatro lecciones te llevarán del párrafo al texto completo. También puedes medir velocidad y comprensión en una lectura comparable.</p><button className="mission-launch" onClick={() => setSelectedLevel("1.3")}>Ver nivel 1.3</button></div>}
    </> : <>
      <div className="route-level-title"><div><span>MI RUTA · NIVEL 1.3</span><h2>Del párrafo al texto completo.</h2></div><small>4 lecciones + comprobación</small></div>
      <ol className="route-steps" aria-label="Lecciones del nivel 1.3">{([
        { code: "3.1", title: "Reconoce la estructura", detail: "Ubica el planteamiento, el desarrollo y el resultado.", completed: textCompleted.includes("3.1"), available: true },
        { code: "3.2", title: "Conecta ideas entre párrafos", detail: "Sigue causas, consecuencias y referentes de una parte a otra.", completed: textCompleted.includes("3.2"), available: textCompleted.includes("3.1") },
        { code: "3.3", title: "Sigue un argumento", detail: "Distingue propuesta, evidencia y límites.", completed: textCompleted.includes("3.3"), available: textCompleted.includes("3.2") },
        { code: "3.4", title: "Sintetiza un texto completo", detail: "Conserva la idea central y sus resultados sin añadir datos.", completed: textCompleted.includes("3.4"), available: textCompleted.includes("3.3") },
      ] as const).flatMap((lesson,index) => { const card = <li key={lesson.code} className={`route-step ${lesson.completed ? "route-step-completed" : lesson.available ? "route-step-current" : "route-step-locked"}`}><span className="route-step-marker" aria-hidden="true">{lesson.completed ? "✓" : lesson.available ? "○" : "🔒"}</span><div className="route-step-copy"><span>NIVEL 1.3 · LECCIÓN {index+1}</span><strong>{lesson.title}</strong><small>{activeLessonCode === lesson.code ? `En curso · paso ${activeStep} de 6` : lesson.completed ? "Completada · podrás practicarla de nuevo" : lesson.available ? lesson.detail : `Completa la lección ${index}`}</small></div>{lesson.available ? <button className={`route-step-action ${lesson.completed ? "route-step-action-optional" : ""}`} onClick={() => onStart(lesson.code)}>{activeLessonCode === lesson.code ? "Seguir" : lesson.completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button> : <span className="route-step-status">Próximamente</span>}</li>; return index === 0 ? [card, curiousBreak("1.3", 1, lesson.completed, rotatingKind("find_data", "main_idea"))] : index === 2 ? [card, curiousBreak("1.3", 3, lesson.completed, rotatingKind("sequence", "relevance"))] : [card]; })}</ol>
      <div className={`route-closure ${textIntegration?.passed ? "route-closure-passed" : ""}`}><span className="eyebrow">NIVEL 1.3 · COMPROBACIÓN</span><strong>Comprende textos nuevos</strong><p>{textIntegration?.passed ? `Comprobado: ${textIntegration.correct}/6 al primer intento, con estructura, conexiones, argumento y síntesis.` : textIntegration?.attempted ? `Ronda realizada: ${textIntegration.correct}/6. ${textIntegration.missing.length ? "Repasa las habilidades que faltaron y prueba otra variante." : "Prueba otra variante para lograr al menos cinco aciertos."}` : "Seis preguntas sobre textos nuevos para comprobar las cuatro habilidades."}</p>{textCompleted.includes("3.4") ? <button className="mission-launch" onClick={() => onStart("3.C")}>{activeLessonCode === "3.C" ? `Seguir · paso ${activeStep} de 6` : textIntegration?.passed ? "Practicar otra variante" : textIntegration?.attempted ? "Probar otra variante" : "Comenzar comprobación"}</button> : <small>Se abre al completar la lección 4.</small>}</div>
      <div className="route-anchor"><span className="eyebrow">LECTURA COMPARABLE</span><strong>Observa tu velocidad y comprensión</strong><p>Lee un texto completo nuevo de la misma serie para comparar tus resultados.</p>{calibration?.nextArticleId ? <button className="mission-launch" onClick={() => onReadAnchor(calibration.nextArticleId!)}>Leer texto comparable {Math.min(3, (calibration.count ?? 0) + 1)} de 3</button> : calibration?.count !== undefined && calibration.count >= 3 ? <span className="route-calibration-done">✓ Ya tienes tres lecturas comparables. Consulta tu velocidad de referencia en Home.</span> : <button className="mission-launch" onClick={onExploreReading}>Elegir lectura</button>}</div>
    </>}
  </section>;
}
