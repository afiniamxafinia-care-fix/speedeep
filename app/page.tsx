"use client";

import { ChangeEvent, useEffect, useState } from "react";
import PracticeLibrary, { practiceModes, type PracticeKind } from "@/app/components/PracticeLibrary";
import Curriculum from "@/app/components/Curriculum";
import MissionOne from "@/app/components/MissionOne";
import Diagnostic from "@/app/components/Diagnostic";
import FlashNumbers from "@/app/components/FlashNumbers";

type IconName = "home" | "route" | "arena" | "practice" | "profile" | "arrow" | "book" | "spark" | "heart" | "camera" | "close" | "target";
type PracticeQuestion = { id: string; prompt: string; options: string[] };
type PracticeData = { article: { id: string; title: string; body: string; word_count: number; estimated_minutes: number }; questions: PracticeQuestion[] };
type Dashboard = { user: { name: string; avatarUrl: string | null }; stats: { latestPpm: number | null; comprehension: number | null; practicesCount: number; qsdState: string }; membership: { status: string; trial_ends_at: string; current_period_ends_at: string | null; cancel_at_period_end: boolean } | null; curriculum: { activeStep: number | null; completedCount: number; lastTransferCorrect: number | null; diagnosticStatus: "not_started" | "active" | "completed"; diagnosticStep: number | null }; lab: { numbersRank: number; numbersRounds: number } };
type Tab = "Home" | "Ruta" | "Arena" | "Prácticas" | "Perfil";
const tabs: Tab[] = ["Home", "Ruta", "Arena", "Prácticas", "Perfil"];
const clubs = [300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500];

const profileAvatars = ["avatar-aqua", "avatar-violet", "avatar-coral", "avatar-lime"];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    route: <><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/><path d="m14 12 3 3 3-3"/></>,
    arena: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1zM17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></>,
    practice: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5v14M8 7h8M8 11h7"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    book: <><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H20v17H5.5A2.5 2.5 0 0 0 3 22z"/><path d="M3 5v14M7 7h9M7 11h8M7 15h6"/></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></>,
    heart: <path d="M20.8 8.8c0 5.1-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z"/>,
    camera: <><path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function UserAvatar({ photo, initials, variant = "avatar-aqua", className = "" }: { photo?: string; initials: string; variant?: string; className?: string }) {
  return photo
    ? <span className={`user-avatar ${className}`}><img src={photo} alt="Foto de perfil" /></span>
    : <span className={`user-avatar ${variant} ${className}`} aria-label="Avatar">{initials}</span>;
}

