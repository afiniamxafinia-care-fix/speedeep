import { cookies } from "next/headers";

const ACCESS_COOKIE = "speedeep_access";
const REFRESH_COOKIE = "speedeep_refresh";
const EXPIRY_COOKIE = "speedeep_expiry";

export class ApiError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ApiError("Falta configurar Supabase en el entorno de la app.", 503);
  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseFetch(path: string, accessToken?: string, init: RequestInit = {}) {
  const { url, key } = supabaseConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error ?? "No se pudo completar la solicitud.";
    throw new ApiError(String(message), response.status);
  }
  return payload;
}

export async function currentAccessToken() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const expiry = Number(jar.get(EXPIRY_COOKIE)?.value ?? 0);
  if (!access && !refresh) return null;
  if (access && expiry > Date.now() + 60_000) return access;
  if (!refresh) return access ?? null;
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
    cache: "no-store",
  });
  const session = await response.json().catch(() => null);
  if (!response.ok || !session?.access_token) {
    jar.delete(ACCESS_COOKIE);
    jar.delete(REFRESH_COOKIE);
    jar.delete(EXPIRY_COOKIE);
    return null;
  }
  const secure = process.env.NODE_ENV === "production";
  const expires = Date.now() + Number(session.expires_in ?? 3600) * 1000;
  jar.set(ACCESS_COOKIE, session.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: new Date(expires) });
  jar.set(REFRESH_COOKIE, session.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  jar.set(EXPIRY_COOKIE, String(expires), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return session.access_token as string;
}

export async function requireAccessToken() {
  const token = await currentAccessToken();
  if (!token) throw new ApiError("Inicia sesión para continuar.", 401);
  return token;
}

export async function saveSession(session: { access_token: string; refresh_token: string; expires_in?: number }) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const expires = Date.now() + Number(session.expires_in ?? 3600) * 1000;
  jar.set(ACCESS_COOKIE, session.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: new Date(expires) });
  jar.set(REFRESH_COOKIE, session.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  jar.set(EXPIRY_COOKIE, String(expires), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(EXPIRY_COOKIE);
}

export function apiErrorResponse(error: unknown) {
  const apiError = error instanceof ApiError ? error : new ApiError("Ocurrió un error inesperado.", 500);
  return Response.json({ error: apiError.message }, { status: apiError.status });
}
