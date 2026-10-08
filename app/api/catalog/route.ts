import { apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    const [articles, exercises, attempts, placement, readings] = await Promise.all([
      supabaseFetch("/rest/v1/reading_articles?select=id,title,category,word_count,difficulty_level,estimated_minutes&is_published=eq.true&assessment_use=eq.short_practice&order=created_at.asc,title.asc", token),
      supabaseFetch("/rest/v1/training_exercises?select=id,title,kind,estimated_minutes&is_published=eq.true&order=created_at.asc,title.asc", token),
      supabaseFetch("/rest/v1/training_attempts?select=exercise_id,score,duration_seconds,completed_at&completed_at=not.is.null&order=completed_at.desc&limit=1000", token),
      supabaseFetch("/rest/v1/rpc/get_my_diagnostic_placement", token, { method: "POST", body: "{}" }),
      supabaseFetch("/rest/v1/practice_sessions?select=article_id,article_content_version,comprehension_score,reading_articles(difficulty_level)&validity_status=eq.valid&completed_at=not.is.null&order=completed_at.desc&limit=100", token),
    ]);
    type TrainingResult = { exercise_id: string; score: number; duration_seconds: number | null; completed_at: string };
    const history = new Map<string, TrainingResult[]>();
    for (const attempt of attempts as TrainingResult[] ?? []) {
      const prior = history.get(attempt.exercise_id) ?? [];
      prior.push(attempt);
      history.set(attempt.exercise_id, prior);
    }
    type ValidReading = { article_id: string; article_content_version: number; comprehension_score: number | null; reading_articles: { difficulty_level: string } | null };
    const seen = new Set<string>();
    const uniqueReadings = [...(readings as ValidReading[] ?? [])].reverse().filter(reading => {
      const key = `${reading.article_id}:${reading.article_content_version}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).reverse();
    const initial = placement?.practicePlacement ?? null;
    const baseline = initial?.readingRange as "beginner" | "intermediate" | undefined;
    const comparable = uniqueReadings.filter(reading => reading.reading_articles?.difficulty_level === baseline
      && reading.comprehension_score !== null).slice(0, 3);
    const average = comparable.length === 3 && new Set(comparable.map(item => item.article_id)).size === 3
      ? comparable.reduce((sum, item) => sum + Number(item.comprehension_score), 0) / 3 : null;
    const adjustedRange = average !== null && average >= 80
      ? baseline === "beginner" ? "intermediate" : "advanced"
      : average !== null && average <= 60 && baseline === "intermediate" ? "beginner" : baseline;
    const practicePlacement = initial ? {
      ...initial,
      readingRange: adjustedRange,
      reason: adjustedRange !== baseline
        ? "Tus últimas tres lecturas válidas y distintas orientan este nuevo rango de práctica."
        : initial.reason,
      source: adjustedRange !== baseline ? "recent_readings" : "diagnostic",
    } : null;
    const cards = (exercises as { id: string; title: string; kind: string; estimated_minutes: number }[]).map(e => {
      const results = history.get(e.id) ?? [];
      return { ...e, lastScore: results[0]?.score ?? null, lastDurationSeconds: results[0]?.duration_seconds ?? null,
        lastCompletedAt: results[0]?.completed_at ?? null, scoreChange: results.length > 1 ? results[0].score - results[1].score : null };
    });
    const recent = cards.filter(item => item.lastCompletedAt).sort((a, b) => (b.lastCompletedAt ?? "").localeCompare(a.lastCompletedAt ?? ""))[0] ?? null;
    const readIds = new Set((readings as ValidReading[] ?? []).map(item => item.article_id));
    return Response.json({ articles: (articles as { id: string }[]).map(article => ({ ...article, read: readIds.has(article.id) })), placement: practicePlacement, exercises: cards, recentResult: recent });
  } catch (error) { return apiErrorResponse(error); }
}
