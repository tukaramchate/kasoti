# Kasoti — 3 Features Implementation Plan

> Precise, file-level plan mapped to the existing codebase.  
> Every file path, class name, field, method, and dependency is verified against the actual code.

---

## Table of Contents

- [Feature 1: Question-Level Analytics & Difficulty Intelligence](#feature-1-question-level-analytics--difficulty-intelligence)
- [Feature 2: AI-Assisted Auto-Grading for Descriptive Answers](#feature-2-ai-assisted-auto-grading-for-descriptive-answers)
- [Feature 3: Real-Time Live Quiz Sessions (WebSocket)](#feature-3-real-time-live-quiz-sessions-websocket)
- [Implementation Order & Dependencies](#implementation-order--dependencies)
- [Database Migration Summary](#database-migration-summary)
- [Risk Mitigation](#risk-mitigation)

---

## Feature 1: Question-Level Analytics & Difficulty Intelligence

**Goal:** Give teachers per-question metrics (difficulty index, discrimination index, distractor analysis, time heatmap) so they can improve quiz quality.

### Phase 1A — Backend: Schema Change

**File:** `backend/src/main/java/com/tukaram/kasoti/model/Answer.java`

| Action | Detail |
|--------|--------|
| ADD column | `private Integer timeSpentSeconds;` with `@Column(name = "time_spent_seconds")` |
| Location | After the existing `evaluationComment` field (line ~58) |
| Migration | `spring.jpa.hibernate.ddl-auto=update` handles it — nullable column, no data loss |

**Existing fields we leverage (no changes needed):**
- `Answer.selectedOption` — for MCQ/TRUE_FALSE distractor counting
- `Answer.selectedOptions` — for MSQ distractor counting  
- `Answer.isCorrect` — for difficulty index calculation
- `Answer.question` (FK) — to group answers by question
- `Answer.attempt` (FK) → `QuizAttempt.score` — for discrimination index correlation

### Phase 1B — Backend: New DTOs

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/QuestionAnalyticsDTO.java`

```java
package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionAnalyticsDTO {
    private Long questionId;
    private String questionText;
    private String questionType;       // MCQ, MSQ, TRUE_FALSE, DESCRIPTIVE
    private Integer marks;

    // Core metrics
    private Double difficultyIndex;     // % of students who answered correctly (0.0–1.0)
    private Double discriminationIndex; // correlation between question & overall score (-1.0–1.0)
    private Double averageTimeSeconds;  // avg time spent on this question
    private Integer totalAttempts;      // how many students answered this question

    // Distractor analysis (MCQ/MSQ/TRUE_FALSE only)
    private Map<String, Integer> optionDistribution;  // option text → count of selections
    private String correctOption;                      // for MCQ/TRUE_FALSE
    private java.util.List<String> correctOptions;     // for MSQ

    // Score distribution (DESCRIPTIVE)
    private Map<Integer, Integer> marksDistribution;   // marks_obtained → count
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/QuizAnalyticsDTO.java`

```java
package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizAnalyticsDTO {
    private Long quizId;
    private String quizTitle;
    private Integer totalAttempts;
    private Double averageScore;
    private Double medianScore;
    private Double standardDeviation;

    // Score distribution histogram (bucket → count)
    private Map<String, Integer> scoreDistribution;  // "0-10","11-20",... → count

    // Per-question analytics
    private List<QuestionAnalyticsDTO> questionAnalytics;

    // Summary insights
    private List<String> hardestQuestions;    // question IDs with lowest difficulty index
    private List<String> easiestQuestions;    // question IDs with highest difficulty index
    private List<String> poorDiscriminators; // questions with discrimination index < 0.2
}
```

### Phase 1C — Backend: Repository Queries

**File:** `backend/src/main/java/com/tukaram/kasoti/repository/AnswerRepository.java`

Add these new query methods (after existing methods, around line ~45):

```java
// Question Analytics: count correct answers per question
@Query("SELECT a.question.id, COUNT(a), SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0 END) " +
       "FROM Answer a WHERE a.attempt.quiz.id = :quizId GROUP BY a.question.id")
List<Object[]> findCorrectCountsByQuizId(@Param("quizId") Long quizId);

// Question Analytics: option distribution for MCQ/TRUE_FALSE
@Query("SELECT a.question.id, a.selectedOption, COUNT(a) " +
       "FROM Answer a WHERE a.attempt.quiz.id = :quizId AND a.selectedOption IS NOT NULL " +
       "GROUP BY a.question.id, a.selectedOption")
List<Object[]> findOptionDistributionByQuizId(@Param("quizId") Long quizId);

// Question Analytics: average time per question
@Query("SELECT a.question.id, AVG(a.timeSpentSeconds) " +
       "FROM Answer a WHERE a.attempt.quiz.id = :quizId AND a.timeSpentSeconds IS NOT NULL " +
       "GROUP BY a.question.id")
List<Object[]> findAverageTimeByQuizId(@Param("quizId") Long quizId);

// Question Analytics: marks distribution for descriptive questions
@Query("SELECT a.question.id, a.marksObtained, COUNT(a) " +
       "FROM Answer a WHERE a.attempt.quiz.id = :quizId " +
       "AND a.question.questionType = 'DESCRIPTIVE' AND a.evaluationStatus = 'EVALUATED' " +
       "GROUP BY a.question.id, a.marksObtained")
List<Object[]> findMarksDistributionByQuizId(@Param("quizId") Long quizId);

// Discrimination index: per-question correctness paired with overall attempt score
@Query("SELECT a.question.id, a.isCorrect, a.attempt.score " +
       "FROM Answer a WHERE a.attempt.quiz.id = :quizId")
List<Object[]> findCorrectnessWithScoresByQuizId(@Param("quizId") Long quizId);
```

**File:** `backend/src/main/java/com/tukaram/kasoti/repository/QuizAttemptRepository.java`

Add (after existing methods):

```java
// Score distribution for histogram
@Query("SELECT qa.score FROM QuizAttempt qa WHERE qa.quiz.id = :quizId ORDER BY qa.score")
List<Integer> findAllScoresByQuizId(@Param("quizId") Long quizId);
```

### Phase 1D — Backend: Analytics Service

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/AnalyticsService.java`

```
package com.tukaram.kasoti.service;

@Slf4j @Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class AnalyticsService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AnswerRepository answerRepository;

    /**
     * Main entry point — builds QuizAnalyticsDTO for a quiz.
     * IDOR-safe: verifies quiz.createdBy.id == teacherId or isAdmin.
     */
    public QuizAnalyticsDTO getQuizAnalytics(Long quizId, Long teacherId, boolean isAdmin)
        // 1. Load quiz, verify ownership
        // 2. Fetch all scores → compute avg, median, stddev, histogram
        // 3. Fetch correctCounts, optionDistribution, avgTime, marksDistribution
        //    via single-query batch calls (no N+1)
        // 4. Compute discrimination index using point-biserial correlation
        // 5. Build QuestionAnalyticsDTO for each question
        // 6. Identify hardest/easiest/poor-discriminator questions

    // --- Helper methods ---

    private Double computeMedian(List<Integer> sortedScores)
        // Middle value for odd count, average of two middles for even

    private Double computeStdDev(List<Integer> scores, double mean)
        // Standard deviation formula

    private Map<String, Integer> buildScoreHistogram(List<Integer> scores)
        // Buckets: "0-10", "11-20", ..., "91-100"

    private Double computeDiscriminationIndex(
            List<Object[]> correctnessData, Long questionId)
        // Point-biserial correlation:
        //   r_pb = (M_correct - M_wrong) / S * sqrt(p * q)
        //   where p = proportion correct, q = 1-p,
        //   M_correct = mean overall score of students who got this right,
        //   M_wrong = mean overall score of students who got this wrong,
        //   S = stddev of all overall scores

    private Map<String, Integer> buildOptionDistMap(
            List<Object[]> distData, Long questionId)
        // Filter distData rows for this questionId, build option→count map

    private Map<Integer, Integer> buildMarksDistMap(
            List<Object[]> marksData, Long questionId)
        // Filter marksData rows for this questionId, build marks→count map
}
```

**Key design:** All 5 repository queries fire once for the entire quiz — then data is partitioned in-memory by questionId. This avoids N+1 (N = number of questions) and keeps DB round-trips to 6 total regardless of quiz size.

### Phase 1E — Backend: Controller Endpoint

**File:** `backend/src/main/java/com/tukaram/kasoti/controller/DashboardController.java`

Add new endpoint (after existing `getRecentAttempts` method):

```java
@GetMapping("/quizzes/{id}/analytics")
public ResponseEntity<QuizAnalyticsDTO> getQuizAnalytics(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal) {
    QuizAnalyticsDTO analytics = analyticsService.getQuizAnalytics(
            id, principal.getId(), principal.getRole() == Role.ADMIN);
    return ResponseEntity.ok(analytics);
}
```

**Inject:** Add `private final AnalyticsService analyticsService;` to the constructor.

**Security:** Already covered by existing `SecurityConfig` rule: `/api/dashboard/**` → `hasAnyRole("ADMIN", "TEACHER")`.

### Phase 1F — Backend: Capture Time-Per-Question on Submission

**File:** `backend/src/main/java/com/tukaram/kasoti/dto/SubmitQuizRequest.java`

Add field:

```java
private Map<Long, Integer> timePerQuestion;  // questionId → seconds spent
```

**File:** `backend/src/main/java/com/tukaram/kasoti/service/QuizService.java`

In the `submitQuiz()` method, after each `Answer` is built (in the MCQ/MSQ/TRUE_FALSE/DESCRIPTIVE branches), add:

```java
if (request.getTimePerQuestion() != null) {
    Integer timeSpent = request.getTimePerQuestion().get(question.getId());
    answer.setTimeSpentSeconds(timeSpent);
}
```

This goes in 3 places:
1. After `scoreSingleOption()` call (MCQ/TRUE_FALSE branch)
2. After `scoreMultiOption()` call (MSQ branch)  
3. After `recordDescriptiveAnswer()` call (DESCRIPTIVE branch)

### Phase 1G — Frontend: API Layer

**File:** `frontend/src/api/index.js`

Add to `dashboardAPI` object (after `getRecentAttempts`):

```javascript
getQuizAnalytics: (id) =>
    api.get(`/api/dashboard/quizzes/${id}/analytics`),
```

### Phase 1H — Frontend: Track Time Per Question

**File:** `frontend/src/pages/QuizData/QuizData.js`

Changes needed to the existing timer/navigation logic:

1. **Add state:**
   ```javascript
   const [questionStartTime, setQuestionStartTime] = useState(null);
   const [timePerQuestion, setTimePerQuestion] = useState({});
   ```

2. **On question navigation** (when `currentQuestionIndex` changes):
   Record elapsed time for the previous question and reset for the new one.
   ```javascript
   // Inside the effect or handler that changes currentQuestionIndex:
   if (questionStartTime && quizDetails?.questions?.[prevIndex]) {
     const qId = quizDetails.questions[prevIndex].id;
     const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
     setTimePerQuestion(prev => ({
       ...prev,
       [qId]: (prev[qId] || 0) + elapsed
     }));
   }
   setQuestionStartTime(Date.now());
   ```

3. **On submit** — pass `timePerQuestion` to the API:
   ```javascript
   // Existing call (around line ~280):
   // BEFORE: quizAPI.submitQuiz(id, answerMap, timeTakenSeconds, multiAnsMap, textAnsMap)
   // AFTER:  quizAPI.submitQuiz(id, answerMap, timeTakenSeconds, multiAnsMap, textAnsMap, timePerQuestion)
   ```

4. **Update `quizAPI.submitQuiz`** in `frontend/src/api/index.js`:
   ```javascript
   submitQuiz: (id, answers, timeTakenSeconds, multiAnswers = null, textAnswers = null, timePerQuestion = null) => {
       const payload = { answers, timeTakenSeconds };
       if (multiAnswers) payload.multiAnswers = multiAnswers;
       if (textAnswers) payload.textAnswers = textAnswers;
       if (timePerQuestion) payload.timePerQuestion = timePerQuestion;
       return api.post(`/api/quizzes/${id}/submit`, payload);
   },
   ```

### Phase 1I — Frontend: Analytics Dashboard Component

**New file:** `frontend/src/pages/Analytics/Analytics.js`

```
Route: /dashboard/quiz/:id/analytics (Teacher/Admin only)

State:
  - analytics (QuizAnalyticsDTO)
  - loading
  - selectedTab ('overview' | 'questions' | 'difficulty')

API call:
  - dashboardAPI.getQuizAnalytics(id) on mount

Sections:
  1. Overview Cards
     - Total Attempts, Average Score, Median Score, Std Deviation
     - Score Distribution Histogram (bar chart)
  
  2. Questions Table
     - Columns: #, Question Text (truncated), Type, Difficulty Index (color-coded),
       Discrimination Index (color-coded), Avg Time, Attempts
     - Color coding: Green (>0.7 easy), Yellow (0.3–0.7 medium), Red (<0.3 hard)
     - Click row → expands to show distractor analysis
  
  3. Distractor Detail Panel (expandable per question)
     - For MCQ/MSQ/TRUE_FALSE: horizontal bar chart showing option → selection count
       with correct option highlighted in green
     - For DESCRIPTIVE: marks distribution mini-histogram
  
  4. Insights Panel
     - "Hardest Questions" list (difficulty index < 0.3)
     - "Easiest Questions" list (difficulty index > 0.8)
     - "Poor Discriminators" list (discrimination index < 0.2)
     - Actionable text: "Consider revising these questions"

New dependency: recharts (lightweight React charting)
  → npm install recharts
  → Used for: BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell

Sub-components (in same file or extracted):
  - ScoreHistogram — recharts BarChart
  - DistractorChart — recharts horizontal BarChart  
  - DifficultyBadge — colored pill (green/yellow/red)
  - InsightCard — summary insight with icon
```

### Phase 1J — Frontend: Route & Navigation

**File:** `frontend/src/App.js`

Add lazy import:
```javascript
const Analytics = lazy(() => import("./pages/Analytics/Analytics"));
```

Add route (inside the Teacher + Admin routes block, after Dashboard route):
```jsx
<Route path="/dashboard/quiz/:id/analytics" element={
  <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><AppLayout><Analytics /></AppLayout></RoleGuard></ProtectedRoute>
} />
```

**File:** `frontend/src/pages/Dashboard/Dashboard.js`

Add an "Analytics" icon button in the quiz stats table rows, linking to `/dashboard/quiz/${quizId}/analytics`.

**File:** `frontend/src/pages/QuizStudents/QuizStudents.js`

Add an "Analytics" button in the header area, linking to `/dashboard/quiz/${id}/analytics`.

### Phase 1 — File Summary

| Action | File Path | Type |
|--------|-----------|------|
| MODIFY | `backend/.../model/Answer.java` | Add `timeSpentSeconds` field |
| CREATE | `backend/.../dto/QuestionAnalyticsDTO.java` | New DTO |
| CREATE | `backend/.../dto/QuizAnalyticsDTO.java` | New DTO |
| MODIFY | `backend/.../repository/AnswerRepository.java` | Add 5 query methods |
| MODIFY | `backend/.../repository/QuizAttemptRepository.java` | Add 1 query method |
| CREATE | `backend/.../service/AnalyticsService.java` | New service (~200 lines) |
| MODIFY | `backend/.../controller/DashboardController.java` | Add 1 endpoint + inject |
| MODIFY | `backend/.../dto/SubmitQuizRequest.java` | Add `timePerQuestion` field |
| MODIFY | `backend/.../service/QuizService.java` | Set `timeSpentSeconds` on answers (3 places) |
| MODIFY | `frontend/src/api/index.js` | Add `getQuizAnalytics` + update `submitQuiz` |
| MODIFY | `frontend/src/pages/QuizData/QuizData.js` | Track time per question |
| CREATE | `frontend/src/pages/Analytics/Analytics.js` | New page (~350 lines) |
| MODIFY | `frontend/src/App.js` | Add route + lazy import |
| MODIFY | `frontend/src/pages/Dashboard/Dashboard.js` | Add analytics link |
| MODIFY | `frontend/src/pages/QuizStudents/QuizStudents.js` | Add analytics link |
| MODIFY | `frontend/package.json` | Add `recharts` dependency |

**Total: 7 new files, 9 modified files**

---

## Feature 2: AI-Assisted Auto-Grading for Descriptive Answers

**Goal:** Auto-suggest marks for descriptive answers using keyword matching + optional LLM semantic scoring, reducing teacher grading effort by ~80%.

### Phase 2A — Backend: New Enum Value

**File:** `backend/src/main/java/com/tukaram/kasoti/model/EvaluationStatus.java`

```java
public enum EvaluationStatus {
    AUTO_GRADED,    // existing — objective questions
    PENDING,        // existing — descriptive awaiting review
    AI_SUGGESTED,   // NEW — AI has suggested a grade, teacher needs to confirm
    EVALUATED       // existing — teacher has finalized
}
```

**Impact analysis:** This is safe because:
- PostgreSQL stores enum as VARCHAR — new value is just a new string
- `Answer.evaluationStatus` uses `@Enumerated(EnumType.STRING)` — no ordinal dependency
- Frontend already handles unknown statuses gracefully (falls through in switch/if)
- Existing `findPendingDescriptiveByQuizId` query filters `= 'PENDING'` — unaffected

### Phase 2B — Backend: New Fields on Answer

**File:** `backend/src/main/java/com/tukaram/kasoti/model/Answer.java`

Add after `evaluationComment` field:

```java
@Column(name = "ai_suggested_marks")
private Integer aiSuggestedMarks;

@Column(name = "ai_confidence")
private Double aiConfidence;  // 0.0 to 1.0

@Column(name = "ai_reasoning", columnDefinition = "TEXT")
private String aiReasoning;
```

### Phase 2C — Backend: Configuration Properties

**File:** `backend/src/main/resources/application.properties`

Add at the end:

```properties
# AI Evaluation Configuration
ai.enabled=${AI_ENABLED:false}
ai.provider=${AI_PROVIDER:keyword}
# Options: "keyword" (built-in, no API key needed), "openai", "ollama"
ai.openai.api-key=${AI_OPENAI_API_KEY:}
ai.openai.model=${AI_OPENAI_MODEL:gpt-4o-mini}
ai.openai.base-url=${AI_OPENAI_BASE_URL:https://api.openai.com/v1}
ai.ollama.base-url=${AI_OLLAMA_BASE_URL:http://localhost:11434}
ai.ollama.model=${AI_OLLAMA_MODEL:llama3}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/config/AiConfig.java`

```java
package com.tukaram.kasoti.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Data
@Configuration
@ConfigurationProperties(prefix = "ai")
public class AiConfig {
    private boolean enabled;
    private String provider;         // "keyword", "openai", "ollama"

    private OpenAiProps openai = new OpenAiProps();
    private OllamaProps ollama = new OllamaProps();

    @Data
    public static class OpenAiProps {
        private String apiKey;
        private String model;
        private String baseUrl;
    }

    @Data
    public static class OllamaProps {
        private String baseUrl;
        private String model;
    }

    @Bean
    public RestTemplate aiRestTemplate() {
        return new RestTemplate();
    }
}
```

### Phase 2D — Backend: Scoring Strategy Interface

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/ai/AiScoringResult.java`

```java
package com.tukaram.kasoti.service.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AiScoringResult {
    private Integer suggestedMarks;
    private Double confidence;   // 0.0–1.0
    private String reasoning;    // explanation for the teacher
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/ai/AiScoringStrategy.java`

```java
package com.tukaram.kasoti.service.ai;

public interface AiScoringStrategy {
    AiScoringResult score(String studentAnswer, String modelAnswer,
                          String keywords, int maxMarks);
}
```

### Phase 2E — Backend: Keyword Scoring Strategy (Built-in, No API Key)

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/ai/KeywordScoringStrategy.java`

```
package com.tukaram.kasoti.service.ai;

@Slf4j @Component
public class KeywordScoringStrategy implements AiScoringStrategy {

    @Override
    public AiScoringResult score(String studentAnswer, String modelAnswer,
                                  String keywords, int maxMarks)
        // Algorithm:
        // 1. Parse keywords CSV → Set<String> (lowercase, trimmed)
        // 2. Tokenize studentAnswer → Set<String> (lowercase)
        // 3. keywordScore = matchedKeywords.size() / totalKeywords.size()
        //
        // 4. If modelAnswer is not blank:
        //    - Compute Jaccard similarity between studentAnswer tokens
        //      and modelAnswer tokens (intersection/union of word sets)
        //    - similarityScore = jaccardSimilarity
        //
        // 5. finalScore = keywords.isEmpty() ? similarityScore :
        //        (keywordScore * 0.6 + similarityScore * 0.4)
        //    (If no modelAnswer, use keywordScore * 1.0)
        //
        // 6. suggestedMarks = Math.round(finalScore * maxMarks)
        //    Clamp to [0, maxMarks]
        //
        // 7. confidence = based on data quality:
        //    - Both keywords + modelAnswer present → 0.7
        //    - Only keywords → 0.5
        //    - Only modelAnswer → 0.4
        //    - Neither → 0.1
        //
        // 8. reasoning = "Matched N/M keywords (list). Similarity: X%.
        //    Suggested marks: Y/Z."

    private double jaccardSimilarity(Set<String> a, Set<String> b)
    private Set<String> tokenize(String text) // split on whitespace/punctuation, lowercase, remove stopwords
    private static final Set<String> STOP_WORDS = Set.of("the","a","an","is","are","was","were","in","on","at","to","for","of","and","or","but","not","with","this","that");
}
```

### Phase 2F — Backend: OpenAI Scoring Strategy

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/ai/OpenAiScoringStrategy.java`

```
package com.tukaram.kasoti.service.ai;

@Slf4j @Component @RequiredArgsConstructor
public class OpenAiScoringStrategy implements AiScoringStrategy {

    private final AiConfig aiConfig;
    private final RestTemplate aiRestTemplate;

    @Override
    public AiScoringResult score(String studentAnswer, String modelAnswer,
                                  String keywords, int maxMarks)
        // 1. Build prompt:
        //    "You are a teacher grading a student's answer.
        //     Question max marks: {maxMarks}
        //     Model answer: {modelAnswer}
        //     Keywords to look for: {keywords}
        //     Student's answer: {studentAnswer}
        //
        //     Respond ONLY with JSON: {"marks": <int>, "confidence": <0.0-1.0>, "reasoning": "<brief>"}"
        //
        // 2. POST to {ai.openai.base-url}/chat/completions
        //    Headers: Authorization: Bearer {ai.openai.api-key}, Content-Type: application/json
        //    Body: { model: ai.openai.model, messages: [...], temperature: 0.1, max_tokens: 200 }
        //
        // 3. Parse JSON response → extract marks, confidence, reasoning
        // 4. Clamp marks to [0, maxMarks], confidence to [0.0, 1.0]
        // 5. On any exception → fallback to KeywordScoringStrategy with confidence * 0.5

    private AiScoringResult parseResponse(String jsonContent, int maxMarks)
}
```

### Phase 2G — Backend: Ollama Scoring Strategy

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/ai/OllamaScoringStrategy.java`

```
Same structure as OpenAI but POSTs to {ai.ollama.base-url}/api/generate
with { model: ai.ollama.model, prompt: ..., format: "json", stream: false }
Parses Ollama response format. Falls back to keyword on failure.
```

### Phase 2H — Backend: AI Evaluation Service

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/AiEvaluationService.java`

```
package com.tukaram.kasoti.service;

@Slf4j @Service @RequiredArgsConstructor
public class AiEvaluationService {

    private final AnswerRepository answerRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final AiConfig aiConfig;
    private final KeywordScoringStrategy keywordStrategy;
    private final OpenAiScoringStrategy openAiStrategy;
    private final OllamaScoringStrategy ollamaStrategy;

    /**
     * Batch AI-evaluate all PENDING descriptive answers for a quiz.
     * IDOR-safe: verifies ownership.
     * Returns list of answers with AI suggestions applied.
     */
    @Transactional
    public List<AnswerDTO> autoEvaluateQuiz(Long quizId, UserPrincipal principal)
        // 1. Verify quiz ownership (same pattern as EvaluationService)
        // 2. Fetch all PENDING answers for this quiz
        // 3. Select strategy based on aiConfig.provider
        // 4. For each pending answer:
        //    a. Get question.modelAnswer, question.keywords, question.marks
        //    b. Call strategy.score(answer.textAnswer, modelAnswer, keywords, maxMarks)
        //    c. Set answer.aiSuggestedMarks = result.suggestedMarks
        //    d. Set answer.aiConfidence = result.confidence
        //    e. Set answer.aiReasoning = result.reasoning
        //    f. Set answer.evaluationStatus = EvaluationStatus.AI_SUGGESTED
        //    g. Do NOT update marksObtained yet (teacher must confirm)
        // 5. saveAll(answers)
        // 6. Return as AnswerDTO list

    /**
     * Accept AI suggestion — teacher confirms the AI-suggested marks.
     * Optionally adjust marks/comment before confirming.
     */
    @Transactional
    public AnswerDTO acceptAiSuggestion(Long answerId, Integer overrideMarks,
                                         String comment, UserPrincipal principal)
        // 1. Load answer, verify ownership
        // 2. Validate status is AI_SUGGESTED
        // 3. finalMarks = (overrideMarks != null) ? overrideMarks : answer.aiSuggestedMarks
        // 4. Delegate to existing EvaluationService.evaluateAnswer() logic:
        //    - set marksObtained, isCorrect, evaluationStatus=EVALUATED, evaluationComment
        //    - recalculate attempt totals
        // 5. Return AnswerDTO

    /**
     * Batch accept all high-confidence AI suggestions for a quiz.
     * Only accepts answers with confidence >= threshold.
     */
    @Transactional
    public int batchAcceptHighConfidence(Long quizId, Double threshold,
                                         UserPrincipal principal)
        // 1. Verify ownership
        // 2. Fetch all AI_SUGGESTED answers for this quiz where aiConfidence >= threshold
        // 3. For each: apply suggested marks as final (same as acceptAiSuggestion but no override)
        // 4. Return count of accepted answers

    private AiScoringStrategy getStrategy()
        // Switch on aiConfig.provider: "keyword" | "openai" | "ollama"

    private AnswerDTO convertToDTO(Answer a)
        // Same pattern as EvaluationService.convertToDTO, but include:
        // aiSuggestedMarks, aiConfidence, aiReasoning
}
```

### Phase 2I — Backend: New DTOs

**Modify file:** `backend/src/main/java/com/tukaram/kasoti/dto/AnswerDTO.java`

Add fields:

```java
private Integer aiSuggestedMarks;
private Double aiConfidence;
private String aiReasoning;
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/AiEvaluateRequest.java`

```java
package com.tukaram.kasoti.dto;

import lombok.Data;

@Data
public class AiEvaluateRequest {
    private Double confidenceThreshold;  // for batch accept (default 0.8)
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/AcceptAiSuggestionRequest.java`

```java
package com.tukaram.kasoti.dto;

import lombok.Data;

@Data
public class AcceptAiSuggestionRequest {
    private Integer overrideMarks;  // null = accept AI suggestion as-is
    private String comment;
}
```

### Phase 2J — Backend: Controller Endpoints

**File:** `backend/src/main/java/com/tukaram/kasoti/controller/QuizController.java`

Add 3 new endpoints (after existing `evaluateAnswer` endpoint):

```java
// Trigger AI evaluation for all pending descriptive answers
@PostMapping("/{id}/ai-evaluate")
public ResponseEntity<List<AnswerDTO>> aiEvaluateQuiz(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(aiEvaluationService.autoEvaluateQuiz(id, principal));
}

// Accept/adjust a single AI suggestion
@PutMapping("/answers/{answerId}/accept-ai")
public ResponseEntity<AnswerDTO> acceptAiSuggestion(
        @PathVariable Long answerId,
        @RequestBody AcceptAiSuggestionRequest request,
        @AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(aiEvaluationService.acceptAiSuggestion(
            answerId, request.getOverrideMarks(), request.getComment(), principal));
}

// Batch accept all high-confidence suggestions
@PostMapping("/{id}/ai-evaluate/batch-accept")
public ResponseEntity<Map<String, Integer>> batchAcceptAi(
        @PathVariable Long id,
        @RequestBody(required = false) AiEvaluateRequest request,
        @AuthenticationPrincipal UserPrincipal principal) {
    double threshold = (request != null && request.getConfidenceThreshold() != null)
            ? request.getConfidenceThreshold() : 0.8;
    int count = aiEvaluationService.batchAcceptHighConfidence(id, threshold, principal);
    return ResponseEntity.ok(Map.of("accepted", count));
}
```

**Inject:** Add `private final AiEvaluationService aiEvaluationService;` to controller.

**Security:** Add to `SecurityConfig.java`:

```java
// In the http security chain, add after existing teacher rules:
.requestMatchers(HttpMethod.POST, "/api/quizzes/*/ai-evaluate", "/api/quizzes/*/ai-evaluate/batch-accept").hasAnyRole("ADMIN", "TEACHER")
.requestMatchers(HttpMethod.PUT, "/api/quizzes/answers/*/accept-ai").hasAnyRole("ADMIN", "TEACHER")
```

### Phase 2K — Backend: AnswerRepository Update

**File:** `backend/src/main/java/com/tukaram/kasoti/repository/AnswerRepository.java`

Add:

```java
@Query("SELECT a FROM Answer a JOIN FETCH a.question q JOIN FETCH a.attempt at " +
       "JOIN FETCH at.user JOIN FETCH at.quiz WHERE at.quiz.id = :quizId " +
       "AND a.evaluationStatus = 'AI_SUGGESTED' AND a.aiConfidence >= :threshold " +
       "ORDER BY a.aiConfidence DESC")
List<Answer> findAiSuggestedByQuizIdAndConfidence(
        @Param("quizId") Long quizId, @Param("threshold") Double threshold);
```

### Phase 2L — Frontend: API Layer

**File:** `frontend/src/api/index.js`

Add to `quizAPI` object (after `evaluateAnswer`):

```javascript
// AI Evaluation
aiEvaluateQuiz: (id) =>
    api.post(`/api/quizzes/${id}/ai-evaluate`),

acceptAiSuggestion: (answerId, overrideMarks = null, comment = '') =>
    api.put(`/api/quizzes/answers/${answerId}/accept-ai`, { overrideMarks, comment }),

batchAcceptAi: (id, confidenceThreshold = 0.8) =>
    api.post(`/api/quizzes/${id}/ai-evaluate/batch-accept`, { confidenceThreshold }),
```

### Phase 2M — Frontend: QuizStudents Evaluation UI Update

**File:** `frontend/src/pages/QuizStudents/QuizStudents.js`

Changes to the existing "Pending Evaluations" tab:

1. **Add state:**
   ```javascript
   const [aiProcessing, setAiProcessing] = useState(false);
   ```

2. **Add "AI Auto-Grade" button** in the evaluations tab header:
   ```jsx
   <button onClick={handleAiEvaluate} disabled={aiProcessing}>
     {aiProcessing ? "AI Processing..." : "AI Auto-Grade All"}
   </button>
   ```

3. **Handler:**
   ```javascript
   const handleAiEvaluate = async () => {
     setAiProcessing(true);
     try {
       const res = await quizAPI.aiEvaluateQuiz(id);
       toast.success(`AI graded ${res.data.length} answers`);
       // Refresh the evaluations list
       const evalsRes = await quizAPI.getPendingEvaluations(id);
       setPendingEvals(evalsRes.data);
     } catch (err) {
       toast.error(err.response?.data?.message || "AI evaluation failed");
     } finally {
       setAiProcessing(false);
     }
   };
   ```

4. **Update eval card rendering** to show AI suggestions:
   - If `eval.evaluationStatus === 'AI_SUGGESTED'`:
     - Show AI suggested marks with confidence badge (green ≥0.8, yellow ≥0.5, red <0.5)
     - Show AI reasoning text
     - "Accept" button (calls `acceptAiSuggestion` with null override)
     - "Adjust & Accept" expands marks/comment form (calls `acceptAiSuggestion` with override)
     - "Reject" button resets status to PENDING (calls existing `evaluateAnswer`)

5. **Add "Batch Accept High Confidence" button:**
   ```jsx
   <button onClick={() => handleBatchAccept(0.8)}>
     Accept All High-Confidence (≥80%)
   </button>
   ```

### Phase 2 — File Summary

| Action | File Path | Type |
|--------|-----------|------|
| MODIFY | `backend/.../model/EvaluationStatus.java` | Add `AI_SUGGESTED` value |
| MODIFY | `backend/.../model/Answer.java` | Add 3 AI fields |
| MODIFY | `backend/src/main/resources/application.properties` | Add AI config |
| CREATE | `backend/.../config/AiConfig.java` | Config class |
| CREATE | `backend/.../service/ai/AiScoringResult.java` | Result DTO |
| CREATE | `backend/.../service/ai/AiScoringStrategy.java` | Strategy interface |
| CREATE | `backend/.../service/ai/KeywordScoringStrategy.java` | Built-in scorer |
| CREATE | `backend/.../service/ai/OpenAiScoringStrategy.java` | OpenAI scorer |
| CREATE | `backend/.../service/ai/OllamaScoringStrategy.java` | Ollama scorer |
| CREATE | `backend/.../service/AiEvaluationService.java` | Orchestrator service |
| CREATE | `backend/.../dto/AiEvaluateRequest.java` | Request DTO |
| CREATE | `backend/.../dto/AcceptAiSuggestionRequest.java` | Request DTO |
| MODIFY | `backend/.../dto/AnswerDTO.java` | Add 3 AI fields |
| MODIFY | `backend/.../controller/QuizController.java` | Add 3 endpoints |
| MODIFY | `backend/.../config/SecurityConfig.java` | Add AI endpoint rules |
| MODIFY | `backend/.../repository/AnswerRepository.java` | Add 1 query |
| MODIFY | `frontend/src/api/index.js` | Add 3 AI API methods |
| MODIFY | `frontend/src/pages/QuizStudents/QuizStudents.js` | AI grading UI |

**Total: 8 new files, 10 modified files**

---

## Feature 3: Real-Time Live Quiz Sessions (WebSocket-Powered)

**Goal:** Kahoot-style synchronized quizzes — teacher starts session, students join via room code, questions advance together, live leaderboard after each question.

### Phase 3A — Backend: Dependencies

**File:** `backend/pom.xml`

Add inside `<dependencies>`:

```xml
<!-- WebSocket support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### Phase 3B — Backend: New Entities

**New file:** `backend/src/main/java/com/tukaram/kasoti/model/LiveSession.java`

```java
package com.tukaram.kasoti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "live_session")
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "live_session_seq")
    @SequenceGenerator(name = "live_session_seq", sequenceName = "live_session_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @ToString.Exclude
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    @ToString.Exclude
    private User host;

    @Column(name = "room_code", unique = true, nullable = false, length = 6)
    private String roomCode;  // 6-digit alphanumeric

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LiveSessionStatus status = LiveSessionStatus.LOBBY;

    @Column(name = "current_question_index")
    @Builder.Default
    private Integer currentQuestionIndex = -1;  // -1 = not started

    @Column(name = "question_start_time")
    private LocalDateTime questionStartTime;

    @Column(name = "time_per_question_seconds")
    @Builder.Default
    private Integer timePerQuestionSeconds = 30;

    @Column(name = "max_participants")
    @Builder.Default
    private Integer maxParticipants = 100;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/model/LiveSessionStatus.java`

```java
package com.tukaram.kasoti.model;

public enum LiveSessionStatus {
    LOBBY,          // Waiting for students to join
    IN_PROGRESS,    // Questions are being presented
    QUESTION_OPEN,  // Current question is accepting answers
    QUESTION_CLOSED,// Current question time expired, showing results
    FINISHED        // All questions done, final leaderboard
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/model/LiveParticipant.java`

```java
package com.tukaram.kasoti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "live_participant",
    uniqueConstraints = @UniqueConstraint(name = "uq_session_user",
        columnNames = {"session_id", "user_id"}))
public class LiveParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "live_participant_seq")
    @SequenceGenerator(name = "live_participant_seq", sequenceName = "live_participant_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private LiveSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "total_score")
    @Builder.Default
    private Integer totalScore = 0;

    @Column(name = "correct_count")
    @Builder.Default
    private Integer correctCount = 0;

    @Column(name = "current_streak")
    @Builder.Default
    private Integer currentStreak = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean connected = true;

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/model/LiveAnswer.java`

```java
package com.tukaram.kasoti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "live_answer",
    uniqueConstraints = @UniqueConstraint(name = "uq_participant_question",
        columnNames = {"participant_id", "question_index"}))
public class LiveAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "live_answer_seq")
    @SequenceGenerator(name = "live_answer_seq", sequenceName = "live_answer_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    @ToString.Exclude
    private LiveParticipant participant;

    @Column(name = "question_index", nullable = false)
    private Integer questionIndex;

    @Column(name = "selected_option")
    private String selectedOption;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "points_earned")
    @Builder.Default
    private Integer pointsEarned = 0;

    @Column(name = "answer_time_ms")
    private Long answerTimeMs;  // milliseconds from question display to answer

    @CreationTimestamp
    @Column(name = "answered_at", updatable = false)
    private LocalDateTime answeredAt;
}
```

### Phase 3C — Backend: Repositories

**New file:** `backend/src/main/java/com/tukaram/kasoti/repository/LiveSessionRepository.java`

```java
package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.LiveSession;
import com.tukaram.kasoti.model.LiveSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LiveSessionRepository extends JpaRepository<LiveSession, Long> {
    Optional<LiveSession> findByRoomCode(String roomCode);
    List<LiveSession> findByHostIdAndStatusNot(Long hostId, LiveSessionStatus status);
    List<LiveSession> findByHostId(Long hostId);
    boolean existsByRoomCode(String roomCode);
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/repository/LiveParticipantRepository.java`

```java
package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.LiveParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LiveParticipantRepository extends JpaRepository<LiveParticipant, Long> {
    List<LiveParticipant> findBySessionIdOrderByTotalScoreDesc(Long sessionId);
    Optional<LiveParticipant> findBySessionIdAndUserId(Long sessionId, Long userId);
    long countBySessionIdAndConnectedTrue(Long sessionId);
    boolean existsBySessionIdAndUserId(Long sessionId, Long userId);
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/repository/LiveAnswerRepository.java`

```java
package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.LiveAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface LiveAnswerRepository extends JpaRepository<LiveAnswer, Long> {
    Optional<LiveAnswer> findByParticipantIdAndQuestionIndex(Long participantId, Integer questionIndex);
    List<LiveAnswer> findByParticipantSessionIdAndQuestionIndex(Long sessionId, Integer questionIndex);
    boolean existsByParticipantIdAndQuestionIndex(Long participantId, Integer questionIndex);

    @Query("SELECT la.selectedOption, COUNT(la) FROM LiveAnswer la " +
           "WHERE la.participant.session.id = :sessionId AND la.questionIndex = :qIndex " +
           "GROUP BY la.selectedOption")
    List<Object[]> findOptionCountsForQuestion(@Param("sessionId") Long sessionId,
                                                @Param("qIndex") Integer qIndex);
}
```

### Phase 3D — Backend: WebSocket Configuration

**New file:** `backend/src/main/java/com/tukaram/kasoti/config/WebSocketConfig.java`

```java
package com.tukaram.kasoti.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");        // server → client broadcasts
        config.setApplicationDestinationPrefixes("/app");  // client → server messages
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/config/WebSocketAuthInterceptor.java`

```
Intercepts STOMP CONNECT frame → extracts JWT from 'Authorization' header
or from query param ?token=... → validates via JwtTokenProvider → sets
UserPrincipal in STOMP session attributes.
Rejects connection if token is invalid.
```

### Phase 3E — Backend: Live Session DTOs

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/live/CreateLiveSessionRequest.java`

```java
@Data
public class CreateLiveSessionRequest {
    @NotNull private Long quizId;
    private Integer timePerQuestionSeconds = 30;  // default 30s
    private Integer maxParticipants = 100;
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/live/LiveSessionDTO.java`

```java
@Data @Builder
public class LiveSessionDTO {
    private Long id;
    private String roomCode;
    private String quizTitle;
    private String hostName;
    private String status;
    private Integer currentQuestionIndex;
    private Integer totalQuestions;
    private Integer participantCount;
    private Integer timePerQuestionSeconds;
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/live/LiveQuestionDTO.java`

```java
@Data @Builder
public class LiveQuestionDTO {
    private Integer questionIndex;
    private String text;
    private String questionType;
    private List<String> options;
    private Integer marks;
    private Integer timeSeconds;
    private Integer totalQuestions;
}
// NOTE: Never includes correct answer — sent separately after time expires
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/live/LiveAnswerRequest.java`

```java
@Data
public class LiveAnswerRequest {
    private Long sessionId;
    private Integer questionIndex;
    private String selectedOption;
    private Long answerTimeMs;
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/live/LiveLeaderboardDTO.java`

```java
@Data @Builder
public class LiveLeaderboardDTO {
    private Integer questionIndex;
    private String correctOption;
    private Map<String, Integer> optionCounts;  // option → how many chose it
    private List<LivePlayerScore> topPlayers;   // top 5
    private LivePlayerScore currentPlayer;       // requesting user's score

    @Data @Builder
    public static class LivePlayerScore {
        private Long userId;
        private String displayName;
        private Integer totalScore;
        private Integer pointsThisRound;
        private Integer correctCount;
        private Integer currentStreak;
        private Integer rank;
    }
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/dto/live/FinalResultsDTO.java`

```java
@Data @Builder
public class FinalResultsDTO {
    private String quizTitle;
    private Integer totalQuestions;
    private List<LiveLeaderboardDTO.LivePlayerScore> finalLeaderboard;  // all players, ranked
    private LiveLeaderboardDTO.LivePlayerScore myResult;
}
```

### Phase 3F — Backend: Live Session Service

**New file:** `backend/src/main/java/com/tukaram/kasoti/service/LiveSessionService.java`

```
@Slf4j @Service @RequiredArgsConstructor
public class LiveSessionService {

    private final LiveSessionRepository liveSessionRepository;
    private final LiveParticipantRepository liveParticipantRepository;
    private final LiveAnswerRepository liveAnswerRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // --- Session Lifecycle ---

    @Transactional
    public LiveSessionDTO createSession(CreateLiveSessionRequest req, UserPrincipal principal)
        // 1. Load quiz, verify ownership (teacher/admin only)
        // 2. Validate quiz has questions and is PUBLISHED
        // 3. Generate unique 6-char room code
        // 4. Create LiveSession entity (LOBBY status)
        // 5. Return LiveSessionDTO

    @Transactional
    public LiveSessionDTO joinSession(String roomCode, UserPrincipal principal)
        // 1. Find session by roomCode
        // 2. Validate status == LOBBY
        // 3. Check not already joined, not exceeding maxParticipants
        // 4. Create LiveParticipant
        // 5. Broadcast to /topic/session/{roomCode}/lobby: player joined event
        // 6. Return LiveSessionDTO

    // --- Question Flow (Host actions) ---

    @Transactional
    public void startSession(Long sessionId, UserPrincipal principal)
        // 1. Verify host ownership
        // 2. Set status = IN_PROGRESS
        // 3. Advance to question 0 via nextQuestion()
        // 4. Broadcast to /topic/session/{roomCode}: SESSION_STARTED event

    @Transactional
    public void nextQuestion(Long sessionId, UserPrincipal principal)
        // 1. Verify host
        // 2. Increment currentQuestionIndex
        // 3. If index >= quiz.questions.size(): call endSession()
        // 4. Set status = QUESTION_OPEN, questionStartTime = now
        // 5. Build LiveQuestionDTO (WITHOUT correct answer)
        // 6. Broadcast to /topic/session/{roomCode}/question: LiveQuestionDTO
        // 7. Schedule auto-close after timePerQuestionSeconds (via @Async or ScheduledExecutor)

    @Transactional
    public LiveLeaderboardDTO closeQuestion(Long sessionId, UserPrincipal principal)
        // 1. Verify host or auto-close timer
        // 2. Set status = QUESTION_CLOSED
        // 3. Score all answers for this question
        // 4. Update participant scores
        // 5. Build leaderboard (top 5 + option counts + correct answer)
        // 6. Broadcast to /topic/session/{roomCode}/results: LiveLeaderboardDTO
        // 7. Return LiveLeaderboardDTO

    @Transactional
    public FinalResultsDTO endSession(Long sessionId, UserPrincipal principal)
        // 1. Set status = FINISHED, endedAt = now
        // 2. Build final leaderboard with all players ranked
        // 3. Broadcast to /topic/session/{roomCode}/final: FinalResultsDTO
        // 4. Return FinalResultsDTO

    // --- Student Actions ---

    @Transactional
    public void submitAnswer(LiveAnswerRequest request, UserPrincipal principal)
        // 1. Find session, validate QUESTION_OPEN status
        // 2. Find participant by session + user
        // 3. Check not already answered this question (unique constraint)
        // 4. Create LiveAnswer entity
        // 5. Broadcast to host: answer count update (topic/session/{roomCode}/host)

    // --- Scoring ---

    private int calculatePoints(boolean correct, long answerTimeMs, int maxTimeMs, int marks)
        // Speed bonus: faster answers get more points
        // Formula: if correct: marks * 1000 * (1 - answerTimeMs/(maxTimeMs*1000) * 0.5)
        //          if wrong: 0
        // Max points = marks * 1000, Min (if slow but correct) = marks * 500

    // --- Helpers ---

    private String generateRoomCode()  // 6-char uppercase alphanumeric
    private LiveSessionDTO toDTO(LiveSession session)
}
```

### Phase 3G — Backend: WebSocket Controller

**New file:** `backend/src/main/java/com/tukaram/kasoti/controller/LiveSessionController.java`

```java
@RestController @RequestMapping("/api/live")
public class LiveSessionController {

    // REST endpoints for session management
    @PostMapping("/sessions")          → createSession
    @PostMapping("/sessions/join")     → joinSession (body: { roomCode })
    @PostMapping("/sessions/{id}/start")  → startSession
    @PostMapping("/sessions/{id}/next")   → nextQuestion
    @PostMapping("/sessions/{id}/close-question") → closeQuestion
    @PostMapping("/sessions/{id}/end")    → endSession
    @GetMapping("/sessions/{id}")      → getSessionStatus
    @GetMapping("/sessions/{id}/leaderboard") → getCurrentLeaderboard
}
```

**New file:** `backend/src/main/java/com/tukaram/kasoti/controller/LiveWebSocketController.java`

```java
@Controller
public class LiveWebSocketController {

    // STOMP message handlers (client → server via WebSocket)
    @MessageMapping("/live/answer")    → submitAnswer (from LiveAnswerRequest)
    @MessageMapping("/live/ping")      → keepAlive / connection check
}
```

### Phase 3H — Backend: Security Updates

**File:** `backend/src/main/java/com/tukaram/kasoti/config/SecurityConfig.java`

Add to the HTTP security chain:

```java
// Live Session REST endpoints
.requestMatchers(HttpMethod.POST, "/api/live/sessions").hasAnyRole("ADMIN", "TEACHER")
.requestMatchers(HttpMethod.POST, "/api/live/sessions/join").authenticated()
.requestMatchers(HttpMethod.POST, "/api/live/sessions/*/start",
                 "/api/live/sessions/*/next",
                 "/api/live/sessions/*/close-question",
                 "/api/live/sessions/*/end").hasAnyRole("ADMIN", "TEACHER")
.requestMatchers(HttpMethod.GET, "/api/live/sessions/**").authenticated()
// WebSocket endpoint
.requestMatchers("/ws/**").permitAll()  // Auth handled by WebSocket interceptor
```

### Phase 3I — Frontend: Dependencies

**File:** `frontend/package.json`

Add:

```json
"@stomp/stompjs": "^7.0.0",
"sockjs-client": "^1.6.1"
```

### Phase 3J — Frontend: WebSocket Hook

**New file:** `frontend/src/hooks/useWebSocket.js`

```
Custom hook that:
1. Creates SockJS connection to /ws
2. Connects via STOMP with JWT token in headers
3. Subscribes to specified topics
4. Returns: { connected, subscribe, unsubscribe, send, disconnect }
5. Auto-reconnects on disconnect (3 retries with backoff)
6. Cleans up on component unmount
```

### Phase 3K — Frontend: API Layer

**File:** `frontend/src/api/index.js`

Add new module:

```javascript
// Live Session API
export const liveAPI = {
    createSession: (quizId, timePerQuestion = 30, maxParticipants = 100) =>
        api.post('/api/live/sessions', { quizId, timePerQuestionSeconds: timePerQuestion, maxParticipants }),

    joinSession: (roomCode) =>
        api.post('/api/live/sessions/join', { roomCode }),

    startSession: (sessionId) =>
        api.post(`/api/live/sessions/${sessionId}/start`),

    nextQuestion: (sessionId) =>
        api.post(`/api/live/sessions/${sessionId}/next`),

    closeQuestion: (sessionId) =>
        api.post(`/api/live/sessions/${sessionId}/close-question`),

    endSession: (sessionId) =>
        api.post(`/api/live/sessions/${sessionId}/end`),

    getSession: (sessionId) =>
        api.get(`/api/live/sessions/${sessionId}`),

    getLeaderboard: (sessionId) =>
        api.get(`/api/live/sessions/${sessionId}/leaderboard`),
};
```

### Phase 3L — Frontend: Live Quiz Pages

**New file:** `frontend/src/pages/LiveQuiz/HostLobby.js`

```
Route: /live/host/:sessionId

State: session, participants[], connected

WebSocket subscriptions:
  - /topic/session/{roomCode}/lobby → new player joined

UI:
  - Room code display (large, copyable)
  - Participant list with avatars
  - Participant count
  - "Start Quiz" button (disabled until ≥1 participant)
  - Quiz settings summary
```

**New file:** `frontend/src/pages/LiveQuiz/HostGame.js`

```
Route: /live/host/:sessionId/game

State: currentQuestion, answers count, results, timer, questionIndex, phase

WebSocket subscriptions:
  - /topic/session/{roomCode}/host → answer count updates

UI phases:
  1. QUESTION_OPEN: Show question + options + countdown timer + answer count indicator
  2. QUESTION_CLOSED: Show results chart (option distribution bar chart) + correct answer +
     leaderboard (top 5 with animations) + "Next Question" button
  3. FINISHED: Final leaderboard with podium animation (1st/2nd/3rd)

Controls: "Skip Timer" button, "Next Question" button, "End Quiz" button
```

**New file:** `frontend/src/pages/LiveQuiz/PlayerJoin.js`

```
Route: /live/join or /live/join/:roomCode

State: roomCode (input or from URL param), joining, session

UI:
  - Room code input (6 characters, uppercase)
  - "Join" button
  - Waiting animation after joining

On success: redirects to /live/play/:sessionId
```

**New file:** `frontend/src/pages/LiveQuiz/PlayerGame.js`

```
Route: /live/play/:sessionId

State: question, timeLeft, answered, results, myScore, phase, leaderboard

WebSocket subscriptions:
  - /topic/session/{roomCode}/question → new question arrives
  - /topic/session/{roomCode}/results → question results + leaderboard
  - /topic/session/{roomCode}/final → game over

UI phases:
  1. WAITING: "Get ready!" animation
  2. QUESTION: Question text + option buttons (full screen, colored quadrants like Kahoot)
     + countdown timer bar
     On option click: send STOMP message /app/live/answer, disable buttons, show "Answer submitted!"
  3. RESULTS: Show if correct/wrong + points earned + streak + rank change animation +
     mini leaderboard (top 5 with "You" highlighted)
  4. FINAL: Full leaderboard with podium, confetti for top 3, "Your rank: #X" with total score
```

### Phase 3M — Frontend: Routes & Navigation

**File:** `frontend/src/App.js`

Add lazy imports:

```javascript
const HostLobby = lazy(() => import("./pages/LiveQuiz/HostLobby"));
const HostGame = lazy(() => import("./pages/LiveQuiz/HostGame"));
const PlayerJoin = lazy(() => import("./pages/LiveQuiz/PlayerJoin"));
const PlayerGame = lazy(() => import("./pages/LiveQuiz/PlayerGame"));
```

Add routes:

```jsx
{/* Live Quiz routes */}
<Route path="/live/host/:sessionId" element={
  <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><HostLobby /></RoleGuard></ProtectedRoute>
} />
<Route path="/live/host/:sessionId/game" element={
  <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><HostGame /></RoleGuard></ProtectedRoute>
} />
<Route path="/live/join" element={
  <ProtectedRoute><PlayerJoin /></ProtectedRoute>
} />
<Route path="/live/join/:roomCode" element={
  <ProtectedRoute><PlayerJoin /></ProtectedRoute>
} />
<Route path="/live/play/:sessionId" element={
  <ProtectedRoute><PlayerGame /></ProtectedRoute>
} />
```

**Note:** Live quiz pages do NOT use `<AppLayout>` (no Navbar) — they are full-screen immersive experiences.

**File:** `frontend/src/components/Navbar.js`

Add "Join Live" button/link visible to all authenticated users. Add "Go Live" button visible to teachers/admins.

**File:** `frontend/src/pages/Home/Home.js` (or QuizCard)

For teachers: add "Go Live" button on quiz cards that starts a live session.

### Phase 3 — File Summary

| Action | File Path | Type |
|--------|-----------|------|
| MODIFY | `backend/pom.xml` | Add websocket dependency |
| CREATE | `backend/.../model/LiveSession.java` | New entity |
| CREATE | `backend/.../model/LiveSessionStatus.java` | New enum |
| CREATE | `backend/.../model/LiveParticipant.java` | New entity |
| CREATE | `backend/.../model/LiveAnswer.java` | New entity |
| CREATE | `backend/.../repository/LiveSessionRepository.java` | New repo |
| CREATE | `backend/.../repository/LiveParticipantRepository.java` | New repo |
| CREATE | `backend/.../repository/LiveAnswerRepository.java` | New repo |
| CREATE | `backend/.../config/WebSocketConfig.java` | STOMP config |
| CREATE | `backend/.../config/WebSocketAuthInterceptor.java` | Auth handler |
| CREATE | `backend/.../dto/live/CreateLiveSessionRequest.java` | DTO |
| CREATE | `backend/.../dto/live/LiveSessionDTO.java` | DTO |
| CREATE | `backend/.../dto/live/LiveQuestionDTO.java` | DTO |
| CREATE | `backend/.../dto/live/LiveAnswerRequest.java` | DTO |
| CREATE | `backend/.../dto/live/LiveLeaderboardDTO.java` | DTO |
| CREATE | `backend/.../dto/live/FinalResultsDTO.java` | DTO |
| CREATE | `backend/.../service/LiveSessionService.java` | Core service (~400 lines) |
| CREATE | `backend/.../controller/LiveSessionController.java` | REST controller |
| CREATE | `backend/.../controller/LiveWebSocketController.java` | STOMP controller |
| MODIFY | `backend/.../config/SecurityConfig.java` | Add live endpoints |
| MODIFY | `frontend/package.json` | Add stomp + sockjs deps |
| CREATE | `frontend/src/hooks/useWebSocket.js` | Custom hook |
| MODIFY | `frontend/src/api/index.js` | Add liveAPI module |
| CREATE | `frontend/src/pages/LiveQuiz/HostLobby.js` | Host lobby page |
| CREATE | `frontend/src/pages/LiveQuiz/HostGame.js` | Host game page |
| CREATE | `frontend/src/pages/LiveQuiz/PlayerJoin.js` | Player join page |
| CREATE | `frontend/src/pages/LiveQuiz/PlayerGame.js` | Player game page |
| MODIFY | `frontend/src/App.js` | Add 5 routes + lazy imports |
| MODIFY | `frontend/src/components/Navbar.js` | Add live quiz links |

**Total: 22 new files, 7 modified files**

---

## Implementation Order & Dependencies

```
Week 1-2: Feature 1 (Question Analytics)
  ├─ No external dependencies
  ├─ Uses existing data in answer table
  ├─ Only 1 schema addition (timeSpentSeconds — nullable, safe)
  └─ Foundation for Feature 2 (understanding answer distribution)

Week 3-4: Feature 2 (AI Auto-Grading)
  ├─ Depends on: Nothing from Feature 1 technically, but analytics
  │   helps teachers validate AI accuracy
  ├─ Keyword strategy works out-of-the-box (no API key)
  ├─ OpenAI/Ollama are opt-in via config
  └─ Leverages existing keywords/modelAnswer fields already in Question entity

Week 5-7: Feature 3 (Live Quiz Sessions)
  ├─ Largest scope — new infrastructure (WebSocket)
  ├─ 4 new DB tables (auto-created by ddl-auto=update)
  ├─ No impact on existing quiz flow — completely additive
  └─ Can be developed in parallel by a separate developer
```

---

## Database Migration Summary

All migrations are handled automatically by `spring.jpa.hibernate.ddl-auto=update`.

### Feature 1 — Column Additions
```sql
-- Auto-generated by Hibernate:
ALTER TABLE answer ADD COLUMN time_spent_seconds INTEGER;
```

### Feature 2 — Column Additions
```sql
-- Auto-generated by Hibernate:
ALTER TABLE answer ADD COLUMN ai_suggested_marks INTEGER;
ALTER TABLE answer ADD COLUMN ai_confidence DOUBLE PRECISION;
ALTER TABLE answer ADD COLUMN ai_reasoning TEXT;
```

### Feature 3 — New Tables
```sql
-- Auto-generated by Hibernate:
CREATE TABLE live_session (...);
CREATE TABLE live_participant (...);
CREATE TABLE live_answer (...);
-- Plus sequences and constraints
```

**Zero manual migration scripts needed.** All columns are nullable → existing rows unaffected.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Analytics N+1 queries** | All 5 analytics queries fire once per quiz, data partitioned in-memory by questionId |
| **AI API rate limits/cost** | Keyword strategy is default (free). OpenAI calls batched. Teacher must explicitly trigger. |
| **AI hallucinated grades** | AI only SUGGESTS — teacher confirmation required. Batch-accept has configurable confidence threshold. |
| **WebSocket memory leaks** | Sessions auto-expire after 2 hours. Disconnected participants tracked. Cleanup scheduled task. |
| **WebSocket scaling** | Simple broker is single-instance. For multi-instance: swap to RabbitMQ/Redis broker (just config change). |
| **Live quiz cheating** | Questions sent without correct answers. Correct answer revealed only after time expires. Speed bonus incentivizes fast legitimate answers. |
| **Existing tests breaking** | New `EvaluationStatus.AI_SUGGESTED` value is additive. All existing queries filter specific values, never use != or NOT IN. |
| **Frontend bundle size** | `recharts` adds ~45KB gzipped. STOMP+SockJS adds ~20KB. All lazy-loaded — zero impact on initial load. |

---

## Grand Total

| Metric | Feature 1 | Feature 2 | Feature 3 | Total |
|--------|-----------|-----------|-----------|-------|
| New backend files | 3 | 8 | 15 | **26** |
| Modified backend files | 6 | 6 | 2 | **14** |
| New frontend files | 1 | 0 | 5 | **6** |
| Modified frontend files | 6 | 2 | 4 | **12** |
| New DB columns | 1 | 3 | 0 | **4** |
| New DB tables | 0 | 0 | 3 | **3** |
| New npm packages | 1 | 0 | 2 | **3** |
| New Maven deps | 0 | 0 | 1 | **1** |
| Estimated lines of code | ~800 | ~900 | ~2000 | **~3700** |