export default function Home() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [, setLoading] = useState(true);
  const [appError, setAppError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirm, setAuthConfirm] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register" | "recover" | "newPassword">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const ppm = dashboard?.stats.latestPpm ?? null;
  const comprehension = dashboard?.stats.comprehension ?? null;
  const displayName = dashboard?.user.name ?? user?.name ?? "Lector";
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [flashOrigin, setFlashOrigin] = useState<"route" | "lab" | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>();
  const [avatar, setAvatar] = useState(profileAvatars[0]);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [libraryKind, setLibraryKind] = useState<PracticeKind | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [practice, setPractice] = useState<PracticeData | null>(null);
  const [practiceTicket, setPracticeTicket] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [savingPractice, setSavingPractice] = useState(false);
  const [practiceResult, setPracticeResult] = useState<{ rawActivePpm: number; comprehensionScore: number; correctAnswers: number; totalQuestions: number } | null>(null);

  const milestone = clubs.find(value => ppm === null || ppm < value) ?? "+1500";
  const previousMilestone = typeof milestone === "number" ? (clubs[clubs.indexOf(milestone) - 1] ?? 0) : 1500;
  const milestoneProgress = ppm === null ? 0 : Math.min(100, Math.max(0, ((ppm - previousMilestone) / ((typeof milestone === "number" ? milestone : 1500) - previousMilestone || 1)) * 100));
  const milestoneDistance = ppm === null ? milestone : typeof milestone === "number" ? Math.max(0, milestone - ppm) : 0;

  useEffect(() => {
    const syncTab = () => {
      const requested = new URLSearchParams(window.location.search).get("tab");
      setActiveTab(tabs.find(tab => tab.toLowerCase() === requested?.toLowerCase()) ?? "Home");
    };
    syncTab();
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") setSeconds((value) => value + 1); }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const linkAccessToken = hash.get("access_token");
        const linkRefreshToken = hash.get("refresh_token");
        let signedInUser: { email: string; name: string } | null = null;
        if (linkAccessToken && linkRefreshToken) {
          const callback = await fetch("/api/auth/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: linkAccessToken, refreshToken: linkRefreshToken, expiresIn: hash.get("expires_in") }) });
          const callbackData = await callback.json();
          const cleanUrl = new URL(window.location.href);
          cleanUrl.hash = ""; cleanUrl.searchParams.delete("auth");
          window.history.replaceState({}, document.title, cleanUrl);
          if (!callback.ok) throw new Error(callbackData.error ?? "El enlace venció. Solicita otro código.");
          signedInUser = callbackData.user;
          if (hash.get("type") === "recovery" || new URLSearchParams(window.location.search).get("auth") === "recovery") {
            setAuthMode("newPassword"); setAuthOpen(true);
          }
        } else {
          const response = await fetch("/api/auth/session");
          const data = await response.json();
          signedInUser = data.user ?? null;
        }
        if (signedInUser) {
          if (!cancelled) setUser(signedInUser);
          const home = await fetch("/api/dashboard");
          if (home.ok) {
            const metrics = await home.json();
            if (!cancelled) setDashboard(metrics);
          } else if (home.status !== 401) {
            const message = (await home.json()).error;
            if (!cancelled) setAppError(message ?? "No pudimos cargar tu progreso.");
          }
        }
      } catch (error) {
        if (!cancelled) setAppError(error instanceof Error ? error.message : "No pudimos conectar con Speedeep. Comprueba tu conexión e inténtalo de nuevo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void boot();
    return () => { cancelled = true; };
  }, []);

  const refreshDashboard = async () => {
    const response = await fetch("/api/dashboard");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "No se pudo actualizar tu progreso.");
    setDashboard(data);
    setUser((current) => current ? { ...current, name: data.user.name } : current);
  };

  const openLibrary = (kind: PracticeKind = "reading") => {
    if (!user) { setAuthOpen(true); setAuthError(""); return; }
    setActiveTab("Prácticas"); setLibraryKind(kind);
  };

  const startPractice = async (articleId?: string) => {
    setAppError("");
    if (!user) { setAuthOpen(true); setAuthError(""); return; }
    try {
      const response = await fetch(articleId ? `/api/practice?articleId=${encodeURIComponent(articleId)}` : "/api/practice");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo cargar la lectura.");
      const startResponse = await fetch("/api/practice/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId: data.article.id }) });
      const startData = await startResponse.json();
      if (!startResponse.ok) throw new Error(startData.error ?? "No se pudo iniciar el cronómetro seguro.");
      setPractice(data);
      setPracticeResult(null);
      setAnswers({});
      setPracticeTicket(startData.ticketId);
      setSeconds(0);
      setFinished(false);
      setRunning(true);
      setActiveTab("Prácticas");
      setPracticeOpen(true);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "No se pudo iniciar la práctica.");
    }
  };

  const submitAuth = async () => {
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      if ((authMode === "register" || authMode === "newPassword") && authPassword !== authConfirm) {
        throw new Error("Las contraseñas no coinciden.");
      }
      const endpoint = authMode === "newPassword" ? "password" : authMode;
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: authMode === "newPassword" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authMode === "newPassword" ? { password: authPassword } : { email: authEmail, password: authPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo completar el acceso.");
      if (authMode === "recover" || (authMode === "register" && !data.signedIn)) {
        setAuthMessage(data.message);
        if (authMode === "register") { setAuthMode("login"); setAuthPassword(""); setAuthConfirm(""); }
      } else {
        if (data.user) setUser(data.user);
        setAuthOpen(false); setAuthPassword(""); setAuthConfirm(""); setAuthMode("login");
        await refreshDashboard();
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "No se pudo completar el acceso.");
    } finally { setAuthBusy(false); }
  };

  const submitPractice = async () => {
    if (!practice || !practiceTicket) return;
    setSavingPractice(true); setAppError("");
    try {
      const response = await fetch("/api/practice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        articleId: practice.article.id,
        ticketId: practiceTicket,
        activeReadingSeconds: Math.max(seconds, 10),
        responses: practice.questions.map((question) => ({ questionId: question.id, selectedIndex: answers[question.id] })),
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la práctica.");
      setPracticeResult(data.result);
      setRunning(false);
      await refreshDashboard();
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "No se pudo guardar la práctica.");
    } finally { setSavingPractice(false); }
  };

  const endPractice = () => {
    setPracticeOpen(false);
    setRunning(false);
    setFinished(false);
    setPractice(null);
    setPracticeTicket(null);
  };

  const signOut = async () => {
    try { await fetch("/api/auth/session", { method: "DELETE" }); }
    finally { setUser(null); setDashboard(null); setProfileOpen(false); setProfilePhoto(undefined); }
  };

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "Home") url.searchParams.delete("tab"); else url.searchParams.set("tab", tab.toLowerCase());
    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProfilePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <main className="app-shell" id="inicio">
      <div className="home-content">
        <header className="mobile-header">
          <button className="brand brand-button" onClick={() => navigate("Home")} aria-label="Speedeep, inicio">
            <span className="brand-mark"><i/><i/><i/></span><span>spee<span>deep</span></span>
          </button>
          <div className="header-actions">
            <button className="live-pill" onClick={() => navigate("Arena")} aria-label="Ir a Arena">Arena</button>
            <button className="profile-shortcut" onClick={() => navigate("Perfil")} aria-label="Abrir perfil"><UserAvatar photo={profilePhoto} initials={displayName.slice(0, 1).toUpperCase()} variant={avatar}/></button>
          </div>
        </header>

        {activeTab === "Home" && <>
        <section className="welcome-section">
          <p className="eyebrow">TU ESPACIO DE LECTURA</p>
          <h1>Hola, {displayName.split(" ")[0]}</h1>
          <p className="welcome-copy">Hoy puedes leer con más enfoque.</p>
        </section>

        <section className="today-card" id="practica" aria-labelledby="today-title">
          <div className="today-copy">
            <span className="today-kicker"><span className="sparkle">✦</span> TU SIGUIENTE PASO</span>
            <h2 id="today-title">Continúa tu ruta</h2>
            <p>Aprende a comprender y usar lo que lees, paso a paso.</p>
          </div>
          <div className="book-art" aria-hidden="true">
            <span className="speed-line line-one"/><span className="speed-line line-two"/><span className="speed-line line-three"/>
            <svg viewBox="0 0 220 140" fill="none">
              <path d="M18 51c28-13 54-12 91 5v60c-35-16-61-18-91-4V51Z" fill="#F8FCFF"/>
              <path d="M202 51c-28-13-54-12-93 5v60c37-16 63-18 93-4V51Z" fill="#D9F4F8"/>
              <path d="M109 56v60M31 65c20-7 42-5 62 3M31 78c20-6 42-4 62 4M31 91c20-6 42-3 62 5M189 65c-20-7-42-5-62 3M189 78c-20-6-42-4-62 4M189 91c-20-6-42-3-62 5" stroke="#76B6C9" strokeWidth="3" strokeLinecap="round"/>
              <path d="m163 28 20-12m-5 29 25-4" stroke="#42E1E1" strokeWidth="3" strokeLinecap="round"/>
              <path d="m182 10 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z" fill="#C4EC60"/>
            </svg>
          </div>
          <button className="primary-cta" onClick={() => navigate("Ruta")}>Ver mi ruta <Icon name="arrow"/></button>
        </section>

        <section className="metric-grid" aria-label="Tu progreso actual">
          <article className="metric-card metric-ppm"><span className="metric-icon"><Icon name="target"/></span><span className="metric-label">Ritmo</span><strong>{ppm === null ? "—" : Math.round(ppm)}{ppm !== null && <small> ppm</small>}</strong><small className="metric-note">{ppm === null ? "calibrando con varias lecturas" : "mediana de lecturas válidas"}</small></article>
          <article className="metric-card metric-comprehension"><span className="metric-icon"><Icon name="spark"/></span><span className="metric-label">Comprensión</span><strong>{comprehension === null ? "—" : comprehension}{comprehension !== null && <small>%</small>}</strong><small className="metric-note">{comprehension === null ? "se activa con 3 prácticas" : "promedio de las últimas prácticas"}</small></article>
          <article className="metric-card metric-streak"><span className="metric-icon streak-icon">✦</span><span className="metric-label">QSD</span><strong>—</strong><small className="metric-note">{dashboard?.stats.practicesCount ?? 0} prácticas · calibrando 6 habilidades</small></article>
        </section>

        <section className="milestone-card" id="ruta" aria-labelledby="milestone-title">
          <div className="milestone-art" aria-hidden="true"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="milestone-spark">✦</span><Icon name="book"/></div>
          <div className="milestone-content">
            <p className="eyebrow">TU PRÓXIMO HITO</p>
            <h2 id="milestone-title">{ppm === null ? <>Tu primer hito: <strong>300 ppm</strong></> : <>Vas acercándote a los <strong>{milestone} ppm</strong></>}</h2>
            <p className="milestone-club">{ppm === null ? "Se necesita evidencia de varias lecturas comparables" : `Referencia hacia ${milestone} ppm · club aún sin certificar`}</p>
            <div className="progress-track" role="progressbar" aria-label={`Avance hacia ${milestone} ppm`} aria-valuenow={Math.round(milestoneProgress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${milestoneProgress}%` }}/></div>
            <div className="milestone-foot"><span>{ppm === null ? "El primer objetivo es 300 ppm con comprensión" : milestoneDistance ? `Diferencia: ${milestoneDistance} ppm` : "Sigue leyendo con comprensión"}</span><strong>{ppm === null ? "—" : `${Math.round(ppm)} / ${milestone} ppm`}</strong></div>
          </div>
          <div className="milestone-glow" aria-hidden="true"/>
        </section>

        <section className="practice-nudge" aria-label="Continuar la ruta">
          <span className="nudge-icon"><Icon name="route"/></span><div><strong>{dashboard?.curriculum.diagnosticStatus !== "completed" ? "Descubre tu punto de partida" : dashboard?.curriculum.activeStep ? "Retoma tu misión 1.1" : "Tu próximo paso está en Ruta"}</strong><p>{dashboard?.curriculum.diagnosticStatus !== "completed" ? "Dos lecturas breves orientan tu plan." : dashboard?.curriculum.activeStep ? `Quedaste en el paso ${dashboard.curriculum.activeStep} de 6.` : "Aprende una habilidad y úsala en una lectura nueva."}</p></div><button onClick={() => navigate("Ruta")} aria-label="Abrir ruta"><Icon name="arrow"/></button>
        </section>
        </>}

        {activeTab === "Ruta" && <Curriculum diagnosticStatus={dashboard?.curriculum.diagnosticStatus} diagnosticStep={dashboard?.curriculum.diagnosticStep} onDiagnostic={() => { if (!user) setAuthOpen(true); else setDiagnosticOpen(true); }} onFlash={() => { if (!user) setAuthOpen(true); else setFlashOrigin("route"); }} activeStep={dashboard?.curriculum.activeStep} completedCount={dashboard?.curriculum.completedCount} onStart={() => { if (!user) setAuthOpen(true); else setMissionOpen(true); }}/>} 

        {activeTab === "Arena" && <section className="section-page" aria-labelledby="arena-heading">
          <p className="eyebrow">COMPETENCIA ENTRE LECTORES</p><h1 id="arena-heading">Arena</h1>
          <div className="route-notice"><strong>Las partidas en vivo estarán disponibles próximamente</strong><span>La sala conectará a participantes reales y medirá velocidad junto con comprensión. Aún no hay partidas ni rivales en esta versión.</span></div>
        </section>}

        {activeTab === "Prácticas" && <section className="section-page" aria-labelledby="practice-heading">
          <p className="eyebrow">LABORATORIO OPCIONAL</p><h1 id="practice-heading">Prácticas</h1>
          <p>Entrena habilidades a tu ritmo. Los resultados de este espacio no desbloquean lecciones ni acreditan clubes.</p>
          <button className="flash-lab-card" onClick={() => { if (!user) setAuthOpen(true); else setFlashOrigin("lab"); }}><span>✦</span><strong>Cifras fugaces</strong><small>{dashboard?.lab.numbersRounds ? `${3 + Math.floor(dashboard.lab.numbersRank / 3)} dígitos · escalón ${dashboard.lab.numbersRank % 3 + 1}/3 · ${dashboard.lab.numbersRounds} rondas` : "Ocho destellos · nivel adaptativo compartido con Ruta"}</small><b aria-hidden="true">→</b></button>
          <div className="variety-grid">{practiceModes.map(mode => <button key={mode.kind} className={`variety-card variety-${mode.kind}`} onClick={() => openLibrary(mode.kind)}><span className="variety-mark" aria-hidden="true">{mode.mark}</span><strong>{mode.title}</strong><small>{mode.description}</small></button>)}</div>
          <p className="section-note">Los destellos de palabras, las letras transpuestas y la ronda mixta se incorporarán después con su propio progreso.</p>
        </section>}

        {activeTab === "Perfil" && <section className="section-page" aria-labelledby="account-heading">
          <p className="eyebrow">TU CUENTA</p><h1 id="account-heading">Perfil</h1>
          <div className="account-card"><UserAvatar photo={profilePhoto} initials={displayName.slice(0, 1).toUpperCase()} variant={avatar} className="profile-large"/><div><strong>{displayName}</strong><span>{user?.email ?? "Inicia sesión para consultar tu cuenta"}</span></div></div>
          <button className="secondary-action" onClick={() => setProfileOpen(true)}>Editar mi avatar</button>
          {user && <button className="secondary-action" onClick={() => { setAuthMode("newPassword"); setAuthOpen(true); setAuthError(""); }}>Crear o cambiar contraseña</button>}
          <div className="account-card account-details"><div><strong>Membresía</strong><span>{!user ? "Inicia sesión para verla" : !dashboard ? "No disponible" : dashboard.membership ? ({trialing: "Periodo de prueba", active: "Activa", past_due: "Pago pendiente", canceled: "Cancelada", incomplete: "Incompleta", unpaid: "Sin pago", paused: "Pausada"} as Record<string, string>)[dashboard.membership.status] ?? dashboard.membership.status : "Sin registro de membresía"}</span>
          {dashboard?.membership?.status === "trialing" && <span>Prueba hasta el {new Date(dashboard.membership.trial_ends_at).toLocaleDateString("es-MX")}</span>}
          {dashboard?.membership?.current_period_ends_at && <span>Periodo hasta el {new Date(dashboard.membership.current_period_ends_at).toLocaleDateString("es-MX")}</span>}
          {dashboard?.membership?.cancel_at_period_end && <span>Renovación cancelada al terminar el periodo</span>}</div></div>
          {user ? <button className="secondary-action" onClick={signOut}>Cerrar sesión</button> : <button className="primary-cta" onClick={() => setAuthOpen(true)}>Entrar a mi cuenta</button>}
        </section>}
        {appError && <p className="app-alert" role="alert">{appError}</p>}
      </div>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {([{ label: "Home", icon: "home" }, { label: "Ruta", icon: "route" }, { label: "Arena", icon: "arena" }, { label: "Prácticas", icon: "practice" }, { label: "Perfil", icon: "profile" }] as const).map((item) => <button key={item.label} className={`nav-tab ${activeTab === item.label ? "active" : ""}`} onClick={() => navigate(item.label)} aria-current={activeTab === item.label ? "page" : undefined}><Icon name={item.icon}/><span>{item.label}</span></button>)}
      </nav>

      {libraryKind && <PracticeLibrary initialKind={libraryKind} onClose={() => setLibraryKind(null)} onRead={id => { setLibraryKind(null); void startPractice(id); }}/>} 
      {missionOpen && <MissionOne onClose={() => { setMissionOpen(false); void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }}/>} 
      {diagnosticOpen && <Diagnostic onClose={() => { setDiagnosticOpen(false); void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }} onFinish={() => { void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }}/>} 
      {flashOrigin && <FlashNumbers origin={flashOrigin} onClose={() => { setFlashOrigin(null); void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }}/>} 

      {profileOpen && <div className="sheet-backdrop" onClick={() => setProfileOpen(false)}><section className="profile-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle"/><button className="sheet-close" onClick={() => setProfileOpen(false)} aria-label="Cerrar perfil"><Icon name="close"/></button>
        <p className="eyebrow">TU CUENTA</p><h2 id="profile-title">Tu perfil</h2>
        <div className="profile-editor"><UserAvatar photo={profilePhoto} initials={displayName.slice(0, 1).toUpperCase()} variant={avatar} className="profile-large"/><div><strong>{displayName}</strong><span>{user?.email ?? "Inicia sesión para sincronizar tu progreso"}</span></div></div>
        <p className="avatar-label">Elige cómo quieres aparecer</p>
        <div className="avatar-options">{profileAvatars.map((variant) => <button key={variant} className={`avatar-option ${variant} ${avatar === variant && !profilePhoto ? "selected" : ""}`} onClick={() => { setAvatar(variant); setProfilePhoto(undefined); }} aria-label="Usar avatar"/>)}<label className="upload-avatar"><Icon name="camera"/><span>Subir foto</span><input type="file" accept="image/*" onChange={handlePhoto}/></label></div>
        <p className="profile-note">Puedes usar una foto tuya o elegir un avatar. La foto solo se conserva en este dispositivo por ahora.</p>
        {user ? <button className="secondary-action" onClick={signOut}>Cerrar sesión</button> : <button className="secondary-action" onClick={() => { setProfileOpen(false); setAuthOpen(true); }}>Entrar a mi cuenta</button>}
      </section></div>}

      {practiceOpen && practice && <div className="sheet-backdrop practice-backdrop" onClick={endPractice}><section className="practice-sheet" role="dialog" aria-modal="true" aria-labelledby="practice-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle"/><button className="sheet-close" onClick={endPractice} aria-label="Cerrar práctica"><Icon name="close"/></button>
        <div className="practice-topline"><span>{finished ? "REVISA LO QUE LEÍSTE" : "LECTURA CRONOMETRADA"}</span><strong>{minutes}:{secs}</strong></div><h2 id="practice-title">{practiceResult ? "Práctica guardada" : practice.article.title}</h2>
        {practiceResult ? <><p className="practice-instructions">Tu resultado quedó guardado en tu cuenta.</p><div className="result-grid"><div><strong>{Math.round(practiceResult.rawActivePpm)}</strong><span>ppm en esta lectura</span></div><div><strong>{practiceResult.comprehensionScore}%</strong><span>comprensión en esta práctica</span></div><div><strong>{practiceResult.correctAnswers}/{practiceResult.totalQuestions}</strong><span>respuestas</span></div></div><button className="primary-cta practice-action" onClick={endPractice}>Volver al inicio <Icon name="arrow"/></button></> : !finished ? <><p className="practice-instructions">Lee el texto a tu ritmo. El cronómetro mide solo esta lectura; al terminar, se detiene mientras respondes. Para una medición válida, lee durante al menos 10 segundos.</p><div className="passage">{practice.article.body}</div><button className="primary-cta practice-action" disabled={seconds < 10} onClick={() => { setRunning(false); setFinished(true); }}>{seconds < 10 ? "Lee un poco más…" : "Ya terminé de leer"} <Icon name="arrow"/></button></> : <><p className="practice-instructions">Responde para guardar la práctica. Tus respuestas se califican de forma segura.</p><div className="question-stack">{practice.questions.map((question, qIndex) => <div className="question-block" key={question.id}><strong>{qIndex + 1}. {question.prompt}</strong><div className="answer-list">{question.options.map((option, index) => <button key={`${question.id}-${index}`} className={`answer-option ${answers[question.id] === index ? "chosen" : ""}`} onClick={() => setAnswers((current) => ({ ...current, [question.id]: index }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div>)}</div>{appError && <p className="inline-error" role="alert">{appError}</p>}<button className="primary-cta practice-action" disabled={savingPractice || practice.questions.some((question) => answers[question.id] === undefined)} onClick={submitPractice}>{savingPractice ? "Guardando…" : "Guardar mi resultado"} <Icon name="arrow"/></button></>}
      </section></div>}

      {authOpen && <div className="sheet-backdrop" onClick={() => setAuthOpen(false)}><section className="profile-sheet auth-sheet" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={event => event.stopPropagation()}>
        <div className="sheet-handle"/><button className="sheet-close" onClick={() => setAuthOpen(false)} aria-label="Cerrar acceso"><Icon name="close"/></button>
        <p className="eyebrow">TU PROGRESO, A TU RITMO</p>
        <h2 id="auth-title">{authMode === "register" ? "Crea tu cuenta" : authMode === "recover" ? "Crea o recupera tu contraseña" : authMode === "newPassword" ? "Elige tu contraseña" : "Entra a Speedeep"}</h2>
        <p className="practice-instructions">{authMode === "recover" ? "Te enviaremos un correo de verificación. Después podrás elegir una contraseña y entrar aquí." : authMode === "register" ? "Regístrate con correo y contraseña. Confirma tu correo si se te solicita." : authMode === "newPassword" ? "Escribe una contraseña nueva para seguir usando esta cuenta." : "Usa tu correo y contraseña para volver a tu ruta."}</p>
        <form onSubmit={event => { event.preventDefault(); void submitAuth(); }}>
          {authMode !== "newPassword" && <><label className="form-label" htmlFor="auth-email">Correo electrónico</label><input id="auth-email" className="text-input" type="email" autoComplete="email" required value={authEmail} onChange={event => setAuthEmail(event.target.value)} placeholder="tu@correo.com"/></>}
          {authMode !== "recover" && <><label className="form-label" htmlFor="auth-password">Contraseña</label><input id="auth-password" className="text-input" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} required minLength={authMode === "login" ? 1 : 10} maxLength={128} value={authPassword} onChange={event => setAuthPassword(event.target.value)} placeholder={authMode === "login" ? "Tu contraseña" : "Al menos 10 caracteres"}/></>}
          {(authMode === "register" || authMode === "newPassword") && <><label className="form-label" htmlFor="auth-confirm">Confirma tu contraseña</label><input id="auth-confirm" className="text-input" type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={authConfirm} onChange={event => setAuthConfirm(event.target.value)}/></>}
          <button className="primary-cta" type="submit" disabled={authBusy || (authMode !== "newPassword" && !authEmail) || (authMode !== "recover" && !authPassword)}>{authBusy ? "Procesando…" : authMode === "register" ? "Crear cuenta" : authMode === "recover" ? "Enviar instrucciones" : authMode === "newPassword" ? "Guardar contraseña" : "Entrar"}</button>
        </form>
        {authMode === "login" && <><button className="text-action" onClick={() => { setAuthMode("recover"); setAuthError(""); setAuthMessage(""); }}>Crear o recuperar contraseña</button><button className="text-action" onClick={() => { setAuthMode("register"); setAuthError(""); setAuthMessage(""); }}>Soy nuevo: crear cuenta</button></>}
        {authMode === "recover" || authMode === "register" ? <button className="text-action" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); }}>Ya tengo contraseña</button> : null}
        {authMessage && <p className="success-note" role="status">{authMessage}</p>}{authError && <p className="inline-error" role="alert">{authError}</p>}
      </section></div>}
    </main>
  );
}
