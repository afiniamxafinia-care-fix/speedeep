import { ApiError } from "@/app/lib/supabase";

export function emailPassword(input: unknown, newPassword = false) {
  const body = input as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    throw new ApiError("Escribe un correo válido.", 422);
  }
  if (typeof body.password !== "string" || !body.password || body.password.length > 128
    || (newPassword && body.password.length < 10)) {
    throw new ApiError(newPassword ? "Usa una contraseña de 10 a 128 caracteres." : "Escribe tu contraseña.", 422);
  }
  return { email: body.email.trim().toLowerCase(), password: body.password };
}

export function authRedirect(request: Request, mode: "confirm" | "recovery") {
  const url = new URL(request.url);
  const host = url.hostname;
  const allowed = host === "speedeep.vercel.app" || host === "speedeep-afinia1.vercel.app"
    || /^speedeep-[a-z0-9-]+-afinia1\.vercel\.app$/.test(host)
    || (process.env.NODE_ENV !== "production" && host === "localhost");
  if (!allowed || (url.protocol !== "https:" && host !== "localhost")) {
    throw new ApiError("No se puede enviar un enlace a esta dirección.", 400);
  }
  return `${url.origin}/?auth=${mode}`;
}
