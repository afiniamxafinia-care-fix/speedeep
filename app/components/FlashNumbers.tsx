"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Active = { status: "active"; roundId: string; position: number; digits: number; exposureMs: number; target: string; options: string[] };
type Complete = { status: "completed"; roundId: string; correct: number; level: { rank: number; digits: number; step: number; roundsCompleted: number }; played: { digits: number; exposureMs: number } };
type State = Active | Complete;

export default function FlashNumbers({ origin, onClose }: { origin: "route" | "lab" | "diagnostic"; onClose: () => void }) {
  const [state, setState] = useState<State | null>(null);
  const [phase, setPhase] = useState<"ready" | "flash" | "pick">("ready");
  const [observedMs, setObservedMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frames = useRef<number[]>([]);

  const cancelExposure = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    frames.current.forEach(id => cancelAnimationFrame(id));
    timeout.current = null; frames.current = [];
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) { cancelExposure(); setPhase(current => current === "flash" ? "ready" : current); } };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { cancelExposure(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [cancelExposure]);

  const begin = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/flash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "begin", origin }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir el reto.");
      setState(data); setPhase("ready");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo abrir el reto."); }
    finally { setBusy(false); }
  }, [origin]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/flash", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "begin", origin }), signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo abrir el reto."); return data as State; })
      .then(data => { if (!controller.signal.aborted) setState(data); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo abrir el reto."); });
    return () => controller.abort();
  }, [origin]);

  function showFlash() {
    if (!state || state.status !== "active" || busy || document.hidden) return;
    setError(""); setPhase("flash");
    // Two animation frames place the stimulus on screen before timing begins.
    frames.current = [requestAnimationFrame(() => {
      frames.current = [requestAnimationFrame(() => {
        const start = performance.now();
        timeout.current = setTimeout(() => {
          if (document.hidden) { setPhase("ready"); return; }
          const elapsed = Math.max(1,Math.round(performance.now()-start));
          if (elapsed > state.exposureMs + Math.max(150,Math.round(state.exposureMs*0.5))) {
            setError("La pantalla demoró más de lo previsto. Repite este destello sin penalización.");
            setPhase("ready"); return;
          }
          setObservedMs(elapsed);
          setPhase("pick");
        }, state.exposureMs);
      })];
    })];
  }

  async function answer(index: number) {
    if (!state || state.status !== "active" || phase !== "pick" || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/flash", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", roundId: state.roundId, index, observedMs }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la respuesta.");
      setState(data); setPhase("ready");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la respuesta."); }
    finally { setBusy(false); }
  }

  return <div className="sheet-backdrop library-backdrop" onClick={onClose}><section className="profile-sheet library-sheet flash-sheet" role="dialog" aria-modal="true" aria-labelledby="flash-title" onClick={event => event.stopPropagation()}>
    <button className="sheet-close" onClick={onClose} aria-label="Cerrar reto">×</button>
    <p className="eyebrow">{origin === "diagnostic" ? "CALIBRACIÓN INICIAL · CIFRAS FUGACES" : "PAUSA CURIOSA · CIFRAS FUGACES"}</p><h2 id="flash-title">¿Cuál cifra apareció?</h2>
    <p className="practice-instructions">{origin === "diagnostic" ? "Ocho destellos a un ritmo cómodo nos ayudan a iniciar tu nivel visual. Esta ronda también se guarda en Prácticas." : "Ocho destellos. Mira la cifra y elige exactamente la que viste. Tu nivel se guarda en Prácticas, vengas de Ruta o del laboratorio."}</p>
    {!state && !error && <p role="status">Preparando tu reto…</p>}
    {state?.status === "active" && <>
      <div className="mission-progress">Destello {state.position} de 8 · {state.digits} dígitos · {state.exposureMs} ms</div>
      <div className="flash-stage" aria-live="off">{phase === "flash" ? <strong>{state.target}</strong> : phase === "ready" ? <span>Respira y prepárate.</span> : <span>Elige lo que viste ↓</span>}</div>
      {phase === "ready" && <button className="primary-cta practice-action" disabled={busy} onClick={showFlash}>Mostrar cifra</button>}
      {phase === "pick" && <div className="flash-answers">{state.options.map((option,index) => <button className="answer-option" disabled={busy} key={`${state.position}-${index}`} onClick={() => void answer(index)}><span>{String.fromCharCode(65+index)}</span>{option}</button>)}</div>}
    </>}
    {state?.status === "completed" && <>
      <div className="training-result"><strong>{state.correct}<small>/8</small></strong><span>Ronda completada · {state.played.digits} dígitos</span></div>
      <p className="answer-feedback">{origin === "diagnostic" ? "Punto de partida provisional" : "Tu nivel de Cifras fugaces"}: {state.level.digits} dígitos, escalón {state.level.step+1} de 3. Llevas {state.level.roundsCompleted} rondas completas.</p>
      <p className="practice-instructions">Dos rondas consecutivas de 7/8 o más suben un escalón. Una ronda de 3/8 o menos, o dos de 5/8 o menos, bajan uno. Al crecer la cifra, el tiempo vuelve a ser cómodo.</p>
      {origin !== "diagnostic" && <button className="primary-cta practice-action" disabled={busy} onClick={() => void begin()}>Otra ronda</button>}
      <button className={origin === "diagnostic" ? "primary-cta practice-action" : "secondary-action"} onClick={onClose}>{origin === "diagnostic" ? "Ver mi ruta" : "Volver"}</button>
    </>}
    {error && <><p className="inline-error" role="alert">{error}</p>{!state && <button className="secondary-action" onClick={() => void begin()}>Reintentar</button>}</>}
    <p className="flash-note">Reto opcional: no cambia tu avance académico, comprensión, PPM ni clubes.</p>
  </section></div>;
}
