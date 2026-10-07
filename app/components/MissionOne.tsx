"use client";

import { useEffect, useState } from "react";

type Case = { step: number; role: "probe" | "guided" | "transfer"; sentence: string; question: string; options: string[] };
type State = { attemptId: string; status: "active" | "completed"; variant: string; case?: Case; retryPending?: boolean; priorFeedback?: string | null; transferCorrect?: number; integrationPassed?: boolean | null };
type Feedback = { feedback: string; correct: boolean; retryNeeded: boolean; completed: boolean; transferCorrect: number | null; integrationPassed?: boolean | null };

export default function MissionOne({ lessonCode, onClose }: { lessonCode: "1.1" | "1.2" | "1.3" | "1.4" | "1.C" | "2.1"; onClose: () => void }) {
  const [state, setState] = useState<State | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/lesson?lessonCode=${lessonCode}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir la misión.");
      setState(data); setFeedback(null); setChosen(null);
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
  const instruction = lessonCode === "2.1" ? current?.step === 1 ? "Recuerda qué ocurrió en el párrafo." : current?.role === "transfer" ? "Elige la idea completa sin pistas." : "Distingue la idea de un tema o un detalle."
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
      <p className="eyebrow">{lessonCode === "2.1" ? "NIVEL 1.2 · LECCIÓN 1" : `NIVEL 1.1 · ${lessonCode === "1.C" ? "COMPROBACIÓN" : `LECCIÓN ${lessonCode.split(".")[1]}`}`}</p>
      <h2 id="mission-title">{lessonCode === "1.1" ? "Conserva la acción central" : lessonCode === "1.2" ? "Une palabras que van juntas" : lessonCode === "1.3" ? "Sigue el giro de los conectores" : lessonCode === "1.4" ? "Resuelve vocabulario sin perder el hilo" : lessonCode === "2.1" ? "Di de qué trata el párrafo" : "Comprende oraciones nuevas"}</h2>
      {current && state?.status !== "completed" && <div className="mission-progress">{current.role === "probe" ? "Explora" : current.role === "guided" ? "Practica" : "Aplica"} · {current.step} de 6</div>}
    </header>
    <div className="mission-body">
      {!state && !error && <p className="practice-instructions" role="status">Preparando la lección…</p>}
      {state?.status === "completed" ? <div className="mission-complete">
        <strong>{lessonCode === "1.C" ? "Ronda terminada" : "Lección completada"}</strong>
        {lessonCode === "1.C" ? <><p>{state.transferCorrect} de 6 respuestas correctas al primer intento.</p><p>{state.integrationPassed ? "Comprobaste las habilidades de este bloque con oraciones nuevas." : "En Ruta puedes practicar y resolver otra ronda con oraciones nuevas."}</p></> : <><p>{state.transferCorrect} de 2 respuestas correctas al primer intento en oraciones nuevas.</p><p>{state.transferCorrect === 2 ? "Volverás a usar esta habilidad más adelante." : "Seguirás practicando esta habilidad con oraciones nuevas."}</p></>}
        <button className="primary-cta" onClick={onClose}>Volver a la ruta</button>
      </div> : current && <>
        <p className="mission-instruction">{instruction}</p>
        <div className="passage exercise-context">{current.sentence}</div>
        <p className="mission-question">{current.question}</p>
        <div className="answer-list">{current.options.map((option, index) => <button key={`${current.step}-${index}`} className={`answer-option ${chosen === index ? "chosen" : ""}`} disabled={busy || chosen !== null} onClick={() => { void choose(index); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
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
