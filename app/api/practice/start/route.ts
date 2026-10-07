import { apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const token = await requireAccessToken();
    const { articleId } = await request.json();
    const result = await supabaseFetch("/rest/v1/rpc/begin_practice", token, {
      method: "POST",
      body: JSON.stringify({ p_article_id: articleId }),
    });
    return Response.json({ ticketId: result.ticketId, startedAt: result.startedAt });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
