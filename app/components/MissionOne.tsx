"use client";

import { useState } from "react";

type Case = { sentence: string; question: string; options: [string, string, string]; answer: number; feedback: [string, string, string] };
const cases: Case[] = [
  { sentence: "Lucía, después de revisar tres propuestas, eligió la opción más sencilla.", question: "¿Qué hizo Lucía al final?", options: ["Revisó tres propuestas", "Eligió la opción más sencilla", "Presentó tres propuestas"], answer: 1, feedback: ["Revisar ocurrió antes; la acción central es que eligió una opción.", "Exacto. El detalle intercalado explica qué hizo antes.", "La oración no dice que Lucía presentara propuestas."] },
  { sentence: "El tren, pese a la lluvia intensa, salió a tiempo de la estación.", question: "¿Qué ocurrió?", options: ["La lluvia detuvo al tren", "El tren llegó tarde", "El tren salió a tiempo"], answer: 2, feedback: ["La lluvia es una dificultad, pero no impidió la salida.", "La oración habla de la salida, no de la llegada.", "Sí. Conservaste la acción central a pesar del detalle."] },
  { sentence: "Después de recibir la alerta, el equipo de guardia cerró la entrada norte.", question: "¿Qué hizo el equipo?", options: ["Recibió la alerta y abrió la entrada", "Cerró la entrada norte", "Cerró todas las entradas"], answer: 1, feedback: ["La alerta ocurrió primero; la entrada fue cerrada.", "Correcto. El detalle inicial indica cuándo actuó el equipo.", "El texto solo menciona la entrada norte."] },
  { sentence: "Marta no entregó el informe que había corregido durante la mañana.", question: "¿Qué NO hizo Marta?", options: ["Corregir un informe", "Entregar el informe", "Trabajar durante la mañana"], answer: 1, feedback: ["Corregir aparece como una acción realizada; observa la palabra «no» junto a «entregó».", "Bien. La negación cambia la acción principal.", "La oración sitúa la corrección durante la mañana; la negación afecta a la entrega."] },
  { sentence: "Aunque el precio subió el lunes, la tienda mantuvo el descuento anunciado.", question: "¿Qué hizo la tienda?", options: ["Retiró el descuento", "Mantuvo el descuento", "Bajó el precio el lunes"], answer: 1, feedback: ["«Aunque» presenta un contraste: el descuento se mantuvo.", "Sí. Separaste el cambio de precio de la decisión de la tienda.", "El precio subió; la tienda mantuvo el descuento."] },
  { sentence: "La coordinadora, tras escuchar a los vecinos, aplazó la reunión del viernes.", question: "¿Qué sucedió con la reunión?", options: ["Se adelantó", "Se celebró el viernes", "Se aplazó"], answer: 2, feedback: ["Aplazar significa pasarla a otro momento; escuchar fue el paso anterior.", "La oración dice que se aplazó, así que no se celebró como estaba previsto.", "Correcto. Reconociste la acción central en una oración nueva."] },
];

export default function MissionOne({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [firstAttempts, setFirstAttempts] = useState<(boolean | null)[]>(Array(cases.length).fill(null));
  const [retried, setRetried] = useState(false);
  const finished = step >= cases.length;
  const current = cases[step];
  const transferCorrect = firstAttempts.slice(4).filter(Boolean).length;

  function choose(index: number) {
    if (chosen !== null) return;
    setChosen(index);
    if (firstAttempts[step] === null) setFirstAttempts(previous => previous.map((value, i) => i === step ? index === current.answer : value));
  }

  function next() {
    if (chosen === null) return;
    if (chosen !== current.answer && step < 4 && !retried) { setChosen(null); setRetried(true); return; }
    setStep(step + 1); setChosen(null); setRetried(false);
  }

  return <div className="sheet-backdrop library-backdrop" onClick={onClose}><section className="profile-sheet library-sheet" role="dialog" aria-modal="true" aria-labelledby="mission-title" onClick={event => event.stopPropagation()}>
    <button className="sheet-close" onClick={onClose} aria-label="Cerrar misión">×</button>
    <p className="eyebrow">BLOQUE 1 · MISIÓN 1.1</p><h2 id="mission-title">Conserva la acción central</h2>
    {finished ? <><p className="practice-instructions">En dos oraciones nuevas identificaste la acción central {transferCorrect} de 2 veces en el primer intento.</p>
      <p className="answer-feedback">{transferCorrect === 2 ? "Buen comienzo. Para acreditar esta habilidad necesitarás demostrarla también con otros materiales en una sesión posterior." : "Revisa qué hizo cada persona y a qué acción afecta la negación o el detalle; vuelve a intentarlo con oraciones nuevas más adelante."}</p>
      <p className="practice-instructions">Esta exploración no desbloquea la siguiente lección ni acredita un club.</p>
      <button className="primary-cta" onClick={onClose}>Volver a la ruta</button>
    </> : <>
      <p className="practice-instructions">{step < 2 ? "Descubre quién hizo qué, incluso cuando hay detalles en medio." : step < 4 ? "Ahora cambia el orden y observa la negación." : "Aplica la habilidad sin pistas en una oración nueva."}</p>
      <div className="mission-progress">{step < 2 ? "Primer intento" : step < 4 ? "Práctica con corrección" : "Aplicación sin ayuda"} · {step + 1} de {cases.length}</div>
      <div className="passage exercise-context">{current.sentence}</div>
      <p className="form-label">{current.question}</p>
      <div className="answer-list">{current.options.map((option, index) => <button key={option} className={`answer-option ${chosen === index ? "chosen" : ""}`} disabled={chosen !== null} onClick={() => choose(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
      {chosen !== null && <p className="answer-feedback" role="status">{current.feedback[chosen]}</p>}
      {retried && chosen === null && <p className="practice-instructions">Inténtalo otra vez. Busca la acción principal antes de los detalles.</p>}
      <button className="primary-cta practice-action" disabled={chosen === null} onClick={next}>{chosen !== null && chosen !== current.answer && step < 4 && !retried ? "Volver a intentar" : "Continuar"}</button>
    </>}
  </section></div>;
}
