"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PracticeKind = "reading" | "main_idea" | "sequence" | "find_data" | "relevance";
export const practiceModes: { kind: PracticeKind; title: string; description: string; mark: string }[] = [
  { kind: "reading", title: "Lectura", description: "Ritmo y comprensión", mark: "↗" },
  { kind: "main_idea", title: "Idea principal", description: "Reconoce lo esencial", mark: "✦" },
  { kind: "sequence", title: "Secuencias", description: "Pon los pasos en orden", mark: "1→" },
  { kind: "find_data", title: "Busca el dato", description: "Lee con un objetivo", mark: "⌕" },
  { kind: "relevance", title: "Lo relevante", description: "Elige lo que sí importa", mark: "✓" },
];
type Article = { id: string; title: string; category: string; word_count: number; difficulty_level: string; estimated_minutes: number; read: boolean };
type TrainingCard = { id: string; title: string; kind: PracticeKind; estimated_minutes: number; lastScore: number | null; lastDurationSeconds: number | null; lastCompletedAt: string | null; scoreChange: number | null };
type Exercise = { id: string; title: string; kind: PracticeKind; instructions: string; context: string; items: string[] };
type Result = { score: number; expectedIndices: number[]; explanation: string; durationSeconds: number | null; scoreChange: number | null };
type Placement = { readingRange: "beginner" | "intermediate" | "advanced"; recommendedKind: string; reason: string; source: "diagnostic" | "recent_readings" };

