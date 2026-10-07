import { apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    const [articles, exercises, attempts, placement, readings] = await Promise.all([
      supabaseFetch("/rest/v1/reading_articles?select=id,title,category,word_count,difficulty_level,estimated_minutes&is_published=eq.true&order=created_at.asc,title.asc", token),
      supabaseFetch("/rest/v1/training_exercises?select=id,title,kind,estimated_minutes&is_published=eq.true&order=created_at.asc,title.asc", token),
      supabaseFetch("/rest/v1/training_attempts?select=exercise_id,score&completed_at=not.is.null&order=completed_at.desc&limit=100", token),
      supabaseFetch("/rest/v1/rpc/get_my_diagnostic_placement", token, { method: "POST", body: "{}" }),
      supabaseFetch("/rest/v1/practice_sessions?select=article_id,article_content_version,comprehension_score,reading_articles(difficulty_level)&validity_status=eq.valid&completed_at=not.is.null&order=completed_at.desc&limit=100", token),
    ]);
    const scores = new Map<string, number>();
    for (const attempt of attempts ?? []) {
      if (!scores.has(attempt.exercise_id)) scores.set(attempt.exercise_id, attempt.score);
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
    return Response.json({ articles, placement: practicePlacement,
      exercises: exercises.map((e: { id: string }) => ({ ...e, lastScore: scores.get(e.id) ?? null })) });
  } catch (error) { return apiErrorResponse(error); }
}
