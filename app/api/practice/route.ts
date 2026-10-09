import { ApiError, apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET(request: Request) {
  try {
    const token = await requireAccessToken();
    const [articles, recentSessions] = await Promise.all([
      supabaseFetch("/rest/v1/reading_articles?select=id,slug,title,category,estimated_minutes,body,word_count,difficulty_level,text_type,purpose_codes,content_version,assessment_use&is_published=eq.true&order=created_at.asc", token),
      supabaseFetch("/rest/v1/practice_sessions?select=article_id,completed_at&order=completed_at.desc&limit=30", token),
    ]);
    if (!articles?.length) throw new ApiError("No hay lecturas disponibles en tu cuenta por ahora.", 404);
    const uses = new Map<string, number>();
    for (const session of recentSessions ?? []) uses.set(session.article_id, (uses.get(session.article_id) ?? 0) + 1);
    const requestedId = new URL(request.url).searchParams.get("articleId");
    const article = requestedId
      ? articles.find((item: { id: string }) => item.id === requestedId)
      : [...articles].filter((item: { slug: string }) => !item.slug.startsWith("integracion-"))
        .sort((left: { id: string }, right: { id: string }) => (uses.get(left.id) ?? 0) - (uses.get(right.id) ?? 0))[0];
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
    const saved = Array.isArray(result) ? result[0] : result;
    try {
      const [article] = await supabaseFetch(`/rest/v1/reading_articles?select=slug&id=eq.${encodeURIComponent(body.articleId)}&limit=1`, token);
      if (article?.slug?.startsWith("integracion-") && saved?.sessionId) {
        const [questions, responses] = await Promise.all([
          supabaseFetch(`/rest/v1/article_questions?select=id,rubric&article_id=eq.${encodeURIComponent(body.articleId)}&assessment_stage=eq.immediate`, token),
          supabaseFetch(`/rest/v1/practice_responses?select=question_id,is_correct&session_id=eq.${encodeURIComponent(saved.sessionId)}`, token),
        ]);
        const labels = new Map<string, { label: string; correct: number; total: number }>();
        const responseByQuestion = new Map((responses as { question_id: string; is_correct: boolean }[]).map(item => [item.question_id, item.is_correct]));
        for (const question of questions as { id: string; rubric: { subskill?: string } }[]) {
          const label = question.rubric?.subskill;
          if (!label) continue;
          const score = labels.get(label) ?? { label, correct: 0, total: 0 };
          score.total++;
          if (responseByQuestion.get(question.id)) score.correct++;
          labels.set(label, score);
        }
        saved.skillResults = [...labels.values()];
      }
    } catch {
      // El resultado ya quedó guardado; una lectura auxiliar no debe hacer que el alumno lo reenvíe.
    }
    return Response.json({ result: saved });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
