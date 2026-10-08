import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const token = await requireAccessToken();
    const body = await request.json();
    if (body.action === "begin" && typeof body.exerciseId === "string") {
      const origin = body.origin ?? "lab";
      if (origin !== "lab" && origin !== "route" || origin === "route" && (!['1.1','1.2','1.3','1.4'].includes(body.routeLevel) || ![1,3].includes(body.routeAfter))) throw new ApiError("El origen de práctica no es válido.", 422);
      const data = await supabaseFetch("/rest/v1/rpc/begin_training", token, {
        method: "POST", body: JSON.stringify({ p_exercise_id: body.exerciseId, p_origin: origin, p_route_level: origin === "route" ? body.routeLevel : null, p_route_after: origin === "route" ? body.routeAfter : null }),
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
