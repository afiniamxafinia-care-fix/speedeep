"use client";

import { useEffect, useState } from "react";

const peers = [
  { name: "Valeria", level: "Racha de 6 días", ppm: 286, color: "lilac", initials: "V" },
  { name: "Mateo", level: "A 14 ppm del club", ppm: 286, color: "mint", initials: "M" },
  { name: "Sofía", level: "Nueva marca personal", ppm: 342, color: "peach", initials: "S" },
];

const passage = "La lectura rápida no consiste en correr sobre las palabras. Consiste en entrenar la atención, reconocer ideas con intención y comprobar que lo leído permanece contigo. Con práctica breve y constante, tu cerebro aprende a encontrar patrones, conectar conceptos y dedicar menos tiempo a releer. La meta no es terminar primero: es avanzar más, comprendiendo mejor.";

function Icon({ name }: { name: "home" | "book" | "users" | "trophy" | "gift" | "menu" | "arrow" | "spark" }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5v14M8 7h8M8 11h7"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1zM16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8H8.5a2.5 2.5 0 1 1 2.4-3.2L12 8Zm0 0h3.5a2.5 2.5 0 1 0-2.4-3.2L12 8Z"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Home() {
  const [hearts, setHearts] = useState<Record<string, number>>({ Valeria: 18, Mateo: 12, Sofía: 26 });
  const [sent, setSent] = useState<string[]>([]);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const support = (name: string) => {
    if (sent.includes(name)) return;
    setHearts((current) => ({ ...current, [name]: current[name] + 1 }));
    setSent((current) => [...current, name]);
  };

  const startPractice = () => {
    setSeconds(0);
    setAnswer("");
    setFinished(false);
    setPracticeOpen(true);
    setRunning(true);
  };

  const endPractice = () => {
    setRunning(false);
    setFinished(true);
  };

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Speedeep, inicio">
          <span className="brand-mark"><span /></span>
          <span>speed<span className="brand-light">deep</span></span>
        </a>
        <div className="side-label">TU ESPACIO</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <a className="nav-item active" href="#inicio"><Icon name="home"/>Inicio</a>
          <a className="nav-item" href="#practica" onClick={(e) => { e.preventDefault(); startPractice(); }}><Icon name="book"/>Práctica <span className="nav-dot"/></a>
          <a className="nav-item" href="#live"><Icon name="users"/>Live</a>
          <a className="nav-item" href="#hitos"><Icon name="trophy"/>Hitos</a>
          <a className="nav-item" href="#referidos"><Icon name="gift"/>Invita y gana</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="trial-small"><span className="trial-spark">✦</span><p>Prueba gratuita</p><strong>Día 3 <span>de 7</span></strong><div className="mini-progress"><i/></div><small>Tu avance sigue contigo.</small></div>
          <button className="profile-button"><span className="avatar avatar-user">A</span><span className="profile-copy"><strong>Aldo</strong><small>Plan de prueba</small></span><span className="ellipsis">···</span></button>
        </div>
      </aside>

      <section className="main-column" id="inicio">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menú" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Icon name="menu"/></button>
          <div className="breadcrumb">Tu espacio <span>/</span> Inicio</div>
          <div className="topbar-right"><span className="live-status"><i/> Tu progreso está al día</span><button className="help-button">?</button></div>
        </header>

        {mobileNavOpen && <><button className="mobile-drawer-backdrop" aria-label="Cerrar menú" onClick={() => setMobileNavOpen(false)}/><aside className="mobile-drawer"><div className="mobile-drawer-head"><a className="brand" href="#inicio" onClick={() => setMobileNavOpen(false)}><span className="brand-mark"><span/></span><span>speed<span className="brand-light">deep</span></span></a><button className="mobile-drawer-close" aria-label="Cerrar menú" onClick={() => setMobileNavOpen(false)}>×</button></div><p className="side-label">TU ESPACIO</p><nav className="side-nav" aria-label="Navegación móvil"><a className="nav-item active" href="#inicio" onClick={() => setMobileNavOpen(false)}><Icon name="home"/>Inicio</a><button className="nav-item" onClick={() => { setMobileNavOpen(false); startPractice(); }}><Icon name="book"/>Práctica</button><a className="nav-item" href="#live" onClick={() => setMobileNavOpen(false)}><Icon name="users"/>Live</a><a className="nav-item" href="#hitos" onClick={() => setMobileNavOpen(false)}><Icon name="trophy"/>Hitos</a><a className="nav-item" href="#referidos" onClick={() => setMobileNavOpen(false)}><Icon name="gift"/>Invita y gana</a></nav></aside></>}

        <div className="page-content">
          <div className="demo-notice"><span>VISTA DE DEMOSTRACIÓN</span><span>Los perfiles y métricas sociales son ilustrativos.</span></div>

          <section className="welcome-row">
            <div>
              <p className="eyebrow">TU PLAN DE HOY</p>
              <h1>Hola, Aldo <span className="wave">✦</span></h1>
              <p className="welcome-subtitle">Cinco minutos hoy también cuentan. ¿Seguimos?</p>
            </div>
            <div className="streak-pill"><span className="flame">♨</span><span><strong>3 días</strong><small>de racha</small></span><span className="streak-dots"><i className="done"/><i className="done"/><i className="done"/><i/><i/><i/><i/></span></div>
          </section>

          <section className="hero-grid" id="practica">
            <article className="speed-card">
              <div className="card-top"><span className="label-on-dark">TU VELOCIDAD ACTUAL</span><span className="up-chip">↗ +14 ppm esta semana</span></div>
              <div className="speed-main"><strong>184</strong><span>ppm</span><div className="speed-ring"><div><b>61%</b><small>de tu meta</small></div></div></div>
              <div className="speed-bottom"><div><span>Tu meta: <b>300 ppm</b></span><div className="speed-progress"><i/></div></div><button className="button button-light" onClick={startPractice}>Continuar práctica <Icon name="arrow"/></button></div>
              <div className="card-glow"/>
            </article>
            <article className="focus-card">
              <div className="focus-icon"><Icon name="spark"/></div>
              <p className="eyebrow">TU SIGUIENTE PASO</p>
              <h2>Lee con intención</h2>
              <p>Una práctica breve para cuidar velocidad y comprensión.</p>
              <div className="focus-meta"><span>◷ 5 min</span><span>◉ Comprensión</span></div>
              <button className="text-button" onClick={startPractice}>Empezar ahora <Icon name="arrow"/></button>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel progress-panel">
              <div className="panel-head"><div><p className="eyebrow">TU EVOLUCIÓN</p><h2>Más ritmo, más claridad</h2></div><button className="select-button">Esta semana⌄</button></div>
              <div className="chart-wrap" aria-label="Gráfica ilustrativa de progreso semanal">
                <div className="chart-y"><span>300</span><span>200</span><span>100</span><span>0</span></div>
                <svg className="chart" viewBox="0 0 560 150" preserveAspectRatio="none" role="img" aria-label="Tendencia ascendente de velocidad de lectura">
                  <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#59c0f3" stopOpacity=".22"/><stop offset="1" stopColor="#59c0f3" stopOpacity="0"/></linearGradient></defs>
                  <path className="chart-gridline" d="M0 20H560M0 60H560M0 100H560M0 140H560"/>
                  <path d="M0 127 C50 120 65 113 100 116 S160 91 195 102 S250 84 280 90 S333 61 370 74 S425 49 455 56 S515 28 560 23 V150 H0Z" fill="url(#chartFill)"/>
                  <path d="M0 127 C50 120 65 113 100 116 S160 91 195 102 S250 84 280 90 S333 61 370 74 S425 49 455 56 S515 28 560 23" fill="none" stroke="#58bff1" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="560" cy="23" r="5" fill="#fff" stroke="#58bff1" strokeWidth="3"/>
                </svg>
                <div className="chart-x"><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span><span>Hoy</span></div>
              </div>
              <div className="chart-foot"><span><i className="legend-dot"/> PPM por día</span><span>Tu ritmo mejora cuando vuelves.</span></div>
            </article>

            <article className="panel club-panel" id="hitos">
              <div className="club-heading"><span className="club-medal"><Icon name="trophy"/></span><span className="club-tag">TU PRÓXIMO HITO</span></div>
              <h2>Club de los 300</h2>
              <p>Estás construyendo una lectura más ágil sin soltar la comprensión.</p>
              <div className="club-count"><strong>116</strong><span>ppm para llegar</span><span className="mini-stars">✦ ✦ ✧</span></div>
              <div className="club-bar"><i/></div>
              <div className="club-bottom"><span>184 ppm</span><span>300 ppm</span></div>
              <a href="#hitos" className="text-button">Ver mis hitos <Icon name="arrow"/></a>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="panel live-panel" id="live">
              <div className="panel-head"><div><p className="eyebrow">AVANZAMOS EN COMUNIDAD</p><h2>Live <span className="live-count"><i/> 24 activos</span></h2></div><a href="#live" className="subtle-link">Ver comunidad <Icon name="arrow"/></a></div>
              <div className="peer-list">{peers.map((peer) => <div className="peer-row" key={peer.name}><span className={`avatar avatar-${peer.color}`}>{peer.initials}</span><span className="peer-info"><strong>{peer.name}</strong><small>{peer.level}</small></span><span className="peer-ppm"><strong>{peer.ppm}</strong><small>ppm</small></span><button className={`heart-button ${sent.includes(peer.name) ? "sent" : ""}`} onClick={() => support(peer.name)} aria-label={`Enviar corazón a ${peer.name}`} disabled={sent.includes(peer.name)}><span>♥</span><small>{hearts[peer.name]}</small></button></div>)}</div>
              <p className="social-footnote">Los corazones son una forma sencilla de decir: “vas muy bien”.</p>
            </article>
            <article className="panel referral-panel" id="referidos">
              <div className="refer-icon"><Icon name="gift"/></div>
              <p className="eyebrow">CRECE CON SPEEDEEP</p>
              <h2>Invita y gana</h2>
              <p>Comparte tu código. Recibe comisión por cada suscripción nueva y sus renovaciones.</p>
              <div className="commission-row"><span>Nueva suscripción</span><strong>50%</strong></div><div className="commission-row"><span>Renovación</span><strong>30%</strong></div>
              <div className="wallet-row"><span>Saldo para retirar <small>Retiros desde $1,000 MXN</small></span><strong>$0<span> MXN</span></strong></div>
              <button className="button button-outline">Conocer mi panel <Icon name="arrow"/></button>
            </article>
          </section>

          <section className="subscription-banner">
            <div className="sub-icon">✦</div><div className="sub-copy"><strong>Te quedan 4 días de práctica gratis</strong><span>Después, continúa por $990 MXN al mes. Cancela cuando quieras.</span></div><a className="sub-link" href="#planes">Conocer el plan <Icon name="arrow"/></a>
          </section>

          <footer className="footer"><span>© 2026 Speedeep</span><span>Tu avance, a tu ritmo.</span><a href="#privacidad">Privacidad</a></footer>
        </div>
      </section>

      {practiceOpen && <div className="modal-backdrop" role="presentation"><section className="practice-modal" role="dialog" aria-modal="true" aria-labelledby="practice-title"><button className="modal-close" onClick={() => { setPracticeOpen(false); setRunning(false); }} aria-label="Cerrar práctica">×</button><div className="practice-modal-top"><span className="practice-tag">PRÁCTICA DE HOY · 5 MIN</span><span className="timer">{minutes}:{secs}</span></div><h2 id="practice-title">Lee con intención</h2>{!finished ? <><p className="practice-instructions">Lee el texto a tu ritmo. Cuando termines, selecciona “Ya terminé” para revisar tu comprensión.</p><div className="passage">{passage}</div><button className="button button-primary modal-action" onClick={endPractice}>Ya terminé <Icon name="arrow"/></button></> : <><p className="practice-instructions">¿Cuál era la idea principal del texto?</p><div className="answer-list">{["La lectura rápida busca terminar antes que los demás.", "Leer con intención mejora el ritmo y ayuda a retener lo leído.", "Releer varias veces es la mejor forma de aumentar velocidad."].map((option, index) => <button key={option} className={`answer-option ${answer === option ? "chosen" : ""}`} onClick={() => setAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{answer && <div className="answer-feedback">{answer.startsWith("Leer con intención") ? "¡Correcto! Captaste la idea principal." : "Buen intento. La práctica se enfoca en avanzar con comprensión."}</div>}<button className="button button-primary modal-action" onClick={() => { setPracticeOpen(false); setRunning(false); }} disabled={!answer}>Terminar práctica <Icon name="arrow"/></button></>}</section></div>}
    </main>
  );
}
