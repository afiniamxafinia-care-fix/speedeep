import { ApiError, apiErrorResponse, saveSession, supabaseFetch } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") {
      throw new ApiError("El enlace de acceso no contiene una sesión válida.", 401);
    }
    const user = await supabaseFetch("/auth/v1/user", body.accessToken);
    await saveSession({ access_token: body.accessToken, refresh_token: body.refreshToken, expires_in: Number(body.expiresIn) || 3600 });
    return Response.json({ ok: true, user: { email: user.email, name: user.user_metadata?.name ?? "Lector" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
