import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    return Response.json(await supabaseFetch("/rest/v1/rpc/begin_diagnostic", token, {
      method: "POST", body: "{}",
    }));
  } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const token = await requireAccessToken();
    const body = await request.json();
    if (typeof body?.attemptId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.attemptId)
      || !Number.isInteger(body.index) || body.index < 0 || body.index > 2
      || !["sure", "unsure"].includes(body.confidence) || typeof body.lookedBack !== "boolean") {
      throw new ApiError("Completa tu respuesta y elige qué tan seguro estás.", 422);
    }
    return Response.json(await supabaseFetch("/rest/v1/rpc/submit_diagnostic_answer", token, {
      method: "POST", body: JSON.stringify({
        p_attempt_id: body.attemptId, p_index: body.index,
        p_confidence: body.confidence, p_looked_back: body.lookedBack,
      }),
    }));
  } catch (error) { return apiErrorResponse(error); }
}
