import { ApiError, apiErrorResponse, supabaseFetch } from "@/app/lib/supabase";
import { authRedirect } from "@/app/lib/auth-input";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      throw new ApiError("Escribe un correo válido.", 422);
    }
    const redirect = authRedirect(request, "recovery");
    try {
      await supabaseFetch(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`, undefined, {
        method: "POST", body: JSON.stringify({ email: body.email.trim().toLowerCase() }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) throw error;
      // Keep upstream failures generic without claiming the email was sent.
      throw new ApiError("No se pudo enviar el correo de recuperación. Inténtalo de nuevo.", 503);
    }
    return Response.json({ message: "Si ese correo tiene una cuenta, recibirás instrucciones para crear una contraseña." });
  } catch (error) { return apiErrorResponse(error); }
}
