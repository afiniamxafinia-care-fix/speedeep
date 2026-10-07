import { apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    const [articles, exercises, attempts] = await Promise.all([
      supabaseFetch("/rest/v1/reading_articles?select=id,title,category,word_count,difficulty_level,estimated_minutes&is_published=eq.true&order=created_at.asc,title.asc", token),
      supabaseFetch("/rest/v1/training_exercises?select=id,title,kind,estimated_minutes&is_published=eq.true&order=created_at.asc,title.asc", token),
      supabaseFetch("/rest/v1/training_attempts?select=exercise_id,score&completed_at=not.is.null&order=completed_at.desc&limit=100", token),
    ]);
    const scores = new Map<string, number>();
    for (const attempt of attempts ?? []) {
      if (!scores.has(attempt.exercise_id)) scores.set(attempt.exercise_id, attempt.score);
    }
    return Response.json({ articles, exercises: exercises.map((e: { id: string }) => ({ ...e, lastScore: scores.get(e.id) ?? null })) });
  } catch (error) { return apiErrorResponse(error); }
}
