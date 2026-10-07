import { ApiError, apiErrorResponse, saveSession, supabaseFetch } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();
    if (typeof email !== "string" || typeof token !== "string" || !/^\d{6,8}$/.test(token.trim())) {
      throw new ApiError("Revisa el correo y el código de acceso.", 422);
    }
    const session = await supabaseFetch("/auth/v1/verify", undefined, {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), token: token.trim(), type: "email" }),
    });
    if (!session?.access_token || !session?.refresh_token) throw new ApiError("El código venció o no es válido. Solicita uno nuevo.", 401);
    await saveSession(session);
    return Response.json({ ok: true, user: { email: session.user?.email, name: session.user?.user_metadata?.name ?? "Lector" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
