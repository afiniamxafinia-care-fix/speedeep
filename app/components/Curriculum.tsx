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
  onStart: (code: "1.1" | "1.2" | "1.3" | "1.4" | "1.C" | "2.1" | "2.2" | "2.3" | "2.4" | "2.C" | "3.1" | "3.2" | "3.3" | "3.4" | "3.C" | "4.1" | "4.2" | "4.3" | "4.4" | "4.C") => void;
  onDiagnostic: () => void;
  onFlash: () => void;
  onCuriousPractice: (kind: PracticeKind, level: "1.1" | "1.2" | "1.3" | "1.4", after: 1 | 3) => void;
  diagnosticStatus?: "not_started" | "active" | "completed";
  diagnosticStep?: number | null;
  activeStep?: number | null;
  activeLessonCode?: string | null;
  completedCount?: number;
  lessonTransferScores?: Record<string, number>;
  lessonBestTransferScores?: Record<string, number>;
  sentenceActionState?: "not_started" | "completed" | "demonstrated";
  integration?: { attempted: boolean; passed: boolean; correct: number | null };
  paragraphFirstCompleted?: boolean;
  paragraphSecondCompleted?: boolean;
  paragraphThirdCompleted?: boolean;
  paragraphFourthCompleted?: boolean;
  paragraphIntegration?: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] };
  textCompleted?: string[];
  textIntegration?: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] };
  monitorCompleted?: string[];
  monitorIntegration?: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] };
  curiousRotation?: number;
};

