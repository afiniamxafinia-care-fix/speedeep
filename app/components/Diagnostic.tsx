"use client";

import { useEffect, useState } from "react";

type Result = { skills: Record<string, { correct: number; total: number }>; recommendation: string; nextLesson: string };
type DiagnosticState = {
  attemptId: string; status: "active" | "completed"; item?: number;
  passage?: { number: number; genre: string; title: string; body: string };
  question?: { prompt: string; options: string[] }; result?: Result;
};
const labels: Record<string, string> = {
  explicit: "Encontrar datos", sentence: "Entender la oración", main_idea: "Idea central",
  cause: "Causa y efecto", inference: "Inferir con evidencia",
};

export default function Diagnostic({ onClose, onFinish }: { onClose: () => void; onFinish: () => void }) {
  const [state, setState] = useState<DiagnosticState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<"sure" | "unsure">("sure");
  const [lookedBack, setLookedBack] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/diagnostic", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudo abrir el diagnóstico.");
        return data as DiagnosticState;
      }).then(data => { if (!controller.signal.aborted) setState(data); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo abrir el diagnóstico."); });
    return () => controller.abort();
  }, []);

  async function continueDiagnostic() {
    if (!state || selected === null || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: state.attemptId, index: selected, confidence, lookedBack }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la respuesta.");
      setState(data); setSelected(null); setConfidence("sure"); setLookedBack(false);
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
        <p className="practice-instructions">Lee con calma. Puedes volver al texto para responder. Tus respuestas orientan las lecciones; aquí no buscamos una cifra de velocidad.</p>
        <div className="mission-progress">Texto {state.passage.number} de 2 · Pregunta {state.item} de 10</div>
        <h3>{state.passage.title}</h3><p className="passage exercise-context">{state.passage.body}</p>
        <p className="form-label">{state.question.prompt}</p>
        <div className="answer-list">{state.question.options.map((option, index) =>
          <button key={`${state.item}-${index}`} type="button" className={`answer-option ${selected === index ? "chosen" : ""}`}
            aria-pressed={selected === index} onClick={() => setSelected(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        <fieldset className="diagnostic-confidence"><legend>¿Qué tan seguro estás?</legend>
          <label><input type="radio" name="confidence" checked={confidence === "sure"} onChange={() => setConfidence("sure")}/> Seguro</label>
          <label><input type="radio" name="confidence" checked={confidence === "unsure"} onChange={() => setConfidence("unsure")}/> Tengo dudas</label>
        </fieldset>
        <label className="diagnostic-lookback"><input type="checkbox" checked={lookedBack} onChange={event => setLookedBack(event.target.checked)}/> Volví a consultar el texto para esta respuesta</label>
        <button className="primary-cta practice-action" type="button" disabled={selected === null || busy} onClick={() => void continueDiagnostic()}>{busy ? "Guardando…" : "Guardar y continuar"}</button>
      </>}
      {state?.status === "completed" && state.result && <>
        <p className="practice-instructions">Estas diez respuestas son una orientación inicial, no una calificación ni una certificación de velocidad.</p>
        <div className="diagnostic-results">{Object.entries(state.result.skills).map(([skill, value]) =>
          <div key={skill}><span>{labels[skill] ?? skill}</span><strong>{value.correct} de {value.total}</strong></div>)}</div>
        <p className="answer-feedback">{state.result.recommendation}</p>
        <button className="primary-cta practice-action" onClick={onClose}>Ver mi ruta</button>
      </>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  </div>;
}
