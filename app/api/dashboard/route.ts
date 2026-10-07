import { apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    const authUser = await supabaseFetch("/auth/v1/user", token);
    const [profile, sessions, subscriptions, lessonAttempts, diagnosticAttempts, flashProfiles, trainingAttempts, anchorArticles] = await Promise.all([
      supabaseFetch(`/rest/v1/profiles?select=display_name,avatar_url&id=eq.${encodeURIComponent(authUser.id)}`, token),
      supabaseFetch("/rest/v1/practice_sessions?select=id,article_id,article_content_version,completed_at,raw_active_ppm,adjusted_ppm,comprehension_score,validity_status,speed_eligible,reading_articles(assessment_use,word_count,slug,difficulty_level,text_type)&order=completed_at.desc&limit=1000", token),
      supabaseFetch(`/rest/v1/subscriptions?select=status,trial_ends_at,current_period_ends_at,cancel_at_period_end&user_id=eq.${encodeURIComponent(authUser.id)}`, token),
      supabaseFetch("/rest/v1/curriculum_attempts?select=lesson_code,status,current_step,variant,transfer_correct,started_at,completed_at&lesson_code=in.(1.1,1.2)&order=started_at.desc&limit=100", token),
      supabaseFetch("/rest/v1/diagnostic_attempts?select=next_item,finished_at,started_at&order=started_at.desc&limit=1", token),
      supabaseFetch("/rest/v1/flash_profiles?select=numbers_rank,rounds_completed&limit=1", token),
      supabaseFetch("/rest/v1/training_attempts?select=id&completed_at=not.is.null&limit=1000", token),
      supabaseFetch("/rest/v1/reading_articles?select=id,slug,word_count,difficulty_level,text_type&slug=in.(la-biblioteca-que-escucho,dos-rutas-para-la-misma-visita)&is_published=eq.true", token),
    ]);
    type ReadingSession = { article_id: string; article_content_version: number; completed_at: string | null; validity_status: string; speed_eligible: boolean; comprehension_score: number; raw_active_ppm: number | null; reading_articles: { assessment_use: string; word_count: number; slug: string; difficulty_level: string; text_type: string } };
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
    const anchorOrder = ["la-biblioteca-que-escucho", "dos-rutas-para-la-misma-visita"];
    const referenceReadings = [...firstReadings].reverse().filter((item: ReadingSession) =>
      anchorOrder.includes(item.reading_articles?.slug) && item.speed_eligible && item.raw_active_ppm !== null);
    const baseline = referenceReadings[0] as ReadingSession | undefined;
    const comparison = baseline ? referenceReadings.find((item: ReadingSession) => item.article_id !== baseline.article_id
      && item.completed_at && baseline.completed_at && item.completed_at > baseline.completed_at) as ReadingSession | undefined : undefined;
    const attemptedAnchorIds = new Set((sessions ?? []).filter((item: ReadingSession) => item.completed_at)
      .map((item: ReadingSession) => item.article_id));
    const nextAnchor = anchorOrder.map(slug => anchorArticles.find((article: { slug: string }) => article.slug === slug))
      .find((article: { id: string } | undefined) => article && !attemptedAnchorIds.has(article.id));
    type LessonAttempt = { lesson_code: string; status: string; variant: string; transfer_correct: number | null; completed_at: string | null };
    const successful = (lessonAttempts as LessonAttempt[] ?? []).filter(item => item.lesson_code === "1.1" && item.status === "completed" && item.transfer_correct === 2 && item.completed_at);
    const demonstrated = successful.some(later => later.variant === "C" && successful.some(earlier => earlier.variant !== "C"
      && earlier.completed_at && later.completed_at && new Date(later.completed_at).getTime() - new Date(earlier.completed_at).getTime() >= 24 * 60 * 60 * 1000));
    const completedLessons = new Set((lessonAttempts as LessonAttempt[] ?? []).filter(item => item.status === "completed").map(item => item.lesson_code));
    const activeLesson = (lessonAttempts ?? []).find((item: { status: string }) => item.status === "active");
    return Response.json({
      user: { name: profile?.[0]?.display_name ?? authUser.user_metadata?.name ?? "Lector", avatarUrl: profile?.[0]?.avatar_url ?? null },
      membership: subscriptions?.[0] ?? null,
      curriculum: {
        diagnosticStatus: diagnosticAttempts?.[0]?.finished_at ? "completed" : diagnosticAttempts?.[0] ? "active" : "not_started",
        diagnosticStep: diagnosticAttempts?.[0]?.finished_at ? null : diagnosticAttempts?.[0]?.next_item ?? null,
        activeStep: activeLesson?.current_step ?? null,
        activeLessonCode: activeLesson?.lesson_code ?? null,
        completedCount: completedLessons.size,
        lastTransferCorrect: (lessonAttempts as LessonAttempt[] ?? []).find(item => item.lesson_code === "1.1" && item.status === "completed")?.transfer_correct ?? null,
        sentenceActionState: demonstrated ? "demonstrated" : completedLessons.has("1.1") ? "completed" : "not_started",
        sentenceChunkState: completedLessons.has("1.2") ? "completed" : "not_started",
      },
      lab: {
        numbersRank: flashProfiles?.[0]?.numbers_rank ?? 0,
        numbersRounds: flashProfiles?.[0]?.rounds_completed ?? 0,
      },
      anchor: {
        nextArticleId: nextAnchor?.id ?? null,
        baselinePpm: baseline ? Math.round(Number(baseline.raw_active_ppm)) : null,
        baselineComprehension: baseline?.comprehension_score ?? null,
        comparisonPpm: comparison ? Math.round(Number(comparison.raw_active_ppm)) : null,
        comparisonComprehension: comparison?.comprehension_score ?? null,
        deltaPpm: baseline && comparison ? Math.round(Number(comparison.raw_active_ppm) - Number(baseline.raw_active_ppm)) : null,
      },
      stats: {
        latestPpm: speedValue,
        comprehension,
        practicesCount: (sessions ?? []).filter((item: { completed_at: string | null }) => item.completed_at).length + (trainingAttempts ?? []).length + (flashProfiles?.[0]?.rounds_completed ?? 0),
        readingsCount: (sessions ?? []).filter((item: { completed_at: string | null }) => item.completed_at).length,
        trainingCount: (trainingAttempts ?? []).length,
        flashRounds: flashProfiles?.[0]?.rounds_completed ?? 0,
        diagnosticCompleted: Boolean(diagnosticAttempts?.[0]?.finished_at),
        lessonsCompleted: completedLessons.size,
        qualityWindowSize: qualityWindow.length,
        qsdState: "insufficient",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
