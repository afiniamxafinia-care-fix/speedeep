"use client";

import { useEffect, useState } from "react";

type Case = { step: number; role: "probe" | "guided" | "transfer"; sentence: string; question: string; options: string[] };
type State = { attemptId: string; status: "active" | "completed"; variant: string; case?: Case; retryPending?: boolean; priorFeedback?: string | null; transferCorrect?: number };
type Feedback = { feedback: string; correct: boolean; retryNeeded: boolean; completed: boolean; transferCorrect: number | null };

export default function MissionOne({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/lesson", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir la misión.");
      setState(data); setFeedback(null); setChosen(null);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo abrir la misión."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/lesson", { signal: controller.signal, cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir la misión.");
      return data as State;
    }).then(data => { if (!controller.signal.aborted) setState(data); })
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "No se pudo abrir la misión."); });
    return () => controller.abort();
  }, []);

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
      setState(current => current ? { ...current, status: "completed", transferCorrect: feedback.transferCorrect ?? 0 } : current);
      setFeedback(null); setChosen(null);
    } else void load();
  }

  const current = state?.case;
  return <div className="sheet-backdrop library-backdrop" onClick={onClose}><section className="profile-sheet library-sheet" role="dialog" aria-modal="true" aria-labelledby="mission-title" onClick={event => event.stopPropagation()}>
    <button className="sheet-close" onClick={onClose} aria-label="Cerrar misión">×</button>
    <p className="eyebrow">BLOQUE 1 · MISIÓN 1.1</p><h2 id="mission-title">Conserva la acción central</h2>
    {!state && !error && <p className="practice-instructions" role="status">Preparando tu misión…</p>}
    {state?.status === "completed" ? <>
      <p className="practice-instructions">Identificaste la acción central {state.transferCorrect} de 2 veces en el primer intento de las oraciones nuevas. Tu sesión quedó guardada.</p>
      <p className="answer-feedback">{state.transferCorrect === 2 ? "Buen comienzo. El dominio requiere más casos nuevos y recuperación en otra sesión." : "Vuelve a practicar. En la próxima sesión encontrarás oraciones distintas para comprobar tu avance."}</p>
      <p className="practice-instructions">Este resultado no certifica la habilidad ni desbloquea todavía la 1.2.</p>
      <button className="primary-cta" onClick={onClose}>Volver a la ruta</button>
    </> : current && <>
      <p className="practice-instructions">{current.role === "probe" ? "Descubre quién hizo qué, incluso con detalles en medio." : current.role === "guided" ? "Observa el orden y la negación. Si fallas, vuelve a intentarlo con una pista." : "Aplica lo aprendido en una oración nueva sin pistas previas."}</p>
      <div className="mission-progress">{current.role === "probe" ? "Primer intento" : current.role === "guided" ? "Práctica con corrección" : "Aplicación sin ayuda"} · {current.step} de 6</div>
      <div className="passage exercise-context">{current.sentence}</div>
      <p className="form-label">{current.question}</p>
      <div className="answer-list">{current.options.map((option, index) => <button key={`${current.step}-${index}`} className={`answer-option ${chosen === index ? "chosen" : ""}`} disabled={busy || chosen !== null} onClick={() => { void choose(index); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
      {state.retryPending && !feedback && <p className="practice-instructions" role="status">{state.priorFeedback} Inténtalo otra vez.</p>}
      {feedback && <><p className="answer-feedback" role="status">{feedback.feedback}</p><button className="primary-cta practice-action" onClick={next}>{feedback.retryNeeded ? "Volver a intentar" : "Continuar"}</button></>}
    </>}
    {error && <><p className="inline-error" role="alert">{error}</p>{!state && <button className="secondary-action" onClick={() => { void load(); }}>Reintentar</button>}</>}
  </section></div>;
}
