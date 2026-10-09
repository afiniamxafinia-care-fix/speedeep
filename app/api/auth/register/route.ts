import { ApiError, apiErrorResponse, saveSession, supabaseFetch } from "@/app/lib/supabase";
import { authRedirect, emailPassword } from "@/app/lib/auth-input";

export async function POST(request: Request) {
  try {
    const { email, password } = emailPassword(await request.json(), true);
    const redirect = authRedirect(request, "confirm");
    const session = await supabaseFetch(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirect)}`, undefined, {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    if (session?.access_token && session?.refresh_token) {
      await saveSession(session);
      return Response.json({ signedIn: true, user: { email: session.user?.email, name: session.user?.user_metadata?.name ?? "Lector" } });
    }
    if (!session?.user) throw new ApiError("No se pudo crear la cuenta.", 400);
    return Response.json({ signedIn: false, message: "Si esta cuenta es nueva, revisa el correo de confirmación y vuelve a esta página para entrar con tu contraseña." });
  } catch (error) { return apiErrorResponse(error); }
}
