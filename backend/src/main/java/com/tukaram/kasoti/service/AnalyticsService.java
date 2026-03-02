package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.QuestionAnalyticsDTO;
import com.tukaram.kasoti.dto.QuizAnalyticsDTO;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.Question;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.repository.AnswerRepository;
import com.tukaram.kasoti.repository.QuizAttemptRepository;
import com.tukaram.kasoti.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for question-level and quiz-level analytics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;

    /**
     * Build comprehensive analytics for a quiz.
     * Only the quiz owner (teacher) is allowed to access.
     */
    public QuizAnalyticsDTO getQuizAnalytics(Long quizId, Long teacherId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (!quiz.getCreatedBy().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this quiz");
        }

        // ---------- Quiz-level aggregation ----------
        List<Integer> rawScores = attemptRepository.findAllScoresByQuizId(quizId);
        List<Double> scores = rawScores.stream().map(Integer::doubleValue).collect(Collectors.toList());
        int totalAttempts = scores.size();

        if (totalAttempts == 0) {
            return QuizAnalyticsDTO.builder()
                    .quizId(quizId)
                    .quizTitle(quiz.getTitle())
                    .totalAttempts(0)
                    .averageScore(0.0)
                    .medianScore(0.0)
                    .standardDeviation(0.0)
                    .scoreDistribution(Collections.emptyMap())
                    .questionAnalytics(Collections.emptyList())
                    .hardestQuestions(Collections.emptyList())
                    .easiestQuestions(Collections.emptyList())
                    .poorDiscriminators(Collections.emptyList())
                    .build();
        }

        double averageScore = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double medianScore = computeMedian(scores);
        double stdDev = computeStdDev(scores, averageScore);
        Map<String, Integer> scoreDistribution = buildScoreHistogram(scores);

        // ---------- Per-question data (batch queries) ----------
        Map<Long, Long> correctCounts = toMapLong(answerRepository.findCorrectCountsByQuizId(quizId));
        Map<Long, Long> totalCounts = toMapLong(answerRepository.findTotalCountsByQuizId(quizId));
        Map<Long, Map<String, Integer>> optionDists = toOptionDistMap(answerRepository.findSingleOptionDistributionByQuizId(quizId));
        // Merge MSQ multi-option distribution into the same map
        mergeOptionDistMap(optionDists, answerRepository.findMultiOptionDistributionByQuizId(quizId));
        Map<Long, Double> avgTimes = toMapDouble(answerRepository.findAverageTimeByQuizId(quizId));
        Map<Long, Map<String, Integer>> marksDists = toMarksDistMap(answerRepository.findMarksDistributionByQuizId(quizId));

        // For discrimination index: per-question list of (isCorrect, totalScore)
        Map<Long, List<double[]>> correctnessWithScores = new HashMap<>();
        for (Object[] row : answerRepository.findCorrectnessWithScoresByQuizId(quizId)) {
            Long qId = (Long) row[0];
            boolean correct = row[1] != null && (Boolean) row[1];
            double score = row[2] != null ? ((Number) row[2]).doubleValue() : 0;
            correctnessWithScores.computeIfAbsent(qId, k -> new ArrayList<>())
                    .add(new double[]{correct ? 1.0 : 0.0, score});
        }

        // ---------- Build per-question DTOs ----------
        List<QuestionAnalyticsDTO> questionAnalytics = new ArrayList<>();

        for (Question q : quiz.getQuestions()) {
            Long qId = q.getId();
            long correct = correctCounts.getOrDefault(qId, 0L);
            long total = totalCounts.getOrDefault(qId, 0L);
            double difficultyIndex = total > 0 ? (double) correct / total : 0;
            double discriminationIndex = computeDiscriminationIndex(correctnessWithScores.get(qId));

            QuestionAnalyticsDTO dto = QuestionAnalyticsDTO.builder()
                    .questionId(qId)
                    .questionText(q.getText())
                    .questionType(q.getQuestionType().name())
                    .marks(q.getMarks())
                    .difficultyIndex(round(difficultyIndex))
                    .discriminationIndex(round(discriminationIndex))
                    .averageTimeSeconds(round(avgTimes.getOrDefault(qId, 0.0)))
                    .totalAttempts((int) total)
                    .optionDistribution(optionDists.getOrDefault(qId, Collections.emptyMap()))
                    .correctOption(q.getCorrectOption())
                    .correctOptions(q.getCorrectOptions() != null ? new ArrayList<>(q.getCorrectOptions()) : null)
                    .marksDistribution(marksDists.getOrDefault(qId, Collections.emptyMap()))
                    .build();

            questionAnalytics.add(dto);
        }

        // ---------- Derived lists ----------
        List<QuestionAnalyticsDTO> sorted = new ArrayList<>(questionAnalytics);

        // Hardest = lowest difficulty index (top 5)
        sorted.sort(Comparator.comparingDouble(QuestionAnalyticsDTO::getDifficultyIndex));
        List<QuestionAnalyticsDTO> hardest = sorted.stream().limit(5).collect(Collectors.toList());

        // Easiest = highest difficulty index (top 5)
        List<QuestionAnalyticsDTO> easiest = sorted.stream()
                .sorted(Comparator.comparingDouble(QuestionAnalyticsDTO::getDifficultyIndex).reversed())
                .limit(5)
                .collect(Collectors.toList());

        // Poor discriminators (discrimination < 0.2)
        List<QuestionAnalyticsDTO> poorDisc = questionAnalytics.stream()
                .filter(q -> q.getDiscriminationIndex() < 0.2)
                .collect(Collectors.toList());

        return QuizAnalyticsDTO.builder()
                .quizId(quizId)
                .quizTitle(quiz.getTitle())
                .totalAttempts(totalAttempts)
                .averageScore(round(averageScore))
                .medianScore(round(medianScore))
                .standardDeviation(round(stdDev))
                .scoreDistribution(scoreDistribution)
                .questionAnalytics(questionAnalytics)
                .hardestQuestions(hardest)
                .easiestQuestions(easiest)
                .poorDiscriminators(poorDisc)
                .build();
    }

    // ========== Helper Methods ==========

    private double computeMedian(List<Double> sorted) {
        int n = sorted.size();
        if (n == 0) return 0;
        if (n % 2 == 1) return sorted.get(n / 2);
        return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
    }

    private double computeStdDev(List<Double> values, double mean) {
        if (values.size() <= 1) return 0;
        double sumSq = values.stream().mapToDouble(v -> Math.pow(v - mean, 2)).sum();
        return Math.sqrt(sumSq / values.size());
    }

    private Map<String, Integer> buildScoreHistogram(List<Double> scores) {
        // Create buckets of width 10: "0-10", "11-20", etc.
        Map<String, Integer> histogram = new LinkedHashMap<>();
        double max = scores.stream().mapToDouble(Double::doubleValue).max().orElse(100);
        // Ensure we have enough buckets (score 100 needs bucket "91-100")
        int bucketCount = Math.max(1, (int) Math.ceil((max + 1) / 10.0));

        for (int i = 0; i < bucketCount; i++) {
            int low = i * 10 + (i == 0 ? 0 : 1);
            int high = (i + 1) * 10;
            histogram.put(low + "-" + high, 0);
        }

        for (double score : scores) {
            // Use floor division; score 10 → bucket 0 ("0-10"), score 11 → bucket 1 ("11-20")
            int bucket;
            if (score <= 0) {
                bucket = 0;
            } else {
                bucket = Math.min((int) Math.ceil(score / 10.0) - 1, bucketCount - 1);
            }
            int low = bucket * 10 + (bucket == 0 ? 0 : 1);
            int high = (bucket + 1) * 10;
            String key = low + "-" + high;
            histogram.merge(key, 1, Integer::sum);
        }

        return histogram;
    }

    /**
     * Point-biserial correlation between question correctness and total score.
     * r_pb = (M1 - M0) / S * sqrt(p * q)
     * where M1 = mean score of correct group, M0 = mean score of incorrect group,
     * S = overall std dev, p = proportion correct, q = 1 - p.
     */
    private double computeDiscriminationIndex(List<double[]> data) {
        if (data == null || data.size() < 2) return 0;

        double sumAll = 0, sumCorrect = 0, sumIncorrect = 0;
        int nCorrect = 0, nIncorrect = 0;

        for (double[] d : data) {
            sumAll += d[1];
            if (d[0] == 1.0) {
                sumCorrect += d[1];
                nCorrect++;
            } else {
                sumIncorrect += d[1];
                nIncorrect++;
            }
        }

        if (nCorrect == 0 || nIncorrect == 0) return 0;

        double meanCorrect = sumCorrect / nCorrect;
        double meanIncorrect = sumIncorrect / nIncorrect;
        double meanAll = sumAll / data.size();
        double stdDev = computeStdDev(
                data.stream().map(d -> d[1]).collect(Collectors.toList()), meanAll);

        if (stdDev == 0) return 0;

        double p = (double) nCorrect / data.size();
        double q = 1 - p;

        return (meanCorrect - meanIncorrect) / stdDev * Math.sqrt(p * q);
    }

    // ---------- Row-mapping helpers ----------

    private Map<Long, Long> toMapLong(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    private Map<Long, Double> toMapDouble(List<Object[]> rows) {
        Map<Long, Double> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], ((Number) row[1]).doubleValue());
        }
        return map;
    }

    private Map<Long, Map<String, Integer>> toOptionDistMap(List<Object[]> rows) {
        Map<Long, Map<String, Integer>> map = new HashMap<>();
        for (Object[] row : rows) {
            Long qId = (Long) row[0];
            String option = (String) row[1];
            int count = ((Number) row[2]).intValue();
            map.computeIfAbsent(qId, k -> new LinkedHashMap<>()).put(option, count);
        }
        return map;
    }

    /** Merge MSQ multi-option distribution (native query returns BigInteger IDs) into the existing map. */
    private void mergeOptionDistMap(Map<Long, Map<String, Integer>> target, List<Object[]> rows) {
        for (Object[] row : rows) {
            Long qId = ((Number) row[0]).longValue();
            String option = (String) row[1];
            int count = ((Number) row[2]).intValue();
            target.computeIfAbsent(qId, k -> new LinkedHashMap<>())
                    .merge(option, count, Integer::sum);
        }
    }

    private Map<Long, Map<String, Integer>> toMarksDistMap(List<Object[]> rows) {
        Map<Long, Map<String, Integer>> map = new HashMap<>();
        for (Object[] row : rows) {
            Long qId = (Long) row[0];
            String marks = row[1] != null ? String.valueOf(((Number) row[1]).doubleValue()) : "0";
            int count = ((Number) row[2]).intValue();
            map.computeIfAbsent(qId, k -> new LinkedHashMap<>()).put(marks, count);
        }
        return map;
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
