import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET(request: Request) {
  try {
    const token = await requireAccessToken();
    const [articles, recentSessions] = await Promise.all([
      supabaseFetch("/rest/v1/reading_articles?select=id,title,category,estimated_minutes,body,word_count,difficulty_level,text_type,purpose_codes,content_version,assessment_use&is_published=eq.true&order=created_at.asc", token),
      supabaseFetch("/rest/v1/practice_sessions?select=article_id,completed_at&order=completed_at.desc&limit=30", token),
    ]);
    if (!articles?.length) throw new ApiError("No hay lecturas disponibles en tu cuenta por ahora.", 404);
    const uses = new Map<string, number>();
    for (const session of recentSessions ?? []) uses.set(session.article_id, (uses.get(session.article_id) ?? 0) + 1);
    const requestedId = new URL(request.url).searchParams.get("articleId");
    const article = requestedId
      ? articles.find((item: { id: string }) => item.id === requestedId)
      : [...articles].sort((left: { id: string }, right: { id: string }) => (uses.get(left.id) ?? 0) - (uses.get(right.id) ?? 0))[0];
    if (!article) throw new ApiError("Esta lectura no está disponible.", 404);
    const questions = await supabaseFetch(`/rest/v1/article_questions?select=id,prompt,options,question_type,skill_code,assessment_stage,max_points,sort_order&article_id=eq.${encodeURIComponent(article.id)}&is_active=eq.true&assessment_stage=eq.immediate&order=sort_order.asc`, token);
    if (!questions?.length) throw new ApiError("Esta lectura todavía no tiene preguntas configuradas.", 503);
    return Response.json({ article, questions });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const token = await requireAccessToken();
    const body = await request.json();
    const result = await supabaseFetch("/rest/v1/rpc/submit_practice", token, {
      method: "POST",
      body: JSON.stringify({
        p_article_id: body.articleId,
        p_ticket_id: body.ticketId,
        p_active_reading_seconds: body.activeReadingSeconds,
        p_responses: body.responses,
      }),
    });
    return Response.json({ result: Array.isArray(result) ? result[0] : result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
