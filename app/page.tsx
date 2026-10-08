"use client";

import { ChangeEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import PracticeLibrary, { practiceModes, type PracticeKind } from "@/app/components/PracticeLibrary";
import Curriculum from "@/app/components/Curriculum";
import MissionOne from "@/app/components/MissionOne";
import Diagnostic from "@/app/components/Diagnostic";
import FlashNumbers from "@/app/components/FlashNumbers";

type IconName = "home" | "route" | "arena" | "practice" | "profile" | "arrow" | "book" | "spark" | "heart" | "camera" | "close" | "target";
type PracticeQuestion = { id: string; prompt: string; options: string[] };
type PracticeData = { article: { id: string; slug: string; title: string; body: string; word_count: number; estimated_minutes: number }; questions: PracticeQuestion[] };
type Dashboard = { user: { name: string; avatarUrl: string | null }; stats: { latestPpm: number | null; latestReadingPpm: number | null; previousReadingPpm: number | null; speedEvidenceCount: number; comprehension: number | null; practicesCount: number; readingsCount: number; trainingCount: number; flashRounds: number; diagnosticCompleted: boolean; lessonsCompleted: number; qsdState: string }; membership: { status: string; trial_ends_at: string; current_period_ends_at: string | null; cancel_at_period_end: boolean } | null; curriculum: { activeStep: number | null; activeLessonCode: string | null; completedCount: number; lessonTransferScores: Record<string, number>; lessonBestTransferScores: Record<string, number>; curiousCompleted: string[]; paragraphFirstCompleted: boolean; paragraphSecondCompleted: boolean; paragraphThirdCompleted: boolean; paragraphFourthCompleted: boolean; textCompleted: string[]; monitorCompleted: string[]; monitorIntegration: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] }; textIntegration: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] }; paragraphIntegration: { attempted: boolean; passed: boolean; correct: number | null; missing: string[] }; lastTransferCorrect: number | null; sentenceActionState: "not_started" | "completed" | "demonstrated"; sentenceChunkState: "not_started" | "completed"; integration: { attempted: boolean; passed: boolean; correct: number | null }; diagnosticStatus: "not_started" | "active" | "completed"; diagnosticStep: number | null }; lab: { numbersRank: number; numbersRounds: number } };
type Anchor = { nextArticleId: string | null; baselinePpm: number | null; baselineComprehension: number | null; comparisonPpm: number | null; comparisonComprehension: number | null; deltaPpm: number | null };
type Calibration = { nextArticleId: string | null; count: number; latestPpm: number | null; latestComprehension: number | null };
type DashboardWithAnchor = Dashboard & { anchor: Anchor; calibration: Calibration; activityTimes: string[]; integratedReadings: Record<string, { articleId: string | null; ppm: number | null; comprehension: number | null; eligible: boolean; completedAt: string | null }> };
type PracticeCatalog = { exercises: { id: string; title: string; kind: PracticeKind; estimated_minutes: number; lastScore: number | null; lastDurationSeconds: number | null; lastCompletedAt: string | null; scoreChange: number | null }[]; recentResult: { title: string; kind: PracticeKind; lastScore: number; lastDurationSeconds: number | null; lastCompletedAt: string; scoreChange: number | null } | null };
type Tab = "Home" | "Ruta" | "Arena" | "Prácticas" | "Perfil";
const tabs: Tab[] = ["Home", "Ruta", "Arena", "Prácticas", "Perfil"];

const profileAvatars = ["avatar-aqua", "avatar-violet", "avatar-coral", "avatar-lime"];
const subscribeMinute = (notify: () => void) => { const timer = window.setInterval(notify, 30_000); return () => window.clearInterval(timer); };
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => 0;

const routeMissions = [
  { level: "1.1", codes: ["1.1", "1.2", "1.3", "1.4"], titles: ["Conservar la acción central", "Unir palabras que van juntas", "Seguir los conectores", "Resolver vocabulario"], closure: "1.C", closureTitle: "Comprende oraciones nuevas", passed: "integration" },
  { level: "1.2", codes: ["2.1", "2.2", "2.3", "2.4"], titles: ["Di de qué trata el párrafo", "Separa idea y apoyo", "Conecta oraciones", "Conserva la esencia"], closure: "2.C", closureTitle: "Comprende párrafos nuevos", passed: "paragraphIntegration" },
  { level: "1.3", codes: ["3.1", "3.2", "3.3", "3.4"], titles: ["Ordena los hechos", "Descubre qué causó el cambio", "Compara posturas", "Infiere con evidencias"], closure: "3.C", closureTitle: "Comprende textos nuevos", passed: "textIntegration" },
  { level: "1.4", codes: ["4.1", "4.2", "4.3", "4.4"], titles: ["Detecta la pérdida de sentido", "Elige cómo reparar", "Vuelve con un propósito", "Recupera el foco"], closure: "4.C", closureTitle: "Recupera el sentido", passed: "monitorIntegration" },
] as const;

