import { apiErrorResponse, requireAccessToken, supabaseFetch } from "@/app/lib/supabase";

export async function GET() {
  try {
    const token = await requireAccessToken();
    const authUser = await supabaseFetch("/auth/v1/user", token);
    const [profile, sessions, subscriptions, lessonAttempts, lessonResponses, diagnosticAttempts, flashProfiles, trainingAttempts, flashRounds, anchorArticles] = await Promise.all([
      supabaseFetch(`/rest/v1/profiles?select=display_name,avatar_url&id=eq.${encodeURIComponent(authUser.id)}`, token),
      supabaseFetch("/rest/v1/practice_sessions?select=id,article_id,article_content_version,completed_at,raw_active_ppm,adjusted_ppm,comprehension_score,validity_status,speed_eligible,timing_protocol_version,reading_articles(assessment_use,word_count,slug,difficulty_level,text_type)&order=completed_at.desc&limit=1000", token),
      supabaseFetch(`/rest/v1/subscriptions?select=status,trial_ends_at,current_period_ends_at,cancel_at_period_end&user_id=eq.${encodeURIComponent(authUser.id)}`, token),
      supabaseFetch("/rest/v1/curriculum_attempts?select=id,lesson_code,status,current_step,variant,transfer_correct,started_at,completed_at&lesson_code=in.(1.1,1.2,1.3,1.4,1.C,2.1,2.2,2.3,2.4,2.C,3.1,3.2,3.3,3.4,3.C,4.1,4.2,4.3,4.4,4.C)&order=started_at.desc&limit=100", token),
      supabaseFetch("/rest/v1/curriculum_responses?select=attempt_id,first_correct,skill_code&order=answered_at.desc&limit=1000", token),
      supabaseFetch("/rest/v1/diagnostic_attempts?select=next_item,finished_at,started_at&order=started_at.desc&limit=1", token),
      supabaseFetch("/rest/v1/flash_profiles?select=numbers_rank,rounds_completed&limit=1", token),
      supabaseFetch("/rest/v1/training_attempts?select=id,completed_at&completed_at=not.is.null&order=completed_at.desc&limit=1000", token),
      supabaseFetch("/rest/v1/flash_rounds?select=completed_at&completed_at=not.is.null&order=completed_at.desc&limit=1000", token),
      supabaseFetch("/rest/v1/reading_articles?select=id,slug,word_count,difficulty_level,text_type&slug=in.(la-biblioteca-que-escucho,dos-rutas-para-la-misma-visita,calibracion-el-turno-del-taller,calibracion-el-mapa-del-huerto,calibracion-la-caja-de-los-libros,calibracion-la-nota-en-la-puerta,calibracion-la-mesa-compartida)&is_published=eq.true", token),
    ]);
    type ReadingSession = { article_id: string; article_content_version: number; completed_at: string | null; validity_status: string; speed_eligible: boolean; timing_protocol_version: string; comprehension_score: number; raw_active_ppm: number | null; reading_articles: { assessment_use: string; word_count: number; slug: string; difficulty_level: string; text_type: string } };
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
    const calibrationOrder = ["calibracion-el-turno-del-taller", "calibracion-el-mapa-del-huerto", "calibracion-la-caja-de-los-libros", "calibracion-la-nota-en-la-puerta", "calibracion-la-mesa-compartida"];
    const speedWindow = firstReadings.filter((item: ReadingSession) => item.timing_protocol_version === "on_demand_v2" && item.speed_eligible
      && calibrationOrder.includes(item.reading_articles?.slug) && item.reading_articles?.difficulty_level === "beginner"
      && item.reading_articles?.text_type === "narrative" && item.reading_articles.word_count >= 330 && item.reading_articles.word_count <= 390).slice(0, 5);
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
    const nextCalibration = calibrationOrder.map(slug => anchorArticles.find((article: { slug: string }) => article.slug === slug))
      .find((article: { id: string } | undefined) => article && !attemptedAnchorIds.has(article.id));
    type LessonAttempt = { id: string; lesson_code: string; status: string; variant: string; transfer_correct: number | null; completed_at: string | null };
    const successful = (lessonAttempts as LessonAttempt[] ?? []).filter(item => item.lesson_code === "1.1" && item.status === "completed" && item.transfer_correct === 2 && item.completed_at);
    const demonstrated = successful.some(later => later.variant === "C" && successful.some(earlier => earlier.variant !== "C"
      && earlier.completed_at && later.completed_at && new Date(later.completed_at).getTime() - new Date(earlier.completed_at).getTime() >= 24 * 60 * 60 * 1000));
    const completedLessons = new Set((lessonAttempts as LessonAttempt[] ?? []).filter(item => item.status === "completed" && !item.lesson_code.endsWith(".C")).map(item => item.lesson_code));
    const activeLesson = (lessonAttempts ?? []).find((item: { status: string }) => item.status === "active");
    const lessonTransferScores: Record<string, number> = {};
    const lessonBestTransferScores: Record<string, number> = {};
    for (const item of lessonAttempts as LessonAttempt[] ?? []) {
      if (item.status === "completed" && !item.lesson_code.endsWith(".C") && item.transfer_correct !== null) {
        if (lessonTransferScores[item.lesson_code] === undefined) lessonTransferScores[item.lesson_code] = item.transfer_correct;
        lessonBestTransferScores[item.lesson_code] = Math.max(lessonBestTransferScores[item.lesson_code] ?? 0, item.transfer_correct);
      }
    }
    const closureAttempts = (lessonAttempts as LessonAttempt[] ?? []).filter(item => item.lesson_code === "1.C" && item.status === "completed");
    const requiredClosureSkills = ["sentence_action", "sentence_chunk", "sentence_connector", "vocabulary_context", "vocabulary_decision"];
    const closureScores = closureAttempts.map(attempt => {
      const responses = (lessonResponses as { attempt_id: string; first_correct: boolean; skill_code: string }[] ?? []).filter(item => item.attempt_id === attempt.id);
      const correct = responses.filter(item => item.first_correct);
      return { correct: correct.length, passed: responses.length === 6 && correct.length >= 5
        && requiredClosureSkills.every(skill => correct.some(item => item.skill_code === skill)) };
    });
    const paragraphSkills = ["paragraph_main_idea", "paragraph_support", "paragraph_reference", "paragraph_summary"];
    const paragraphAttempts = (lessonAttempts as LessonAttempt[] ?? []).filter(item => item.lesson_code === "2.C" && item.status === "completed");
    const paragraphScores = paragraphAttempts.map(attempt => {
      const responses = (lessonResponses as { attempt_id: string; first_correct: boolean; skill_code: string }[] ?? []).filter(item => item.attempt_id === attempt.id);
      const correct = responses.filter(item => item.first_correct);
      const missing = paragraphSkills.filter(skill => !correct.some(item => item.skill_code === skill));
      return { correct: correct.length, passed: responses.length === 6 && correct.length >= 5 && missing.length === 0, missing };
    });
    const textSkills = ["text_sequence", "text_causality", "text_contrast", "text_inference"];
    const textScores = (lessonAttempts as LessonAttempt[] ?? []).filter(item => item.lesson_code === "3.C" && item.status === "completed").map(attempt => {
      const responses = (lessonResponses as { attempt_id: string; first_correct: boolean; skill_code: string }[] ?? []).filter(item => item.attempt_id === attempt.id);
      const correct = responses.filter(item => item.first_correct);
      const missing = textSkills.filter(skill => !correct.some(item => item.skill_code === skill));
      return { correct: correct.length, passed: responses.length === 6 && correct.length >= 5 && missing.length === 0, missing };
    });
    const monitorSkills = ["monitor_break", "repair_choice", "targeted_reread", "focus_resume"];
    const monitorScores = (lessonAttempts as LessonAttempt[] ?? []).filter(item => item.lesson_code === "4.C" && item.status === "completed").map(attempt => {
      const responses = (lessonResponses as { attempt_id: string; first_correct: boolean; skill_code: string }[] ?? []).filter(item => item.attempt_id === attempt.id);
      const correct = responses.filter(item => item.first_correct);
      const missing = monitorSkills.filter(skill => !correct.some(item => item.skill_code === skill));
      return { correct: correct.length, passed: responses.length === 6 && correct.length >= 5 && missing.length === 0, missing };
    });
    // Send completion timestamps so the client can place each day in the reader's local timezone.
    const activityTimes = [
      ...(sessions ?? []).map((item: { completed_at: string | null }) => item.completed_at),
      ...(lessonAttempts as LessonAttempt[] ?? []).map(item => item.completed_at),
      ...(trainingAttempts ?? []).map((item: { completed_at: string | null }) => item.completed_at),
      ...(flashRounds ?? []).map((item: { completed_at: string | null }) => item.completed_at),
      diagnosticAttempts?.[0]?.finished_at ?? null,
    ].filter((value): value is string => typeof value === "string");
    return Response.json({
      user: { name: profile?.[0]?.display_name ?? authUser.user_metadata?.name ?? "Lector", avatarUrl: profile?.[0]?.avatar_url ?? null },
      membership: subscriptions?.[0] ?? null,
      activityTimes,
      curriculum: {
        diagnosticStatus: diagnosticAttempts?.[0]?.finished_at ? "completed" : diagnosticAttempts?.[0] ? "active" : "not_started",
        diagnosticStep: diagnosticAttempts?.[0]?.finished_at ? null : diagnosticAttempts?.[0]?.next_item ?? null,
        activeStep: activeLesson?.current_step ?? null,
        activeLessonCode: activeLesson?.lesson_code ?? null,
        completedCount: ["1.1", "1.2", "1.3", "1.4"].filter(code => completedLessons.has(code)).length,
        lessonTransferScores,
        lessonBestTransferScores,
        paragraphFirstCompleted: completedLessons.has("2.1"),
        paragraphSecondCompleted: completedLessons.has("2.2"),
        paragraphThirdCompleted: completedLessons.has("2.3"),
        paragraphFourthCompleted: completedLessons.has("2.4"),
        textCompleted: ["3.1", "3.2", "3.3", "3.4"].filter(code => (lessonBestTransferScores[code] ?? -1) >= 1),
        monitorCompleted: ["4.1", "4.2", "4.3", "4.4"].filter(code => completedLessons.has(code)),
        monitorIntegration: { attempted: monitorScores.length > 0, passed: monitorScores.some(score => score.passed), correct: (monitorScores.find(score => score.passed) ?? monitorScores[0])?.correct ?? null, missing: monitorScores[0]?.missing ?? [] },
        textIntegration: { attempted: textScores.length > 0, passed: textScores.some(score => score.passed), correct: (textScores.find(score => score.passed) ?? textScores[0])?.correct ?? null, missing: textScores[0]?.missing ?? [] },
        lastTransferCorrect: (lessonAttempts as LessonAttempt[] ?? []).find(item => item.lesson_code === "1.1" && item.status === "completed")?.transfer_correct ?? null,
        sentenceActionState: demonstrated ? "demonstrated" : completedLessons.has("1.1") ? "completed" : "not_started",
        sentenceChunkState: completedLessons.has("1.2") ? "completed" : "not_started",
        integration: { attempted: closureScores.length > 0, passed: closureScores.some(score => score.passed), correct: (closureScores.find(score => score.passed) ?? closureScores[0])?.correct ?? null },
        paragraphIntegration: { attempted: paragraphScores.length > 0, passed: paragraphScores.some(score => score.passed), correct: (paragraphScores.find(score => score.passed) ?? paragraphScores[0])?.correct ?? null, missing: paragraphScores[0]?.missing ?? [] },
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
      calibration: {
        nextArticleId: nextCalibration?.id ?? null,
        count: speedWindow.length,
        latestPpm: speedWindow.length ? Math.round(Number(speedWindow[0].raw_active_ppm)) : null,
        latestComprehension: speedWindow[0]?.comprehension_score ?? null,
      },
      stats: {
        latestPpm: speedValue,
        latestReadingPpm: speedWindow[0]?.raw_active_ppm === null || !speedWindow.length ? null : Math.round(Number(speedWindow[0].raw_active_ppm)),
        previousReadingPpm: speedWindow[1]?.raw_active_ppm === null || speedWindow.length < 2 ? null : Math.round(Number(speedWindow[1].raw_active_ppm)),
        speedEvidenceCount: speedWindow.length,
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
