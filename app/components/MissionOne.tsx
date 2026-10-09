"use client";

import { useEffect, useRef, useState } from "react";

type Case = { step: number; role: "probe" | "guided" | "transfer"; sentence: string; question: string; options: string[] };
type State = { attemptId: string; status: "active" | "completed"; variant: string; case?: Case; group?: Case[]; retryPending?: boolean; priorFeedback?: string | null; transferCorrect?: number; integrationPassed?: boolean | null };
type Feedback = { feedback: string; correct: boolean; retryNeeded: boolean; completed: boolean; transferCorrect: number | null; integrationPassed?: boolean | null };

export default function MissionOne({ lessonCode, onClose }: { lessonCode: "1.1" | "1.2" | "1.3" | "1.4" | "1.C" | "2.1" | "2.2" | "2.3" | "2.4" | "2.C" | "3.1" | "3.2" | "3.3" | "3.4" | "3.C" | "4.1" | "4.2" | "4.3" | "4.4" | "4.C"; onClose: () => void }) {
  const [state, setState] = useState<State | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readForRecall, setReadForRecall] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [state?.case?.step, state?.attemptId, state?.retryPending]);

  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/lesson?lessonCode=${lessonCode}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir la misión.");
      setState(data); setFeedback(null); setChosen(null); setReadForRecall(false);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo abrir la misión."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lesson?lessonCode=${lessonCode}`, { signal: controller.signal, cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir la misión.");
      return data as State;
    }).then(data => { if (!controller.signal.aborted) setState(data); })
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "No se pudo abrir la misión."); });
    return () => controller.abort();
  }, [lessonCode]);

  async function choose(index: number) {
    if (!state?.case || busy || chosen !== null) return;
    setChosen(index); setBusy(true); setError("");
    try {
      const response = await fetch("/api/lesson", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: state.attemptId, index }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la respuesta.");
      setFeedback(data);
    } catch (err) { setChosen(null); setError(err instanceof Error ? err.message : "No se pudo guardar la respuesta."); }
    finally { setBusy(false); }
  }

  function next() {
    if (!feedback) return;
    if (feedback.retryNeeded) {
      setState(current => current ? { ...current, retryPending: true, priorFeedback: feedback.feedback } : current);
      setFeedback(null); setChosen(null);
    } else if (feedback.completed) {
      setState(current => current ? { ...current, status: "completed", transferCorrect: feedback.transferCorrect ?? 0, integrationPassed: feedback.integrationPassed } : current);
      setFeedback(null); setChosen(null);
    } else void load();
  }

  const current = state?.case;
  const recall = lessonCode === "4.4" || lessonCode === "4.C" && (current?.step === 4 || current?.step === 6);
  const instruction = lessonCode === "4.C" ? "Aplica las cuatro habilidades sin pistas." : lessonCode === "4.4" ? "Lee y, al ocultar el texto, recupera el hilo." : lessonCode === "4.3" ? "Busca el fragmento preciso para tu propósito." : lessonCode === "4.2" ? "Elige una reparación proporcional a la duda." : lessonCode === "4.1" ? current?.role === "transfer" ? "Decide sin pistas si hay una ruptura real de sentido." : "Comprueba si los datos pueden ser ciertos a la vez." : lessonCode === "3.C" ? "Resuelve con lo que sabes, sin pistas." : lessonCode === "3.1" ? current?.role === "transfer" ? "Ordena hechos y usa el dato vigente en un texto nuevo." : "Sigue las etapas y observa qué información se actualiza." : lessonCode === "3.2" ? current?.role === "transfer" ? "Distingue la causa de una coincidencia en un texto nuevo." : "Compara la medida, la observación y sus límites." : lessonCode === "3.3" ? current?.role === "transfer" ? "Compara posturas y reconoce la excepción sin pistas." : "Distingue en qué coinciden y en qué difieren las propuestas." : lessonCode === "3.4" ? current?.role === "transfer" ? "Concluye solo lo que respaldan las pistas del texto nuevo." : "Separa el dato explícito, la inferencia y lo que no se sabe."
    : lessonCode === "2.C" ? "Resuelve con lo que sabes, sin pistas."
    : lessonCode === "2.4" ? current?.role === "transfer" ? "Resume sin pistas." : "Conserva la idea y elimina detalles secundarios."
    : lessonCode === "2.3" ? current?.step === 1 ? "Recuerda qué hecho sostiene el resultado." : current?.role === "transfer" ? "Sigue la referencia sin pistas." : "Busca a quién o a qué señala esa palabra."
    : lessonCode === "2.2" ? current?.step === 1 ? "Recuerda la idea completa." : current?.role === "transfer" ? "Encuentra el dato que sostiene la idea." : "Busca la prueba concreta, no un detalle suelto."
    : lessonCode === "2.1" ? current?.step === 1 ? "Recuerda qué ocurrió en el párrafo." : current?.role === "transfer" ? "Elige la idea completa sin pistas." : "Distingue la idea de un tema o un detalle."
    : lessonCode === "1.C" ? "Resuelve con lo que sabes, sin pistas."
    : lessonCode === "1.4" ? current?.step === 1 ? "Recuerda qué cambia el conector." : current?.step === 4 || current?.step === 6 ? "Decide si necesitas consultar un dato exacto." : "Usa las pistas de la oración."
    : lessonCode === "1.3"
    ? current?.step === 1 ? "Recuerda la acción central." : current?.step === 2 ? "Agrupa las palabras que van juntas." : current?.role === "transfer" ? "Sigue el cambio de sentido sin pistas." : "Observa qué cambia con el conector."
    : lessonCode === "1.2"
    ? current?.step === 1 ? "Recuerda la acción central." : current?.role === "transfer" ? "Forma una idea completa." : "Encuentra las palabras que van juntas."
    : current?.role === "probe" ? "Encuentra la acción central." : current?.role === "guided" ? "Sigue quién hizo qué." : "Resuelve sin pistas.";
  return <div className="sheet-backdrop library-backdrop" onClick={onClose}><section className="profile-sheet library-sheet mission-sheet" role="dialog" aria-modal="true" aria-labelledby="mission-title" onClick={event => event.stopPropagation()}>
    <header className="mission-header">
      <button className="sheet-close" onClick={onClose} aria-label="Cerrar misión">×</button>
      <p className="eyebrow">{lessonCode.startsWith("4.") ? `NIVEL 1.4 · ${lessonCode === "4.C" ? "COMPROBACIÓN" : `LECCIÓN ${lessonCode.split(".")[1]}`}` : lessonCode.startsWith("3.") ? `NIVEL 1.3 · ${lessonCode === "3.C" ? "COMPROBACIÓN" : `LECCIÓN ${lessonCode.split(".")[1]}`}` : lessonCode.startsWith("2.") ? `NIVEL 1.2 · ${lessonCode === "2.C" ? "COMPROBACIÓN" : `LECCIÓN ${lessonCode.split(".")[1]}`}` : `NIVEL 1.1 · ${lessonCode === "1.C" ? "COMPROBACIÓN" : `LECCIÓN ${lessonCode.split(".")[1]}`}`}</p>
      <h2 id="mission-title">{lessonCode === "4.C" ? "Recupera el sentido" : lessonCode === "4.1" ? "Detecta cuándo se pierde el sentido" : lessonCode === "4.2" ? "Elige cómo reparar" : lessonCode === "4.3" ? "Vuelve con un propósito" : lessonCode === "4.4" ? "Recupera el foco" : lessonCode === "3.C" ? "Comprende textos nuevos" : lessonCode === "3.1" ? "Ordena los hechos" : lessonCode === "3.2" ? "Descubre qué causó el cambio" : lessonCode === "3.3" ? "Compara posturas" : lessonCode === "3.4" ? "Infiere con evidencias" : lessonCode === "1.1" ? "Conserva la acción central" : lessonCode === "1.2" ? "Une palabras que van juntas" : lessonCode === "1.3" ? "Sigue el giro de los conectores" : lessonCode === "1.4" ? "Resuelve vocabulario sin perder el hilo" : lessonCode === "2.1" ? "Di de qué trata el párrafo" : lessonCode === "2.2" ? "Separa idea y apoyo" : lessonCode === "2.3" ? "Conecta oraciones" : lessonCode === "2.4" ? "Conserva la esencia" : lessonCode === "2.C" ? "Comprende párrafos nuevos" : "Comprende oraciones nuevas"}</h2>
      {current && state?.status !== "completed" && <div className="mission-progress">{current.role === "probe" ? "Explora" : current.role === "guided" ? "Practica" : "Aplica"} · {current.step} de 6</div>}
    </header>
    <div className="mission-body" ref={bodyRef}>
      {!state && !error && <p className="practice-instructions" role="status">Preparando la lección…</p>}
      {state?.status === "completed" ? <div className="mission-complete">
        <strong>{lessonCode.endsWith(".C") ? "Ronda terminada" : "Lección completada"}</strong>
        {lessonCode.endsWith(".C") ? <><p>{state.transferCorrect} de 6 respuestas correctas al primer intento.</p><p>{state.integrationPassed ? "Comprobaste las habilidades de este nivel con material nuevo." : "En Ruta verás qué reforzar y podrás probar otra variante."}</p></> : <><p>{state.transferCorrect} de 2 respuestas correctas al primer intento en material nuevo.</p><p>{state.transferCorrect === 2 ? "Volverás a usar esta habilidad más adelante." : "Seguirás practicando esta habilidad con material nuevo."}</p></>}
        <button className="primary-cta" onClick={onClose}>Volver a la ruta</button>
      </div> : current && <>
        <p className="mission-instruction">{instruction}</p>
        {!recall || !readForRecall ? <div className="passage exercise-context">{current.sentence}</div> : <p className="practice-instructions">El texto está oculto. Recupera la última idea y el siguiente objetivo.</p>}
        {recall && !readForRecall ? <button className="primary-cta practice-action" onClick={() => setReadForRecall(true)}>Ya leí · ocultar texto</button> : <>{(state.group?.length ?? 0) > 1 && <div className="mission-question-list"><strong>Preguntas de este texto</strong>{state.group!.map(item => <p key={item.step} className={item.step === current.step ? "current" : ""}><span>{item.step}.</span> {item.question} {item.step > current.step && <small>Al terminar la anterior</small>}</p>)}</div>}<p className="mission-question">{current.question}</p>
        <div className="answer-list">{current.options.map((option, index) => <button key={`${current.step}-${index}`} className={`answer-option ${chosen === index ? "chosen" : ""}`} disabled={busy || chosen !== null} onClick={() => { void choose(index); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></>}
      </>}
    </div>
    {state?.status !== "completed" && <div className="mission-response" aria-live="polite">
      {feedback ? <><p className="answer-feedback">{feedback.feedback}</p><button className="primary-cta" onClick={next}>{feedback.retryNeeded ? "Intentar de nuevo" : "Continuar"}</button></>
        : error ? <><p className="inline-error" role="alert">{error}</p>{!state && <button className="secondary-action" onClick={() => { void load(); }}>Reintentar</button>}</>
        : state?.retryPending ? <p className="mission-response-hint">{state.priorFeedback} Prueba otra vez.</p>
        : <p className="mission-response-hint">{busy ? "Guardando respuesta…" : current ? "Elige una respuesta para continuar." : ""}</p>}
    </div>}
  </section></div>;
}