function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weeklyActivity(times: string[], now: Date | null) {
  if (!now) return { days: [] as { key: string; label: string; active: boolean; today: boolean; future: boolean }[], streak: 0, activeDays: 0, todayDone: false };
  const active = new Set(times.map(value => new Date(value)).filter(date => !Number.isNaN(date.getTime())).map(localDay));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    return { key: localDay(date), label: ["L", "M", "M", "J", "V", "S", "D"][index], active: active.has(localDay(date)), today: localDay(date) === localDay(today), future: date > today };
  });
  const cursor = new Date(today);
  if (!active.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (active.has(localDay(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return { days, streak, activeDays: active.size, todayDone: active.has(localDay(today)) };
}

function homeMission(dashboard: DashboardWithAnchor | null) {
  if (!dashboard || dashboard.curriculum.diagnosticStatus !== "completed") return { kind: "diagnostic" as const, code: "", level: "1.1", title: "Descubre tu punto de partida", detail: "Dos lecturas breves orientarán tu entrenamiento.", label: "Diagnóstico inicial", action: dashboard?.curriculum.diagnosticStatus === "active" ? "Retomar diagnóstico" : "Comenzar ahora" };
  const activeCode = dashboard.curriculum.activeLessonCode;
  for (const group of routeMissions) {
    for (let index = 0; index < group.codes.length; index++) {
      const code = group.codes[index];
      if (activeCode === code || (dashboard.curriculum.lessonBestTransferScores[code] ?? -1) < 1) return { kind: "lesson" as const, code, level: group.level, title: group.titles[index], detail: `Nivel ${group.level} · Lección ${index + 1}. Entrena una habilidad y aplícala en casos nuevos.`, label: `Lección ${index + 1}`, action: activeCode === code ? "Retomar lección" : dashboard.curriculum.lessonTransferScores[code] === 0 ? "Reforzar lección" : "Comenzar entrenamiento" };
    }
    if (activeCode === group.closure || !dashboard.curriculum[group.passed].passed) return { kind: "lesson" as const, code: group.closure, level: group.level, title: group.closureTitle, detail: `Nivel ${group.level} · Comprueba tus habilidades en casos nuevos.`, label: "Comprobación", action: activeCode === group.closure ? "Retomar comprobación" : "Comenzar comprobación" };
    const reading = dashboard.integratedReadings?.[group.level];
    if (reading?.articleId && !reading.completedAt) return { kind: "integrated" as const, code: reading.articleId, level: group.level, title: "Aplica todo en una lectura", detail: `Nivel ${group.level} · Lee un texto nuevo, responde seis preguntas y mide tus ppm para los Clubs.`, label: "Lectura integradora", action: "Comenzar evaluación" };
  }
  return { kind: "practice" as const, code: "", level: "1.4", title: "Sigue entrenando tu atención", detail: "Una práctica breve mantiene activa tu lectura.", label: "Práctica curiosa", action: "Elegir práctica" };
}

function labRecommendation(dashboard: DashboardWithAnchor | null, catalog: PracticeCatalog | null): { kind: PracticeKind | "flash"; title: string; reason: string } {
  if (!dashboard?.stats.diagnosticCompleted || !dashboard.lab.numbersRounds) return { kind: "flash", title: "Cifras fugaces", reason: "Ocho destellos para activar tu atención." };
  const scores = dashboard.curriculum.lessonTransferScores;
  const missing = dashboard.curriculum.paragraphIntegration.missing;
  let kind: PracticeKind | null = null;
  if (missing.includes("paragraph_main_idea") || scores["2.1"] === 0 || scores["1.1"] === 0) kind = "main_idea";
  else if (missing.includes("paragraph_support") || scores["2.2"] === 0) kind = "relevance";
  else if (missing.includes("paragraph_reference") || scores["2.3"] === 0) kind = "find_data";
  else if (scores["1.3"] === 0) kind = "sequence";
  const weakest = catalog?.exercises.filter(e => e.lastScore !== null && e.lastScore < 70).sort((a,b) => (a.lastScore ?? 0) - (b.lastScore ?? 0))[0];
  if (!kind && weakest) kind = weakest.kind;
  if (!kind) kind = (["find_data", "sequence", "main_idea", "relevance"] as const)[dashboard.stats.trainingCount % 4];
  return { kind, title: practiceModes.find(mode => mode.kind === kind)?.title ?? "Práctica breve", reason: weakest?.kind === kind && !missing.length ? "Puedes mejorar tu resultado anterior con otra variante." : "Un reto breve para entrenar esta habilidad." };
}

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
  const [dashboard, setDashboard] = useState<DashboardWithAnchor | null>(null);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, serverMinute);
  const userEmail = user?.email;
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
  const [missionCode, setMissionCode] = useState<"1.1" | "1.2" | "1.3" | "1.4" | "1.C" | "2.1" | "2.2" | "2.3" | "2.4" | "2.C" | "3.1" | "3.2" | "3.3" | "3.4" | "3.C" | "4.1" | "4.2" | "4.3" | "4.4" | "4.C" | null>(null);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [flashOrigin, setFlashOrigin] = useState<"route" | "lab" | "diagnostic" | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>();
  const [avatar, setAvatar] = useState(profileAvatars[0]);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceOrigin, setPracticeOrigin] = useState<"route" | "lab">("lab");
  const [libraryKind, setLibraryKind] = useState<PracticeKind | null>(null);
  const [practiceCatalog, setPracticeCatalog] = useState<PracticeCatalog | null>(null);
  const [practiceCatalogError, setPracticeCatalogError] = useState("");
  const [libraryRoute, setLibraryRoute] = useState<{ level: "1.1" | "1.2" | "1.3" | "1.4"; after: 1 | 3 } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [readingStarted, setReadingStarted] = useState(false);
  const [startingReading, setStartingReading] = useState(false);
  const readingStartRequest = useRef<AbortController | null>(null);
  const [finished, setFinished] = useState(false);
  const [practice, setPractice] = useState<PracticeData | null>(null);
  const [practiceTicket, setPracticeTicket] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [savingPractice, setSavingPractice] = useState(false);
  const [practiceResult, setPracticeResult] = useState<{ rawActivePpm: number; comprehensionScore: number; correctAnswers: number; totalQuestions: number; speedEligible: boolean; skillResults?: { label: string; correct: number; total: number }[] } | null>(null);

  const mission = homeMission(dashboard);
  const activity = weeklyActivity(dashboard?.activityTimes ?? [], minute ? new Date(minute * 60_000) : null);
  const levelGroup = routeMissions.find(group => group.level === mission.level) ?? routeMissions[0];
  const levelLessons = levelGroup.codes.filter(code => (dashboard?.curriculum.lessonBestTransferScores[code] ?? -1) >= 1).length;
  const curiousKind: PracticeKind = (dashboard?.stats.trainingCount ?? 0) % 2 === 0 ? "find_data" : "sequence";
  const recommendedLab = labRecommendation(dashboard, practiceCatalog);

  const startHomeMission = () => {
    if (!user) { setAuthOpen(true); return; }
    if (mission.kind === "diagnostic") setDiagnosticOpen(true);
    else if (mission.kind === "lesson") setMissionCode(mission.code as NonNullable<typeof missionCode>);
    else if (mission.kind === "integrated") void startPractice(mission.code, "route");
    else openLibrary("find_data");
  };

  const measuredPpm = ppm ?? dashboard?.stats.latestReadingPpm ?? null;
  const hasReference = ppm !== null;
  const comparisonPpm = dashboard?.stats.previousReadingPpm ?? null;
  const readingDelta = measuredPpm !== null && comparisonPpm !== null && dashboard?.stats.latestReadingPpm !== null
    ? dashboard!.stats.latestReadingPpm! - comparisonPpm : null;
  const gaugeRatio = measuredPpm === null ? 0 : Math.max(0, Math.min(measuredPpm / 500, 1));
  const gaugeX = 160 - 130 * Math.cos(Math.PI * gaugeRatio);
  const gaugeY = 149 - 130 * Math.sin(Math.PI * gaugeRatio);
  const clubSpeedProgress = ppm === null ? null : Math.min(100, Math.round(ppm / 300 * 100));
  const qsdMeasured = [comprehension !== null, ppm !== null].filter(Boolean).length;
  const qsdEvidenceProgress = Math.round(qsdMeasured / 3 * 100);

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
    if (activeTab !== "Prácticas" || !userEmail || libraryKind) return;
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal, cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar tus prácticas.");
      setPracticeCatalog(data); setPracticeCatalogError("");
    }).catch(error => { if (!controller.signal.aborted) setPracticeCatalogError(error instanceof Error ? error.message : "No se pudieron cargar tus prácticas."); });
    return () => controller.abort();
  }, [activeTab, userEmail, libraryKind]);

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

  const openLibrary = (kind: PracticeKind = "reading", route: { level: "1.1" | "1.2" | "1.3" | "1.4"; after: 1 | 3 } | null = null) => {
    if (!user) { setAuthOpen(true); setAuthError(""); return; }
    if (!route) setActiveTab("Prácticas");
    setLibraryRoute(route); setLibraryKind(kind);
  };

  const startPractice = async (articleId?: string, origin: "route" | "lab" = "lab") => {
    setAppError("");
    if (!user) { setAuthOpen(true); setAuthError(""); return; }
    try {
      const response = await fetch(articleId ? `/api/practice?articleId=${encodeURIComponent(articleId)}` : "/api/practice");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo cargar la lectura.");
      setPractice(data);
      setPracticeResult(null);
      setAnswers({});
      setPracticeTicket(null);
      setSeconds(0);
      setFinished(false);
      setRunning(false);
      setReadingStarted(false);
      setPracticeOrigin(origin);
      setActiveTab(origin === "route" ? "Ruta" : "Prácticas");
      setPracticeOpen(true);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "No se pudo iniciar la práctica.");
    }
  };

  const beginReading = async () => {
    if (!practice || startingReading || readingStarted) return;
    const controller = new AbortController();
    readingStartRequest.current = controller;
    setStartingReading(true); setAppError("");
    try {
      const response = await fetch("/api/practice/start", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId: practice.article.id }) });
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar la lectura.");
      setPracticeTicket(data.ticketId);
      setSeconds(0);
      setReadingStarted(true);
      setRunning(true);
    } catch (error) {
      if (!controller.signal.aborted) setAppError(error instanceof Error ? error.message : "No se pudo iniciar la lectura.");
    } finally { if (readingStartRequest.current === controller) { readingStartRequest.current = null; setStartingReading(false); } }
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
    readingStartRequest.current?.abort();
    readingStartRequest.current = null;
    setStartingReading(false);
    setPracticeOpen(false);
    setRunning(false);
    setFinished(false);
    setReadingStarted(false);
    setPractice(null);
    setPracticeTicket(null);
    // La ruta ya está activa; evitar una navegación de Next al cerrar la lectura.
    if (practiceOrigin === "route") setActiveTab("Ruta");
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
            <span className="header-streak" aria-label={`Racha de ${activity.streak} días`}>✦ {activity.streak} {activity.streak === 1 ? "día" : "días"}</span>
            <button className="profile-shortcut" onClick={() => navigate("Perfil")} aria-label="Abrir perfil"><UserAvatar photo={profilePhoto} initials={displayName.slice(0, 1).toUpperCase()} variant={avatar}/></button>
          </div>
        </header>

        {activeTab === "Home" && <>
        <section className="welcome-section">
          <p className="eyebrow">MI ESPACIO DE LECTURA</p>
          <h1>{activity.todayDone ? "¡Ya comenzaste!" : "¡Vamos por 5 minutos!"} <span aria-hidden="true">{activity.todayDone ? "✦" : "👋"}</span></h1>
          <p className="welcome-copy">{activity.todayDone ? `${displayName.split(" ")[0]}, tu siguiente reto te espera.` : `${displayName.split(" ")[0]}, un pequeño entrenamiento puede abrir un gran avance.`}</p>
        </section>

        <section className="daily-mission" aria-labelledby="daily-title">
          <div className="daily-mission-top"><span>{activity.todayDone ? "TU SIGUIENTE RETO" : "TU MISIÓN DE HOY"}</span><span aria-hidden="true">✦</span></div>
          <h2 id="daily-title">{mission.title}</h2>
          <p>{mission.detail}</p>
          <div className="daily-mission-meta"><span>◷ {mission.kind === "diagnostic" ? "5–7 minutos" : "5 minutos"}</span><span>▣ {mission.label}</span></div>
          {activity.todayDone && <div className="mission-done" role="status">✓ Actividad de hoy guardada</div>}
          <button className="primary-cta" onClick={startHomeMission}>{mission.action} <Icon name="arrow"/></button>
        </section>

        <section className="week-progress" aria-labelledby="week-progress-title">
          <div className="home-section-heading"><h2 id="week-progress-title">Mi avance</h2><button onClick={() => navigate("Ruta")}>Ver ruta <Icon name="arrow"/></button></div>
          <div className="daily-overview" aria-label="Tu avance"><div><strong>{mission.level}</strong><span>Nivel actual</span></div><div><strong>{levelLessons}/4</strong><span>Lecciones</span></div><div><strong>{activity.days.filter(day => day.active).length}</strong><span>Días esta semana</span></div></div>
          <p className="week-caption">Tu semana de práctica</p>
          <div className="week-days">{activity.days.map(day => <div key={day.key} className="week-day"><span>{day.label}</span><b className={`${day.active ? "is-active" : ""} ${day.today ? "is-today" : ""}`} aria-label={`${day.key}: ${day.active ? "actividad completada" : day.future ? "día futuro" : "sin actividad"}`}>{day.active ? "✓" : ""}</b></div>)}</div>
          <small>{activity.streak > 0 ? `${activity.streak} ${activity.streak === 1 ? "día seguido" : "días seguidos"} · cuenta tu constancia, no tu velocidad` : activity.activeDays > 0 ? "Retoma a tu ritmo; cada actividad terminada cuenta." : "Cada día con una actividad terminada cuenta."}</small>
        </section>

        <button className="curious-home" onClick={() => openLibrary(curiousKind)}>
          <span className="curious-home-icon" aria-hidden="true">✦</span>
          <span><small>LABORATORIO DE LECTURA</small><strong>{curiousKind === "find_data" ? "Busca el dato escondido" : "Ordena la historia"}</strong><em>{curiousKind === "find_data" ? "Atención y búsqueda" : "Secuencias"} · reto breve</em></span>
          <Icon name="arrow"/>
        </button>

        <section className="speed-card" aria-labelledby="speed-title">
          <div className="speed-card-title"><span className="speed-icon" aria-hidden="true">◴</span><h2 id="speed-title">Velocidad de lectura</h2></div>
          <div className={`speed-gauge ${measuredPpm === null ? "speed-gauge-pending" : "speed-gauge-measured"}`} role="img" aria-label={measuredPpm === null ? "Velocidad pendiente de medir; escala de 0 a 500 ppm" : `${Math.round(measuredPpm)} palabras por minuto en escala de 0 a 500` }>
            <svg viewBox="0 -22 320 205" aria-hidden="true" focusable="false">
              <defs><linearGradient id="speed-gauge-gradient"><stop offset="0%" stopColor="#087c9d"/><stop offset="43%" stopColor="#08b8c8"/><stop offset="66%" stopColor="#b9e34a"/><stop offset="83%" stopColor="#ffba4b"/><stop offset="100%" stopColor="#ff875e"/></linearGradient></defs>
              <path d="M 30 149 A 130 130 0 0 1 290 149" fill="none" stroke="#e5edf0" strokeWidth="19" strokeLinecap="round"/>
              <path d="M 30 149 A 130 130 0 0 1 290 149" fill="none" stroke="url(#speed-gauge-gradient)" strokeWidth="19" strokeLinecap="round" opacity={measuredPpm === null ? .35 : 1}/>
              {measuredPpm !== null && <><circle className="speed-gauge-halo" cx={gaugeX} cy={gaugeY} r="20" fill="#08b8c8"/><circle className="speed-gauge-marker" cx={gaugeX} cy={gaugeY} r="15" fill="#fff"/><circle className="speed-gauge-marker" cx={gaugeX} cy={gaugeY} r="10" fill="#1689cb"/></>}
            </svg>
            <div className="speed-gauge-value"><strong>{measuredPpm === null ? "Pendiente" : Math.round(measuredPpm)}</strong>{measuredPpm !== null && <span>ppm</span>}<small>{measuredPpm === null ? "de medir" : hasReference ? "Referencia comparable" : "Última lectura válida"}</small></div>
            <div className="speed-gauge-scale"><span>0</span><span>500 ppm</span></div>
          </div>
          <div className="speed-card-context">
            {measuredPpm === null ? <span>Empieza con el diagnóstico y reúne lecturas comparables para conocer tu velocidad.</span>
              : <span>{hasReference ? `Mediana de ${dashboard?.stats.speedEvidenceCount ?? 0} lecturas comparables.` : `${dashboard?.stats.speedEvidenceCount ?? 0}/3 lecturas comparables para establecer tu referencia.`}{readingDelta !== null ? ` Última lectura: ${readingDelta > 0 ? "+" : ""}${readingDelta} ppm frente a la anterior.` : ""}</span>}
            {comprehension !== null && <strong>Comprensión {comprehension}%</strong>}
          </div>
          {dashboard?.curriculum.diagnosticStatus === "completed" && (dashboard.calibration.count ?? 0) < 3 && dashboard.calibration.nextArticleId && <button className="speed-next-read" onClick={() => { void startPractice(dashboard.calibration.nextArticleId!, "route"); }}>Hacer lectura comparable {dashboard.calibration.count + 1} de 3 <Icon name="arrow"/></button>}
        </section>

        <details className="qsd-card">
          <summary><span className="qsd-mark" aria-hidden="true">Q·S·D</span><span><strong>Tu avance QSD</strong><small>{qsdMeasured}/3 dimensiones con medición · {qsdEvidenceProgress}% de cobertura</small></span><span className="qsd-expand" aria-hidden="true">⌄</span></summary>
          <p>QSD reúne comprensión, velocidad y lectura con propósito. La cobertura indica qué dimensiones tienen evidencia suficiente; no es una calificación.</p>
          <div className="qsd-dimensions">
            <div><b>Q · Comprensión</b><strong>{comprehension === null ? "Pendiente de medir" : `${comprehension}%`}</strong><small>Idea principal, conexiones, inferencias y autocontrol a partir de lecturas distintas.</small></div>
            <div><b>S · Velocidad</b><strong>{ppm === null ? "Pendiente de medir" : `${Math.round(ppm)} ppm`}</strong><small>Ritmo y continuidad con comprensión suficiente en textos comparables. La puntuación S aún no está calibrada.</small></div>
            <div><b>D · Propósito</b><strong>Pendiente de medir</strong><small>Adaptar la lectura para explorar, localizar datos o comprender a fondo. Falta una evaluación específica para asignar calificación.</small></div>
          </div>
        </details>

        <section className="club-goal" aria-labelledby="club-title">
          <div className="club-goal-head"><span className="club-goal-icon" aria-hidden="true">🏆</span><h2 id="club-title">Tu progreso hacia el Club 300</h2></div>
          <div className="club-goal-numbers"><strong>{ppm === null ? "Referencia pendiente" : <>{Math.round(ppm)} <span>/ 300 ppm</span></>}</strong>{clubSpeedProgress !== null && <b>{clubSpeedProgress}%</b>}</div>
          <div className="club-goal-track" role={clubSpeedProgress === null ? undefined : "progressbar"} aria-label="Avance de velocidad hacia 300 ppm; no acredita el club" aria-valuenow={clubSpeedProgress ?? undefined} aria-valuemin={clubSpeedProgress === null ? undefined : 0} aria-valuemax={clubSpeedProgress === null ? undefined : 100}><span style={{width: `${clubSpeedProgress ?? 0}%`}}/></div>
          <p>{ppm === null ? "Completa tres lecturas válidas y comparables para establecer tu referencia." : ppm < 300 ? `Te faltan ${Math.round(300 - ppm)} ppm de referencia para llegar a 300.` : "Ya alcanzaste la velocidad objetivo en tu referencia."}</p>
          <small>El Club 300 requiere también comprensión suficiente y evaluación comparable; esta barra no acredita el hito.</small>
        </section>

        <details className="home-history"><summary>Ver toda mi actividad</summary><div><span>Diagnóstico: {dashboard?.stats.diagnosticCompleted ? "completado" : "pendiente"}</span><span>{dashboard?.stats.lessonsCompleted ?? 0} lecciones terminadas</span><span>{dashboard?.stats.readingsCount ?? 0} lecturas</span><span>{dashboard?.stats.trainingCount ?? 0} ejercicios</span><span>{dashboard?.stats.flashRounds ?? 0} rondas de cifras</span></div></details>
        </>}

        {activeTab === "Ruta" && <Curriculum diagnosticStatus={dashboard?.curriculum.diagnosticStatus} diagnosticStep={dashboard?.curriculum.diagnosticStep} onDiagnostic={() => { if (!user) setAuthOpen(true); else setDiagnosticOpen(true); }} onFlash={() => { if (!user) setAuthOpen(true); else setFlashOrigin("route"); }} activeStep={dashboard?.curriculum.activeStep} activeLessonCode={dashboard?.curriculum.activeLessonCode} completedCount={dashboard?.curriculum.completedCount} lessonTransferScores={dashboard?.curriculum.lessonTransferScores} lessonBestTransferScores={dashboard?.curriculum.lessonBestTransferScores} sentenceActionState={dashboard?.curriculum.sentenceActionState} integration={dashboard?.curriculum.integration} paragraphFirstCompleted={dashboard?.curriculum.paragraphFirstCompleted} paragraphSecondCompleted={dashboard?.curriculum.paragraphSecondCompleted} paragraphThirdCompleted={dashboard?.curriculum.paragraphThirdCompleted} paragraphFourthCompleted={dashboard?.curriculum.paragraphFourthCompleted} paragraphIntegration={dashboard?.curriculum.paragraphIntegration} textCompleted={dashboard?.curriculum.textCompleted} textIntegration={dashboard?.curriculum.textIntegration} monitorCompleted={dashboard?.curriculum.monitorCompleted} monitorIntegration={dashboard?.curriculum.monitorIntegration} curiousRotation={(dashboard?.stats.trainingCount ?? 0) + (dashboard?.stats.flashRounds ?? 0)} curiousCompleted={dashboard?.curriculum.curiousCompleted} onCuriousPractice={(kind, level, after) => openLibrary(kind, { level, after })} integratedReadings={dashboard?.integratedReadings} onIntegratedRead={id => { void startPractice(id, "route"); }} onStart={code => { if (!user) setAuthOpen(true); else setMissionCode(code); }}/>} 

        {activeTab === "Arena" && <section className="section-page" aria-labelledby="arena-heading">
          <p className="eyebrow">COMPETENCIA ENTRE LECTORES</p><h1 id="arena-heading">Arena</h1>
          <div className="route-notice"><strong>Las partidas en vivo estarán disponibles próximamente</strong><span>La sala conectará a participantes reales y medirá velocidad junto con comprensión. Aún no hay partidas ni rivales en esta versión.</span></div>
        </section>}

        {activeTab === "Prácticas" && <section className="section-page" aria-labelledby="practice-heading">
          <p className="eyebrow">LABORATORIO OPCIONAL</p><h1 id="practice-heading">Prácticas</h1>
          <p>Entrena habilidades a tu ritmo. Los resultados de este espacio no desbloquean lecciones ni acreditan clubes.</p>
          <button className="practice-featured" onClick={() => { if (recommendedLab.kind === "flash") { if (!user) setAuthOpen(true); else setFlashOrigin("lab"); } else openLibrary(recommendedLab.kind); }}>
            <span className="practice-featured-badge">RECOMENDADO PARA TI</span><strong>{recommendedLab.title}</strong><span>{recommendedLab.reason}</span><small>{recommendedLab.kind === "flash" ? "8 destellos · reto breve" : "Ejercicios variables · práctica opcional"}</small><b aria-hidden="true">→</b>
          </button>
          <div className="variety-grid">{practiceModes.map(mode => {
            const results = practiceCatalog?.exercises.filter(exercise => exercise.kind === mode.kind) ?? [];
            const latest = results.filter(exercise => exercise.lastCompletedAt).sort((a,b) => (b.lastCompletedAt ?? "").localeCompare(a.lastCompletedAt ?? ""))[0];
            return <button key={mode.kind} className={`variety-card variety-${mode.kind}`} onClick={() => openLibrary(mode.kind)}><span className="variety-mark" aria-hidden="true">{mode.mark}</span><strong>{mode.title}</strong><small>{mode.description}</small><span className="variety-card-foot"><span>{latest?.lastScore !== null && latest?.lastScore !== undefined ? `Último ${latest.lastScore}%` : mode.kind === "reading" ? "Lecturas disponibles" : results.length ? `${results.length} retos` : "Explorar"}</span><span>{mode.kind === "reading" ? "↗" : "→"}</span></span></button>;
          })}</div>
          {recommendedLab.kind !== "flash" && <button className="flash-lab-card flash-lab-secondary" onClick={() => { if (!user) setAuthOpen(true); else setFlashOrigin("lab"); }}><span>✦</span><strong>Cifras fugaces</strong><small>{dashboard?.lab.numbersRounds ? `${dashboard.lab.numbersRounds} rondas · nivel ${3 + Math.floor(dashboard.lab.numbersRank / 3)} dígitos` : "8 destellos · atención visual"}</small><b aria-hidden="true">→</b></button>}
          <section className="lab-results" aria-label="Resultados recientes"><div className="home-section-heading"><h2>Mi resultado reciente</h2><button onClick={() => openLibrary(practiceCatalog?.recentResult?.kind ?? "find_data")}>Ver retos <Icon name="arrow"/></button></div>
            {practiceCatalog?.recentResult ? <div className="lab-result-row"><span className="lab-result-icon" aria-hidden="true">✦</span><div><strong>{practiceCatalog.recentResult.title}</strong><small>{new Date(practiceCatalog.recentResult.lastCompletedAt).toLocaleDateString("es-MX")}</small></div><span><strong>{practiceCatalog.recentResult.lastScore}%</strong><small>precisión</small></span>{practiceCatalog.recentResult.lastDurationSeconds !== null && <span><strong>{Math.floor(practiceCatalog.recentResult.lastDurationSeconds / 60)}:{String(practiceCatalog.recentResult.lastDurationSeconds % 60).padStart(2,"0")}</strong><small>tiempo</small></span>}{practiceCatalog.recentResult.scoreChange !== null && <span><strong>{practiceCatalog.recentResult.lastScore - practiceCatalog.recentResult.scoreChange}% → {practiceCatalog.recentResult.lastScore}%</strong><small>intento anterior → actual</small></span>}</div> : <p>Completa un reto y aquí verás tu precisión y tiempo.</p>}
          </section>
          {practiceCatalogError && <p className="inline-error" role="alert">{practiceCatalogError}</p>}
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

      {libraryKind && <PracticeLibrary initialKind={libraryKind} origin={libraryRoute ? "route" : "lab"} routeLevel={libraryRoute?.level} routeAfter={libraryRoute?.after} onClose={() => { setLibraryKind(null); setLibraryRoute(null); void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }} onRead={id => { setLibraryKind(null); void startPractice(id); }}/>} 
      {missionCode && <MissionOne key={missionCode} lessonCode={missionCode} onClose={() => { setMissionCode(null); void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }}/>} 
      {diagnosticOpen && <Diagnostic onClose={() => { setDiagnosticOpen(false); void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }} onFinish={() => { void refreshDashboard().catch(error => setAppError(error instanceof Error ? error.message : "No se pudo actualizar tu progreso.")); }} onCalibrate={() => { setDiagnosticOpen(false); setFlashOrigin("diagnostic"); }}/>} 
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

      {practiceOpen && practice && <div className="sheet-backdrop practice-backdrop" onClick={endPractice}><section className="practice-sheet" role="dialog" aria-modal="true" aria-labelledby="practice-title" onClick={event => event.stopPropagation()}>
        <div className="sheet-handle"/><button className="sheet-close" onClick={endPractice} aria-label="Cerrar práctica"><Icon name="close"/></button>
        <div className="practice-topline"><span>{practiceResult ? "LECTURA GUARDADA" : finished ? "REVISA LO QUE LEÍSTE" : practiceOrigin === "route" ? "TU LECTURA DE REFERENCIA" : "LECTURA CRONOMETRADA"}</span><strong>{minutes}:{secs}</strong></div>
        <h2 id="practice-title">{practiceResult ? "Lectura guardada" : practice.article.title}</h2>
        {practiceResult ? <>
          <p className="practice-instructions">Compara siempre tu velocidad junto con la comprensión.</p>
          <div className="result-grid"><div><strong>{Math.round(practiceResult.rawActivePpm)}</strong><span>ppm en esta lectura</span></div><div><strong>{practiceResult.comprehensionScore}%</strong><span>comprensión</span></div><div><strong>{practiceResult.correctAnswers}/{practiceResult.totalQuestions}</strong><span>respuestas</span></div></div>
          {practiceResult.skillResults && <div className="integrated-skill-results" aria-label="Resultado por habilidad">{practiceResult.skillResults.map(skill => <span key={skill.label}><strong>{skill.label}</strong><b>{skill.correct}/{skill.total}</b></span>)}</div>}
          <p className="practice-instructions">{practiceResult.speedEligible && (practice.article.slug.startsWith("integracion-") || practice.article.slug.startsWith("calibracion-")) ? `Esta lectura aporta evidencia comparable para tu referencia de ppm y los Clubs (${Math.min(3, dashboard?.stats.speedEvidenceCount ?? 0)}/3 para establecerla).` : practice.article.slug.startsWith("integracion-") ? "Tu resultado se guardó. Para contar en la referencia de ppm y Clubs necesitas al menos 70% de comprensión y un texto nuevo; repetir esta lectura sirve para practicar." : "Este resultado queda en Prácticas; no se suma a la velocidad de referencia."}</p>
          {practiceOrigin === "route" && practiceResult.comprehensionScore < 70 && <p className="practice-instructions">Necesitamos más comprensión en un texto nuevo para usar este PPM como referencia.</p>}
          <button className="primary-cta practice-action" onClick={() => { endPractice(); setActiveTab("Home"); }}>Ver mi avance en Home <Icon name="arrow"/></button>
        </> : !readingStarted ? <div className="reading-ready">
          <strong>Lee a tu ritmo</strong>
          <p>Cuando estés listo, toca «Iniciar lectura». El texto aparecerá y el tiempo empezará en 0:00. Al terminar, responderás unas preguntas.</p>
          {appError && <p className="inline-error" role="alert">{appError}</p>}
          <button className="primary-cta practice-action" disabled={startingReading} onClick={() => { void beginReading(); }}>{startingReading ? "Preparando lectura…" : "Iniciar lectura"} <Icon name="arrow"/></button>
        </div> : !finished ? <>
          <p className="practice-instructions">Lee a tu ritmo. Al terminar, detén el tiempo.</p>
          <div className="passage">{practice.article.body}</div>
          <button className="primary-cta practice-action" disabled={seconds < 10} onClick={() => { setRunning(false); setFinished(true); }}>{seconds < 10 ? "Lee un poco más…" : "Terminé de leer"} <Icon name="arrow"/></button>
        </> : <>
          <p className="practice-instructions">Responde lo que recuerdas. Si no lo tienes claro, puedes indicarlo.</p>
          <div className="question-stack">{practice.questions.map((question, qIndex) => <div className="question-block" key={question.id}>
            <strong>{qIndex + 1}. {question.prompt}</strong>
            <div className="answer-list">{question.options.map((option, index) => <button key={`${question.id}-${index}`} className={`answer-option ${answers[question.id] === index ? "chosen" : ""}`} onClick={() => setAnswers(current => ({ ...current, [question.id]: index }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}
              <button className={`answer-option unsure-option ${answers[question.id] === -1 ? "chosen" : ""}`} onClick={() => setAnswers(current => ({ ...current, [question.id]: -1 }))}><span>?</span>No lo recuerdo / no lo tengo claro</button>
            </div>
          </div>)}</div>
          {appError && <p className="inline-error" role="alert">{appError}</p>}
          <button className="primary-cta practice-action" disabled={savingPractice || practice.questions.some(question => answers[question.id] === undefined)} onClick={submitPractice}>{savingPractice ? "Guardando…" : "Guardar mi resultado"} <Icon name="arrow"/></button>
        </>}
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
