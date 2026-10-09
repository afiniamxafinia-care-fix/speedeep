import { ApiError, apiErrorResponse, saveSession, supabaseFetch } from "@/app/lib/supabase";
import { emailPassword } from "@/app/lib/auth-input";

export async function POST(request: Request) {
  try {
    const { email, password } = emailPassword(await request.json());
    let session;
    try {
      session = await supabaseFetch("/auth/v1/token?grant_type=password", undefined, {
        method: "POST", body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) throw error;
      throw new ApiError("Correo o contraseña incorrectos. Si antes entrabas por correo, usa «Crear o recuperar contraseña».", 401);
    }
    if (!session?.access_token || !session?.refresh_token) throw new ApiError("No se pudo iniciar sesión.", 401);
    await saveSession(session);
    return Response.json({ user: { email: session.user?.email, name: session.user?.user_metadata?.name ?? "Lector" } });
  } catch (error) { return apiErrorResponse(error); }
}
