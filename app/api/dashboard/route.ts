import { apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    const authUser = await supabaseFetch("/auth/v1/user", token);
    const [profile, sessions, subscriptions] = await Promise.all([
      supabaseFetch(`/rest/v1/profiles?select=display_name,avatar_url&id=eq.${encodeURIComponent(authUser.id)}`, token),
      supabaseFetch("/rest/v1/practice_sessions?select=id,article_id,article_content_version,completed_at,raw_active_ppm,adjusted_ppm,comprehension_score,validity_status,speed_eligible,reading_articles(assessment_use,word_count)&order=completed_at.desc&limit=1000", token),
      supabaseFetch(`/rest/v1/subscriptions?select=status,trial_ends_at,current_period_ends_at,cancel_at_period_end&user_id=eq.${encodeURIComponent(authUser.id)}`, token),
    ]);
    type ReadingSession = { article_id: string; article_content_version: number; validity_status: string; speed_eligible: boolean; comprehension_score: number; raw_active_ppm: number | null; reading_articles: { assessment_use: string; word_count: number } };
    // Select the first valid encounter with each version; repeats remain useful
    // training, but do not multiply evidence in the personal summary.
    const seen = new Set<string>();
    const firstReadings = [...(sessions ?? [])].reverse().filter((item: ReadingSession) => {
      if (item.validity_status !== "valid") return false;
      const key = `${item.article_id}:${item.article_content_version}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).reverse();
    const qualityWindow = firstReadings.slice(0, 5);
    const distinctArticles = new Set(qualityWindow.map((item: { article_id: string }) => item.article_id)).size;
    const comprehension = qualityWindow.length >= 3 && distinctArticles >= 2
      ? Math.round(qualityWindow.reduce((sum: number, item: { comprehension_score: number }) => sum + item.comprehension_score, 0) / qualityWindow.length)
      : null;
    const speedWindow = firstReadings.filter((item: ReadingSession) => item.speed_eligible && item.reading_articles?.assessment_use === "evaluation" && item.reading_articles.word_count >= 300).slice(0, 5);
    const speedArticles = new Set(speedWindow.map((item: { article_id: string }) => item.article_id)).size;
    const speedValue = speedWindow.length >= 3 && speedArticles >= 2
      ? (() => {
          const values = speedWindow.map((item: { raw_active_ppm: number | null }) => Number(item.raw_active_ppm ?? 0)).sort((a: number, b: number) => a - b);
          const middle = Math.floor(values.length / 2);
          return Math.round(values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2);
        })()
      : null;
    return Response.json({
      user: { name: profile?.[0]?.display_name ?? authUser.user_metadata?.name ?? "Lector", avatarUrl: profile?.[0]?.avatar_url ?? null },
      membership: subscriptions?.[0] ?? null,
      stats: {
        latestPpm: speedValue,
        comprehension,
        practicesCount: (sessions ?? []).length,
        qualityWindowSize: qualityWindow.length,
        qsdState: "insufficient",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
