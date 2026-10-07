import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET(request: Request) {
  try {
    const token = await requireAccessToken();
    const lessonCode = new URL(request.url).searchParams.get("lessonCode") ?? "1.1";
    if (!["1.1", "1.2", "1.3", "1.4", "1.C", "2.1", "2.2", "2.3", "2.4", "2.C"].includes(lessonCode)) throw new ApiError("Esta lección no está disponible.", 422);
    const state = await supabaseFetch("/rest/v1/rpc/begin_curriculum_lesson", token, {
      method: "POST", body: JSON.stringify({ p_lesson_code: lessonCode }),
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
