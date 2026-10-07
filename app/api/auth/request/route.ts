import { ApiError, apiErrorResponse, supabaseFetch } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new ApiError("Escribe un correo válido.", 422);
    }
    const redirectUrl = process.env.APP_URL ?? "https://speedeep.vercel.app";
    await supabaseFetch(`/auth/v1/otp?redirect_to=${encodeURIComponent(redirectUrl)}`, undefined, {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), create_user: true }),
    });
    return Response.json({ ok: true, message: "Revisa tu correo: te enviamos un enlace o código de acceso." });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
