"use client";

import { useEffect, useState } from "react";

export type PracticeKind = "reading" | "main_idea" | "sequence" | "find_data" | "relevance";
export const practiceModes: { kind: PracticeKind; title: string; description: string; mark: string }[] = [
  { kind: "reading", title: "Lectura", description: "Ritmo y comprensión", mark: "↗" },
  { kind: "main_idea", title: "Idea principal", description: "Reconoce lo esencial", mark: "✦" },
  { kind: "sequence", title: "Secuencias", description: "Pon los pasos en orden", mark: "1→" },
  { kind: "find_data", title: "Busca el dato", description: "Lee con un objetivo", mark: "⌕" },
  { kind: "relevance", title: "Lo relevante", description: "Elige lo que sí importa", mark: "✓" },
];
type Article = { id: string; title: string; category: string; word_count: number; difficulty_level: string; estimated_minutes: number };
type TrainingCard = { id: string; title: string; kind: PracticeKind; estimated_minutes: number; lastScore: number | null };
type Exercise = { id: string; title: string; kind: PracticeKind; instructions: string; context: string; items: string[] };
type Result = { score: number; expectedIndices: number[]; explanation: string };
type Placement = { readingRange: "beginner" | "intermediate" | "advanced"; recommendedKind: string; reason: string; source: "diagnostic" | "recent_readings" };

