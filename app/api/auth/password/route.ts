import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function PUT(request: Request) {
  try {
    const token = await requireAccessToken();
    const body = await request.json();
    if (typeof body?.password !== "string" || body.password.length < 10 || body.password.length > 128) {
      throw new ApiError("Usa una contraseña de 10 a 128 caracteres.", 422);
    }
    await supabaseFetch("/auth/v1/user", token, { method: "PUT", body: JSON.stringify({ password: body.password }) });
    return Response.json({ ok: true });
  } catch (error) { return apiErrorResponse(error); }
}
