"use client";

import { useEffect, useState } from "react";

type Result = { skills: Record<string, { correct: number; total: number }>; recommendation: string; nextLesson: string;
  confidenceState: "provisional"; calibrationPending: boolean;
  practicePlacement: { readingRange: "beginner" | "intermediate"; recommendedKind: string; focusSkill: string; reason: string } };
type DiagnosticState = {
  attemptId: string; status: "active" | "completed"; item?: number;
  passage?: { number: number; genre: string; title: string; body: string };
  question?: { prompt: string; options: string[] }; result?: Result;
};
const labels: Record<string, string> = {
  explicit: "Encontrar datos", sentence: "Entender la oración", main_idea: "Idea central",
  cause: "Causa y efecto", inference: "Inferir con evidencia",
};

export default function Diagnostic({ onClose, onFinish, onCalibrate }: { onClose: () => void; onFinish: () => void; onCalibrate: () => void }) {
  const [state, setState] = useState<DiagnosticState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<"sure" | "unsure">("sure");
  const [passageVisible, setPassageVisible] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/diagnostic", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudo abrir el diagnóstico.");
        return data as DiagnosticState;
      }).then(data => { if (!controller.signal.aborted) { setState(data); setPassageVisible(data.item === 1 || data.item === 6); } })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo abrir el diagnóstico."); });
    return () => controller.abort();
  }, []);

  async function revealPassage() {
    if (!state || state.status !== "active" || revealing) return;
    setRevealing(true); setError("");
    try {
      const response = await fetch("/api/diagnostic", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reveal", attemptId: state.attemptId, item: state.item }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo mostrar la lectura.");
      if (data.item === state.item) setPassageVisible(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo mostrar la lectura."); }
    finally { setRevealing(false); }
  }

  async function continueDiagnostic() {
    if (!state || selected === null || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: state.attemptId, index: selected, confidence }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la respuesta.");
      setState(data); setSelected(null); setConfidence("sure"); setPassageVisible(data.item === 6);
      if (data.status === "completed") onFinish();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la respuesta."); }
    finally { setBusy(false); }
  }

  return <div className="sheet-backdrop library-backdrop" onClick={onClose}>
    <section className="profile-sheet library-sheet" role="dialog" aria-modal="true" aria-labelledby="diagnostic-title" onClick={event => event.stopPropagation()}>
      <button className="sheet-close" onClick={onClose} aria-label="Cerrar diagnóstico">×</button>
      <p className="eyebrow">RUTA · PUNTO DE PARTIDA</p><h2 id="diagnostic-title">Descubre dónde comenzar</h2>
      {!state && !error && <p className="practice-instructions" role="status">Preparando dos lecturas nuevas…</p>}
      {state?.status === "active" && state.passage && state.question && <>
        <p className="practice-instructions">Lee con calma y responde. Si necesitas consultar la lectura, podrás mostrarla de nuevo.</p>
        <div className="mission-progress">Texto {state.passage.number} de 2 · Pregunta {state.item} de 10</div>
        <h3>{state.passage.title}</h3>
        {passageVisible ? <div className="diagnostic-reading"><p className="passage exercise-context">{state.passage.body}</p><button type="button" className="secondary-action" onClick={() => setPassageVisible(false)}>Ya leí · responder</button></div>
          : <div className="diagnostic-reading-closed"><p>La lectura está oculta mientras respondes.</p><button type="button" className="secondary-action" disabled={revealing} onClick={() => void revealPassage()}>{revealing ? "Abriendo…" : "Mostrar lectura"}</button></div>}
        {!passageVisible && <><p className="form-label">{state.question.prompt}</p>
        <div className="answer-list">{state.question.options.map((option, index) =>
          <button key={`${state.item}-${index}`} type="button" className={`answer-option ${selected === index ? "chosen" : ""}`}
            aria-pressed={selected === index} onClick={() => setSelected(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        <fieldset className="diagnostic-confidence"><legend>¿Qué tan seguro estás?</legend>
          <label><input type="radio" name="confidence" checked={confidence === "sure"} onChange={() => setConfidence("sure")}/> Seguro</label>
          <label><input type="radio" name="confidence" checked={confidence === "unsure"} onChange={() => setConfidence("unsure")}/> Tengo dudas</label>
        </fieldset>
        <button className="primary-cta practice-action" type="button" disabled={selected === null || busy} onClick={() => void continueDiagnostic()}>{busy ? "Guardando…" : "Guardar y continuar"}</button></>}
      </>}
      {state?.status === "completed" && state.result && <>
        <p className="practice-instructions">Estas diez respuestas son una orientación inicial, no una calificación ni una certificación de velocidad.</p>
        <div className="diagnostic-results">{Object.entries(state.result.skills).map(([skill, value]) =>
          <div key={skill}><span>{labels[skill] ?? skill}</span><strong>{value.correct} de {value.total}</strong></div>)}</div>
        <p className="answer-feedback">{state.result.recommendation}</p>
        {state.result.practicePlacement && <div className="diagnostic-placement"><strong>Tu inicio sugerido en Prácticas</strong>
          <p>{state.result.practicePlacement.reason} Lecturas de rango {state.result.practicePlacement.readingRange === "intermediate" ? "intermedio" : "inicial"}. Ajustaremos la recomendación con tus próximas lecturas.</p>
          <small>Orientación provisional · aún no hay QSD ni PPM certificada.</small></div>}
        {state.result.calibrationPending && <button className="secondary-action diagnostic-calibrate" onClick={onCalibrate}>Calibrar Cifras fugaces · 8 destellos</button>}
        <button className="primary-cta practice-action" onClick={onClose}>Ver mi ruta</button>
      </>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  </div>;
}
