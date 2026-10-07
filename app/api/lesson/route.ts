import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    const state = await supabaseFetch("/rest/v1/rpc/begin_curriculum_lesson", token, {
      method: "POST", body: JSON.stringify({ p_lesson_code: "1.1" }),
    });
    return Response.json(state);
  } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const token = await requireAccessToken();
    const body = await request.json();
    if (typeof body.attemptId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.attemptId)
      || !Number.isInteger(body.index) || body.index < 0 || body.index > 2) {
      throw new ApiError("Selecciona una respuesta válida.", 422);
    }
    const result = await supabaseFetch("/rest/v1/rpc/submit_curriculum_answer", token, {
      method: "POST", body: JSON.stringify({ p_attempt_id: body.attemptId, p_index: body.index }),
    });
    return Response.json(result);
  } catch (error) { return apiErrorResponse(error); }
}
