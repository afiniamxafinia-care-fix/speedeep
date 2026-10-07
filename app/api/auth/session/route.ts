import { apiErrorResponse, clearSession, currentAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await currentAccessToken();
    if (!token) return Response.json({ user: null });
    const user = await supabaseFetch("/auth/v1/user", token);
    return Response.json({ user: { email: user.email, name: user.user_metadata?.name ?? "Lector" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const token = await currentAccessToken();
    if (token) await supabaseFetch("/auth/v1/logout", token, { method: "POST" });
  } catch {
    // Always clear local session cookies, even if the remote token has expired.
  }
  await clearSession();
  return Response.json({ ok: true });
}