export default function PracticeLibrary({ initialKind = "reading", origin = "lab", routeLevel, routeAfter, onClose, onRead }: {
  initialKind?: PracticeKind; origin?: "route" | "lab"; routeLevel?: string; routeAfter?: 1 | 3; onClose: () => void; onRead: (id: string) => void;
}) {
  const kind = initialKind;
  const [catalog, setCatalog] = useState<{ articles: Article[]; exercises: TrainingCard[]; placement: Placement | null } | null>(null);
  const [active, setActive] = useState<{ attemptId: string; exercise: Exercise } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sheetRef = useRef<HTMLElement>(null);
  const launchedRef = useRef(false);
  const activeAttemptId = active?.attemptId;
  const hasResult = result !== null;

  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeAttemptId, hasResult, kind]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el catálogo.");
      setCatalog(data);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, []);

  const begin = useCallback(async (id: string) => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/exercises", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "begin", exerciseId: id, origin, routeLevel: routeLevel ?? null, routeAfter: routeAfter ?? null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir el ejercicio.");
      setActive(data); setSelected([]); setResult(null);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo abrir el ejercicio."); }
    finally { setBusy(false); }
  }, [origin, routeLevel, routeAfter]);

  const pickExercise = useCallback((excludeId?: string) => {
    const candidates = catalog?.exercises.filter(e => e.kind === kind && e.id !== excludeId) ?? [];
    const unseen = candidates.filter(e => !e.lastCompletedAt);
    const pool = (unseen.length ? unseen : candidates.slice().sort((a, b) => (a.lastCompletedAt ?? "").localeCompare(b.lastCompletedAt ?? ""))).slice(0, 3);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [catalog, kind]);

  useEffect(() => {
    if (!catalog || launchedRef.current) return;
    launchedRef.current = true;
    if (kind === "reading") {
      const suggested = catalog.articles.find(article => !article.read && article.difficulty_level === catalog.placement?.readingRange)
        ?? catalog.articles.find(article => !article.read) ?? catalog.articles[0];
      if (suggested) queueMicrotask(() => onRead(suggested.id));
    } else {
      const suggested = pickExercise();
      if (suggested) queueMicrotask(() => { void begin(suggested.id); });
    }
  }, [catalog, kind, onRead, pickExercise, begin]);

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
      const previous = catalog?.exercises.find(e => e.id === active.exercise.id)?.lastScore ?? null;
      const scoreChange = previous === null ? null : data.result.score - previous;
      setResult({ ...data.result, scoreChange });
      setCatalog(current => current ? { ...current, exercises: current.exercises.map(e => e.id === active.exercise.id ? { ...e, lastScore: data.result.score, lastDurationSeconds: data.result.durationSeconds, lastCompletedAt: new Date().toISOString(), scoreChange } : e) } : current);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar el resultado."); }
    finally { setBusy(false); }
  }

  const exercise = active?.exercise;
  const mode = practiceModes.find(m => m.kind === (exercise?.kind ?? kind))!;
  const complete = exercise?.kind === "sequence" ? selected.length === exercise.items.length : selected.length > 0;
  return <div className="sheet-backdrop library-backdrop" onClick={onClose}>
    <section className="profile-sheet library-sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="library-title" onClick={e => e.stopPropagation()}>
      <div className="sheet-handle"/><button className="sheet-close" aria-label="Cerrar biblioteca de prácticas" onClick={onClose}>×</button>
      <p className="eyebrow">{exercise ? mode.title.toUpperCase() : "ENTRENA A TU MANERA"}</p>
      <h2 id="library-title">{exercise?.title ?? "Tus prácticas"}</h2>
      {!exercise ? <p className="practice-instructions" role="status">{error ? "No pudimos abrir el reto." : catalog && kind === "reading" && !catalog.articles.length || catalog && kind !== "reading" && !catalog.exercises.some(e => e.kind === kind) ? "No hay retos disponibles en esta categoría." : "Buscando un reto para ti…"}</p> : <>
        {!result && <>
          <p className="practice-instructions">{exercise.instructions}</p>
          <div className="passage exercise-context">{exercise.context}</div>
          {exercise.kind === "sequence" && <><ol className="sequence-picked" aria-label="Tu secuencia">{selected.map((index, position) => <li key={index}><span>{position + 1}</span>{exercise.items[index]}</li>)}</ol>{selected.length > 0 && <button className="text-action" disabled={busy} onClick={() => setSelected(selected.slice(0, -1))}>Deshacer último paso</button>}</>}
          <div className="answer-list">{exercise.items.map((item, index) => <button key={index} className={`answer-option ${selected.includes(index) ? "chosen" : ""}`} aria-pressed={selected.includes(index)} disabled={busy || (exercise.kind === "sequence" && selected.includes(index))} onClick={() => choose(index)}><span>{exercise.kind === "sequence" ? (selected.includes(index) ? selected.indexOf(index) + 1 : "+") : exercise.kind === "relevance" ? (selected.includes(index) ? "✓" : "○") : String.fromCharCode(65 + index)}</span>{item}</button>)}</div>
          <button className="primary-cta practice-action" disabled={busy || !complete} onClick={submit}>{busy ? "Guardando…" : "Comprobar y guardar"}</button>
        </>}
        {result && <>
          <div className="training-result"><strong>{result.score}<small>/100</small></strong><span>Precisión en este ejercicio{result.durationSeconds !== null ? ` · ${Math.floor(result.durationSeconds / 60)}:${String(result.durationSeconds % 60).padStart(2, "0")}` : ""}{result.scoreChange !== null ? ` · antes ${result.score - result.scoreChange}% → ahora ${result.score}%` : ""}</span></div>
          <p className="answer-feedback">{result.explanation}</p>
          <p className="form-label">{exercise.kind === "sequence" ? "Orden correcto" : "Respuesta esperada"}</p>
          <ol className="solution-list">{result.expectedIndices.map(index => <li key={index}>{exercise.items[index]}</li>)}</ol>
          <p className="practice-instructions">Resultado guardado. Estos retos entrenan habilidades concretas; las PPM se miden en las lecturas cronometradas.</p>
        </>}
        {origin === "lab" && result && <button className="secondary-action" disabled={busy || (catalog?.exercises.filter(e => e.kind === kind).length ?? 0) < 2} onClick={() => { const next = pickExercise(exercise.id); if (next) void begin(next.id); }}>Otro reto de {mode.title.toLowerCase()}</button>}
        <button className="secondary-action" disabled={busy} onClick={onClose}>{origin === "route" && result ? "Volver a la ruta" : "Cerrar"}</button>
      </>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  </div>;
}
