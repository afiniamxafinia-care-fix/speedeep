import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const token = await requireAccessToken();
    const body = await request.json();
    if (body.action === "begin" && typeof body.exerciseId === "string") {
      const data = await supabaseFetch("/rest/v1/rpc/begin_training", token, {
        method: "POST", body: JSON.stringify({ p_exercise_id: body.exerciseId }),
      });
      return Response.json(data);
    }
    if (body.action === "submit" && typeof body.attemptId === "string" && Array.isArray(body.selectedIndices)) {
      const result = await supabaseFetch("/rest/v1/rpc/submit_training", token, {
        method: "POST", body: JSON.stringify({ p_attempt_id: body.attemptId, p_selected_indices: body.selectedIndices }),
      });
      return Response.json({ result });
    }
    throw new ApiError("La solicitud del ejercicio no es válida.", 422);
  } catch (error) { return apiErrorResponse(error); }
}
