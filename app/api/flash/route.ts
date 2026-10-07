import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const token = await requireAccessToken();
    const body = await request.json();
    if (body?.action === "begin" && (body.origin === "route" || body.origin === "lab" || body.origin === "diagnostic")) {
      return Response.json(await supabaseFetch("/rest/v1/rpc/begin_flash_numbers", token, {
        method: "POST", body: JSON.stringify({ p_origin: body.origin }),
      }));
    }
    if (body?.action === "answer" && typeof body.roundId === "string"
      && /^[0-9a-f-]{36}$/i.test(body.roundId) && Number.isInteger(body.index)
      && body.index >= 0 && body.index <= 3 && Number.isInteger(body.observedMs)
      && body.observedMs >= 1 && body.observedMs <= 10000) {
      return Response.json(await supabaseFetch("/rest/v1/rpc/submit_flash_numbers", token, {
        method: "POST", body: JSON.stringify({ p_round_id: body.roundId, p_index: body.index, p_observed_ms: body.observedMs }),
      }));
    }
    throw new ApiError("Solicitud de reto inválida.", 422);
  } catch (error) { return apiErrorResponse(error); }
}