export default function PracticeLibrary({ initialKind = "reading", onClose, onRead }: {
  initialKind?: PracticeKind; onClose: () => void; onRead: (id: string) => void;
}) {
  const [kind, setKind] = useState(initialKind);
  const [catalog, setCatalog] = useState<{ articles: Article[]; exercises: TrainingCard[]; placement: Placement | null } | null>(null);
  const [active, setActive] = useState<{ attemptId: string; exercise: Exercise } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el catálogo.");
      setCatalog(data);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, []);

  async function begin(id: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/exercises", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "begin", exerciseId: id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir el ejercicio.");
      setActive(data); setSelected([]); setResult(null);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo abrir el ejercicio."); }
    finally { setBusy(false); }
  }

  function choose(index: number) {
    if (!active || result || busy) return;
    if (active.exercise.kind === "sequence") {
      if (!selected.includes(index)) setSelected([...selected, index]);
    } else if (active.exercise.kind === "relevance") {
      setSelected(selected.includes(index) ? selected.filter(i => i !== index) : [...selected, index]);
    } else setSelected([index]);
  }

  async function submit() {
    if (!active) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/exercises", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", attemptId: active.attemptId, selectedIndices: selected }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el resultado.");
      setResult(data.result);
      setCatalog(current => current ? { ...current, exercises: current.exercises.map(e => e.id === active.exercise.id ? { ...e, lastScore: data.result.score } : e) } : current);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar el resultado."); }
    finally { setBusy(false); }
  }

  const exercise = active?.exercise;
  const mode = practiceModes.find(m => m.kind === (exercise?.kind ?? kind))!;
  const complete = exercise?.kind === "sequence" ? selected.length === exercise.items.length : selected.length > 0;
  return <div className="sheet-backdrop library-backdrop" onClick={onClose}>
    <section className="profile-sheet library-sheet" role="dialog" aria-modal="true" aria-labelledby="library-title" onClick={e => e.stopPropagation()}>
      <div className="sheet-handle"/><button className="sheet-close" aria-label="Cerrar biblioteca de prácticas" onClick={onClose}>×</button>
      <p className="eyebrow">{exercise ? mode.title.toUpperCase() : "ENTRENA A TU MANERA"}</p>
      <h2 id="library-title">{exercise?.title ?? "Tus prácticas"}</h2>
      {!exercise ? <>
        <p className="practice-instructions">Elige una lectura o un reto breve para entrenar una habilidad concreta.</p>
        {catalog?.placement && <div className="diagnostic-placement"><strong>Tu punto de partida sugerido</strong>
          <p>{catalog.placement.reason} Rango de lectura: {({ beginner: "inicial", intermediate: "intermedio", advanced: "avanzado" } as const)[catalog.placement.readingRange]}.</p>
          <small>{catalog.placement.source === "recent_readings" ? "Ajuste provisional por comprensión en textos nuevos." : "Orientación provisional del diagnóstico; se ajusta con lecturas nuevas."}</small>
          {catalog.placement.recommendedKind !== kind && practiceModes.some(m => m.kind === catalog.placement?.recommendedKind) && <button className="mission-launch" onClick={() => setKind(catalog.placement!.recommendedKind as PracticeKind)}>Ver práctica sugerida</button>}</div>}
        <div className="mode-tabs" role="tablist" aria-label="Tipos de práctica">{practiceModes.map(m => <button key={m.kind} role="tab" aria-selected={kind === m.kind} className={kind === m.kind ? "selected" : ""} onClick={() => setKind(m.kind)}>{m.title}</button>)}</div>
        {!catalog && !error && <p className="practice-instructions" role="status">Cargando tus prácticas…</p>}
        <div className="catalog-list">{kind === "reading" ? catalog?.articles.slice().sort((a,b) => Number(b.difficulty_level === catalog.placement?.readingRange) - Number(a.difficulty_level === catalog.placement?.readingRange)).map(a => <button key={a.id} className="catalog-card" onClick={() => onRead(a.id)}><span className="catalog-mark">↗</span><span><strong>{a.title}</strong><small>{a.category} · {a.word_count} palabras · {a.estimated_minutes} min</small><small>{({ beginner: "Inicial", intermediate: "Intermedio", advanced: "Avanzado" } as Record<string, string>)[a.difficulty_level] ?? "Práctica breve"}{a.difficulty_level === catalog.placement?.readingRange ? " · sugerida" : ""}</small></span><b aria-hidden="true">→</b></button>) : catalog?.exercises.filter(e => e.kind === kind).map(e => <button key={e.id} className="catalog-card" disabled={busy} onClick={() => begin(e.id)}><span className={`catalog-mark mark-${e.kind}`}>{mode.mark}</span><span><strong>{e.title}</strong><small>{mode.description} · {e.estimated_minutes} min</small>{e.lastScore !== null && <small className="saved-score">Último resultado: {e.lastScore}/100</small>}</span><b aria-hidden="true">→</b></button>)}</div>
      </> : <>
        {!result && <>
          <p className="practice-instructions">{exercise.instructions}</p>
          <div className="passage exercise-context">{exercise.context}</div>
          {exercise.kind === "sequence" && <><ol className="sequence-picked" aria-label="Tu secuencia">{selected.map((index, position) => <li key={index}><span>{position + 1}</span>{exercise.items[index]}</li>)}</ol>{selected.length > 0 && <button className="text-action" disabled={busy} onClick={() => setSelected(selected.slice(0, -1))}>Deshacer último paso</button>}</>}
          <div className="answer-list">{exercise.items.map((item, index) => <button key={index} className={`answer-option ${selected.includes(index) ? "chosen" : ""}`} aria-pressed={selected.includes(index)} disabled={busy || (exercise.kind === "sequence" && selected.includes(index))} onClick={() => choose(index)}><span>{exercise.kind === "sequence" ? (selected.includes(index) ? selected.indexOf(index) + 1 : "+") : exercise.kind === "relevance" ? (selected.includes(index) ? "✓" : "○") : String.fromCharCode(65 + index)}</span>{item}</button>)}</div>
          <button className="primary-cta practice-action" disabled={busy || !complete} onClick={submit}>{busy ? "Guardando…" : "Comprobar y guardar"}</button>
        </>}
        {result && <>
          <div className="training-result"><strong>{result.score}<small>/100</small></strong><span>Resultado de este ejercicio</span></div>
          <p className="answer-feedback">{result.explanation}</p>
          <p className="form-label">{exercise.kind === "sequence" ? "Orden correcto" : "Respuesta esperada"}</p>
          <ol className="solution-list">{result.expectedIndices.map(index => <li key={index}>{exercise.items[index]}</li>)}</ol>
          <p className="practice-instructions">Resultado guardado. Estos retos entrenan habilidades concretas; las PPM se miden en las lecturas cronometradas.</p>
        </>}
        <button className="secondary-action" disabled={busy} onClick={() => { setActive(null); setError(""); }}> {result ? "Elegir otra práctica" : "Volver al catálogo"}</button>
      </>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  </div>;
}