export default function Curriculum({ onStart, onDiagnostic, onFlash, onCuriousPractice, diagnosticStatus, diagnosticStep, activeStep, activeLessonCode, completedCount = 0, lessonTransferScores = {}, lessonBestTransferScores = {}, sentenceActionState, integration, paragraphFirstCompleted, paragraphSecondCompleted, paragraphThirdCompleted, paragraphFourthCompleted, paragraphIntegration, textCompleted = [], textIntegration, monitorCompleted = [], monitorIntegration, curiousRotation = 0 }: Props) {
  const practicedFirst = completedCount > 0;
  const [selectedLevel, setSelectedLevel] = useState<"1.1" | "1.2" | "1.3" | "1.4" | null>(null);
  const currentTab = selectedLevel ?? (textIntegration?.passed ? "1.4" : paragraphIntegration?.passed ? "1.3" : integration?.passed ? "1.2" : "1.1");
  const levelUnlocked = (level: "1.1" | "1.2" | "1.3" | "1.4") => level === "1.1" || level === "1.2" && Boolean(integration?.passed) || level === "1.3" && Boolean(paragraphIntegration?.passed) || level === "1.4" && Boolean(textIntegration?.passed);
  const levelCompleted = currentTab === "1.1" ? completedCount : currentTab === "1.2" ? [paragraphFirstCompleted, paragraphSecondCompleted, paragraphThirdCompleted, paragraphFourthCompleted].filter(Boolean).length : currentTab === "1.3" ? textCompleted.length : monitorCompleted.length;
  const rotatingKind = (first: PracticeKind, second: PracticeKind) => curiousRotation % 2 === 0 ? first : second;
  const curiousBreak = (level: "1.1" | "1.2" | "1.3" | "1.4", after: 1 | 3, available: boolean, kind: PracticeKind) => <li key={`${level}-curious-${after}`} className={`route-break ${available ? "route-break-ready" : "route-break-waiting"}`}>
    <span className="route-break-icon" aria-hidden="true">✦</span><div><span>PAUSA CURIOSA · DESPUÉS DE LA LECCIÓN {after}</span><strong>{({ main_idea: "Idea principal", sequence: "Secuencias", find_data: "Busca el dato", relevance: "Lo relevante", reading: "Lectura" } as const)[kind]}</strong><small>Reto breve con ejercicios variables. Su resultado se guarda en Prácticas; es opcional para avanzar.</small></div>
    <button disabled={!available} onClick={() => onCuriousPractice(kind, level, after)}>{available ? "Jugar" : `Al completar ${after}`}</button>
  </li>;
  return <section className="section-page learning-route" aria-labelledby="route-heading">
    <p className="eyebrow">TU RUTA DE APRENDIZAJE</p>
    <h1 id="route-heading">{currentTab === "1.1" ? currentLevel.title : currentTab === "1.2" ? "Construir la idea del párrafo" : currentTab === "1.3" ? "Relacionar partes de un texto" : "Monitorea tu comprensión"}</h1>
    <p>{currentTab === "1.1" ? currentLevel.mission : currentTab === "1.2" ? "Encuentra la idea, el apoyo y las conexiones entre las oraciones." : currentTab === "1.3" ? "Reconoce cómo se organiza un texto y sigue sus ideas hasta sintetizarlo." : "Nota cuándo se rompe el sentido y aprende a recuperar el hilo."}</p>

    <div className="route-progress-head"><strong>Nivel {currentTab}</strong><span>{levelCompleted}/4 lecciones</span><div role="progressbar" aria-label={`Lecciones completadas del nivel ${currentTab}`} aria-valuenow={levelCompleted} aria-valuemin={0} aria-valuemax={4}><i style={{ width: `${Math.min(4, levelCompleted) * 25}%` }}/></div></div>
    {monitorIntegration?.passed && <div className="route-consolidated"><strong>✓ Nivel 1 consolidado</strong><span>Los subniveles 1.1 a 1.4 permanecen disponibles para repasar.</span></div>}

    <nav className="level-tabs" aria-label="Niveles de la ruta">
      {(["1.1", "1.2", "1.3", "1.4"] as const).map(level => {
        const unlocked = levelUnlocked(level);
        return <button key={level} type="button" className={currentTab === level ? "level-tab current" : "level-tab"} aria-current={currentTab === level ? "step" : undefined} aria-label={`Nivel ${level}: ${unlocked ? "disponible" : "vista previa, actividades bloqueadas"}`} onClick={() => setSelectedLevel(level)}><strong>{level}</strong><small>{currentTab === level ? "VIENDO" : unlocked ? "ABRIR" : "VISTA PREVIA"}</small></button>;
      })}
    </nav>
    {!levelUnlocked(currentTab) && <p className="route-preview">Puedes explorar las habilidades de este nivel. Sus actividades se abrirán al aprobar la comprobación anterior.</p>}

    {currentTab === "1.1" ? <>

    <div className="route-notice route-intro">
      <strong>{diagnosticStatus === "completed" ? "Tu punto de partida está listo" : "Empieza por descubrir tu punto de partida"}</strong>
      {diagnosticStatus !== "completed" && <span>{diagnosticStatus === "active" ? `Vas en la pregunta ${diagnosticStep ?? 1} de 10; puedes retomarla aquí o desde Home.` : "Dos lecturas breves orientan tu ruta. Puedes empezar aquí o desde Home."}</span>}
      <button className="mission-launch diagnostic-launch" onClick={onDiagnostic}>{diagnosticStatus === "completed" ? "Ver diagnóstico" : diagnosticStatus === "active" ? `Retomar · pregunta ${diagnosticStep ?? 1}/10` : "Hacer diagnóstico"}</button>
    </div>



    <div className="route-level-title">
      <div><span>MI RUTA</span><h2>Una habilidad a la vez.</h2></div>
      <small>{currentLevel.lessons.length} lecciones + comprobación</small>
    </div>
    <p className="route-state-guide"><span><i className="route-state-dot route-state-dot-current"/> En curso</span><span><i className="route-state-dot route-state-dot-completed"/> Completada</span><span><i className="route-state-dot route-state-dot-locked"/> Próximamente</span></p>

    <ol className="route-steps" aria-label={`Lecciones de ${currentLevel.label}`}>
      {currentLevel.lessons.map((lesson, index) => {
        const available = index === 0 || (lessonBestTransferScores[`1.${index}`] ?? -1) >= 1;
        const code = `1.${index+1}` as "1.1" | "1.2" | "1.3" | "1.4";
        const score = lessonTransferScores[code];
        const inProgress = activeLessonCode === code && activeStep;
        const completed = available && index < completedCount && !inProgress;
        const card = <li key={lesson.title} className={`route-step ${completed ? "route-step-completed" : available ? "route-step-current" : "route-step-locked"}`}>
          <span className="route-step-marker" aria-hidden="true">{completed ? "✓" : available ? "○" : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}</span>
          <div className="route-step-copy">
            <span>{available && !completed ? "LECCIÓN ACTUAL · " : ""}{currentLevel.label.toUpperCase()} · LECCIÓN {index + 1}</span>
            <strong>{lesson.title}</strong>
            <small>{available ? inProgress ? `En curso · paso ${activeStep} de 6` : completed && score === 0 ? "Terminada · 0/2 en casos nuevos. Refuerza con otra variante." : code === "1.1" && sentenceActionState === "demonstrated" ? "Habilidad demostrada con oraciones nuevas y recuperación posterior" : completed ? `Completada · ${score ?? 0}/2 en casos nuevos${score === 1 ? "; conviene reforzar" : ""}` : lesson.description : `Resuelve al menos un caso nuevo de la lección ${index} para abrirla`}</small>
          </div>
          {available ? <button className={`route-step-action ${completed ? "route-step-action-optional" : ""}`} aria-label={`${inProgress ? "Retomar" : completed ? "Practicar de nuevo, opcional" : "Abrir"} lección ${index+1}: ${lesson.title}`} onClick={() => onStart(code)}>{inProgress ? "Seguir" : completed && score !== 2 ? "Reforzar" : completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button>
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
      {(lessonBestTransferScores["1.4"] ?? -1) >= 1 ? <button className="mission-launch" onClick={() => onStart("1.C")}>{activeLessonCode === "1.C" ? `Seguir · paso ${activeStep} de 6` : integration?.passed ? "Practicar otra variante" : integration?.attempted ? "Probar otra variante" : "Comenzar comprobación"}</button>
        : <small>Se abre al resolver al menos un caso nuevo de la lección 4.</small>}
    </div>

    </> : currentTab === "1.2" ? <>
      <div className="route-level-title"><div><span>MI RUTA · NIVEL 1.2</span><h2>Una habilidad a la vez.</h2></div><small>4 lecciones + comprobación</small></div>
      <ol className="route-steps" aria-label="Lecciones del nivel 1.2">
        {([
          { code: "2.1", title: "Di de qué trata el párrafo", detail: "Distingue la idea completa del tema o un detalle.", completed: paragraphFirstCompleted, available: Boolean(integration?.passed) },
          { code: "2.2", title: "Separa idea y apoyo", detail: "Encuentra el dato que sostiene una idea.", completed: paragraphSecondCompleted, available: (lessonBestTransferScores["2.1"] ?? -1) >= 1 },
          { code: "2.3", title: "Conecta oraciones", detail: "Sigue a quién o a qué se refiere cada frase.", completed: paragraphThirdCompleted, available: (lessonBestTransferScores["2.2"] ?? -1) >= 1 },
          { code: "2.4", title: "Conserva la esencia", detail: "Resume un párrafo sin copiar detalles secundarios.", completed: paragraphFourthCompleted, available: (lessonBestTransferScores["2.3"] ?? -1) >= 1 },
        ] as const).flatMap((lesson, index) => { const score = lessonTransferScores[lesson.code]; const card = <li key={lesson.code} className={`route-step ${lesson.completed ? "route-step-completed" : lesson.available ? "route-step-current" : "route-step-locked"}`}>
          <span className="route-step-marker" aria-hidden="true">{lesson.completed ? "✓" : lesson.available ? "○" : "🔒"}</span>
          <div className="route-step-copy"><span>NIVEL 1.2 · LECCIÓN {index+1}</span><strong>{lesson.title}</strong><small>{activeLessonCode === lesson.code ? `En curso · paso ${activeStep} de 6` : lesson.completed ? `Completada · ${score ?? 0}/2 en casos nuevos${score === 2 ? "" : "; refuerza con otra variante"}` : lesson.available ? lesson.detail : index === 0 ? "Se abre al aprobar la comprobación anterior." : `Resuelve al menos un caso nuevo de la lección ${index}`}</small></div>
          {lesson.available ? <button className={`route-step-action ${lesson.completed ? "route-step-action-optional" : ""}`} onClick={() => onStart(lesson.code)}>{activeLessonCode === lesson.code ? "Seguir" : lesson.completed && score !== 2 ? "Reforzar" : lesson.completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button> : <span className="route-step-status">Próximamente</span>}
        </li>; return index === 0 ? [card, curiousBreak("1.2", 1, Boolean(paragraphFirstCompleted), rotatingKind("main_idea", "find_data"))] : index === 2 ? [card, curiousBreak("1.2", 3, Boolean(paragraphThirdCompleted), rotatingKind("relevance", "sequence"))] : [card]; })}
      </ol>
      <div className={`route-closure ${paragraphIntegration?.passed ? "route-closure-passed" : ""}`}>
        <span className="eyebrow">NIVEL 1.2 · COMPROBACIÓN</span>
        <strong>Comprende párrafos nuevos</strong>
        <p>{paragraphIntegration?.passed ? `Comprobado: ${paragraphIntegration.correct}/6 al primer intento, con idea, apoyo, referentes y resumen.` : paragraphIntegration?.attempted ? `Ronda realizada: ${paragraphIntegration.correct}/6 al primer intento. ${paragraphIntegration.missing.length ? `Practica ${paragraphIntegration.missing.map(skill => ({ paragraph_main_idea: "idea principal", paragraph_support: "apoyo", paragraph_reference: "referentes", paragraph_summary: "resumen" })[skill as "paragraph_main_idea" | "paragraph_support" | "paragraph_reference" | "paragraph_summary"] ?? skill).join(", ")} y prueba otra variante.` : "Practica una ronda de seis párrafos inéditos para demostrar idea principal, apoyo, referentes y resumen."}` : "Seis párrafos inéditos para comprobar idea principal, apoyo, referentes y resumen."}</p>
        {(lessonBestTransferScores["2.4"] ?? -1) >= 1 ? <button className="mission-launch" onClick={() => onStart("2.C")}>{activeLessonCode === "2.C" ? `Seguir · paso ${activeStep} de 6` : paragraphIntegration?.passed ? "Practicar otra variante" : paragraphIntegration?.attempted ? "Probar otra variante" : "Comenzar comprobación"}</button> : <small>Se abre al resolver al menos un caso nuevo de la lección 4.</small>}
      </div>
      {paragraphIntegration?.passed && <div className="route-anchor"><span className="eyebrow">SIGUIENTE · NIVEL 1.3</span><strong>Tu siguiente nivel está abierto</strong><p>Cuatro lecciones te llevarán del párrafo al texto completo.</p><button className="mission-launch" onClick={() => setSelectedLevel("1.3")}>Ver nivel 1.3</button></div>}
    </> : currentTab === "1.3" ? <>
      <div className="route-level-title"><div><span>MI RUTA · NIVEL 1.3</span><h2>Del párrafo al texto completo.</h2></div><small>4 lecciones + comprobación</small></div>
      <ol className="route-steps" aria-label="Lecciones del nivel 1.3">{([
          { code: "3.1", title: "Reconoce la estructura", detail: "Ubica el planteamiento, el desarrollo y el resultado.", completed: textCompleted.includes("3.1"), available: Boolean(paragraphIntegration?.passed) },
        { code: "3.2", title: "Conecta ideas entre párrafos", detail: "Sigue causas, consecuencias y referentes de una parte a otra.", completed: textCompleted.includes("3.2"), available: textCompleted.includes("3.1") },
        { code: "3.3", title: "Sigue un argumento", detail: "Distingue propuesta, evidencia y límites.", completed: textCompleted.includes("3.3"), available: textCompleted.includes("3.2") },
        { code: "3.4", title: "Sintetiza un texto completo", detail: "Conserva la idea central y sus resultados sin añadir datos.", completed: textCompleted.includes("3.4"), available: textCompleted.includes("3.3") },
      ] as const).flatMap((lesson,index) => { const card = <li key={lesson.code} className={`route-step ${lesson.completed ? "route-step-completed" : lesson.available ? "route-step-current" : "route-step-locked"}`}><span className="route-step-marker" aria-hidden="true">{lesson.completed ? "✓" : lesson.available ? "○" : "🔒"}</span><div className="route-step-copy"><span>NIVEL 1.3 · LECCIÓN {index+1}</span><strong>{lesson.title}</strong><small>{activeLessonCode === lesson.code ? `En curso · paso ${activeStep} de 6` : lesson.completed ? "Completada · podrás practicarla de nuevo" : lesson.available ? lesson.detail : index === 0 ? "Se abre al aprobar la comprobación anterior." : `Completa la lección ${index}`}</small></div>{lesson.available ? <button className={`route-step-action ${lesson.completed ? "route-step-action-optional" : ""}`} onClick={() => onStart(lesson.code)}>{activeLessonCode === lesson.code ? "Seguir" : lesson.completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button> : <span className="route-step-status">Próximamente</span>}</li>; return index === 0 ? [card, curiousBreak("1.3", 1, lesson.completed, rotatingKind("find_data", "main_idea"))] : index === 2 ? [card, curiousBreak("1.3", 3, lesson.completed, rotatingKind("sequence", "relevance"))] : [card]; })}</ol>
      <div className={`route-closure ${textIntegration?.passed ? "route-closure-passed" : ""}`}><span className="eyebrow">NIVEL 1.3 · COMPROBACIÓN</span><strong>Comprende textos nuevos</strong><p>{textIntegration?.passed ? `Comprobado: ${textIntegration.correct}/6 al primer intento, con estructura, conexiones, argumento y síntesis.` : textIntegration?.attempted ? `Ronda realizada: ${textIntegration.correct}/6. ${textIntegration.missing.length ? "Repasa las habilidades que faltaron y prueba otra variante." : "Prueba otra variante para lograr al menos cinco aciertos."}` : "Seis preguntas sobre textos nuevos para comprobar las cuatro habilidades."}</p>{textCompleted.includes("3.4") ? <button className="mission-launch" onClick={() => onStart("3.C")}>{activeLessonCode === "3.C" ? `Seguir · paso ${activeStep} de 6` : textIntegration?.passed ? "Practicar otra variante" : textIntegration?.attempted ? "Probar otra variante" : "Comenzar comprobación"}</button> : <small>Se abre al completar la lección 4.</small>}</div>
      {textIntegration?.passed && <div className="route-anchor"><span className="eyebrow">SIGUIENTE · NIVEL 1.4</span><strong>Tu siguiente nivel está abierto</strong><p>Empieza por detectar cuándo un texto deja de tener sentido.</p><button className="mission-launch" onClick={() => setSelectedLevel("1.4")}>Ver nivel 1.4</button></div>}
    </> : <>
      <div className="route-level-title"><div><span>MI RUTA · NIVEL 1.4</span><h2>Recupera el hilo cuando haga falta.</h2></div><small>4 lecciones + comprobación</small></div>
      <ol className="route-steps" aria-label="Lecciones del nivel 1.4">{([
        { code: "4.1", title: "Detecta cuándo se pierde el sentido", detail: "Distingue una contradicción real de datos compatibles.", completed: monitorCompleted.includes("4.1"), available: Boolean(textIntegration?.passed) },
        { code: "4.2", title: "Elige cómo reparar", detail: "Decide qué volver a leer o aclarar.", completed: monitorCompleted.includes("4.2"), available: monitorCompleted.includes("4.1") },
        { code: "4.3", title: "Vuelve con un propósito", detail: "Busca la evidencia precisa.", completed: monitorCompleted.includes("4.3"), available: monitorCompleted.includes("4.2") },
        { code: "4.4", title: "Recupera el foco", detail: "Retoma la última idea tras una pausa.", completed: monitorCompleted.includes("4.4"), available: monitorCompleted.includes("4.3") },
      ] as const).flatMap((lesson,index) => { const card = <li key={lesson.code} className={`route-step ${lesson.completed ? "route-step-completed" : lesson.available ? "route-step-current" : "route-step-locked"}`}><span className="route-step-marker" aria-hidden="true">{lesson.completed ? "✓" : lesson.available ? "○" : "🔒"}</span><div className="route-step-copy"><span>NIVEL 1.4 · LECCIÓN {index+1}</span><strong>{lesson.title}</strong><small>{activeLessonCode === lesson.code ? `En curso · paso ${activeStep} de 6` : lesson.completed ? "Completada · puedes practicarla de nuevo" : lesson.available ? lesson.detail : index === 0 ? "Se abre al aprobar la comprobación anterior." : `Completa la lección ${index}`}</small></div>{lesson.available ? <button className={`route-step-action ${lesson.completed ? "route-step-action-optional" : ""}`} onClick={() => onStart(lesson.code)}>{activeLessonCode === lesson.code ? "Seguir" : lesson.completed ? "Practicar" : "Empezar"}<span aria-hidden="true">→</span></button> : <span className="route-step-status">Próximamente</span>}</li>; return index === 0 ? [card, curiousBreak("1.4", 1, lesson.completed, rotatingKind("relevance", "find_data"))] : index === 2 ? [card, curiousBreak("1.4", 3, lesson.completed, rotatingKind("sequence", "main_idea"))] : [card]; })}</ol>
      <div className={`route-closure ${monitorIntegration?.passed ? "route-closure-passed" : ""}`}><span className="eyebrow">NIVEL 1.4 · COMPROBACIÓN</span><strong>Recupera el sentido en textos nuevos</strong><p>{monitorIntegration?.passed ? `Comprobado: ${monitorIntegration.correct}/6 al primer intento, con detección, reparación, búsqueda y retoma.` : monitorIntegration?.attempted ? `Ronda realizada: ${monitorIntegration.correct}/6. ${monitorIntegration.missing.length ? "Repasa las habilidades que faltaron y prueba otra variante." : "Prueba otra variante para lograr al menos cinco aciertos."}` : "Seis casos nuevos para aplicar las cuatro habilidades sin pistas."}</p>{monitorCompleted.includes("4.4") ? <button className="mission-launch" onClick={() => onStart("4.C")}>{activeLessonCode === "4.C" ? `Seguir · paso ${activeStep} de 6` : monitorIntegration?.passed ? "Practicar otra variante" : monitorIntegration?.attempted ? "Probar otra variante" : "Comenzar comprobación"}</button> : <small>Se abre al completar la lección 4.</small>}</div>
    </>}
  </section>;
}
