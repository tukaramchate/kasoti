package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.AnswerDTO;
import com.tukaram.kasoti.exception.BadRequestException;
import com.tukaram.kasoti.exception.ForbiddenException;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.*;
import com.tukaram.kasoti.repository.AnswerRepository;
import com.tukaram.kasoti.repository.QuizAttemptRepository;
import com.tukaram.kasoti.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for teachers to manually evaluate DESCRIPTIVE answers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EvaluationService {

    private final AnswerRepository answerRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    /**
     * Evaluate a single DESCRIPTIVE answer.
     * Only the quiz creator or an admin can evaluate.
     *
     * @param answerId  the answer to evaluate
     * @param marks     marks to award (0 to question max)
     * @param comment   optional teacher feedback
     * @param principal the authenticated teacher/admin
     * @return updated AnswerDTO
     */
    @Transactional
    public AnswerDTO evaluateAnswer(Long answerId, Integer marks, String comment, UserPrincipal principal) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer", "id", answerId));

        // Validate it's a DESCRIPTIVE answer
        QuestionType type = answer.getQuestion().getQuestionType();
        if (type != QuestionType.DESCRIPTIVE) {
            throw new BadRequestException("Only DESCRIPTIVE answers can be manually evaluated");
        }

        // Validate ownership
        Quiz quiz = answer.getAttempt().getQuiz();
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only evaluate answers for your own quizzes");
        }

        // Validate marks range
        int maxMarks = answer.getQuestion().getMarks() != null ? answer.getQuestion().getMarks() : 1;
        if (marks < 0 || marks > maxMarks) {
            throw new BadRequestException(
                    "Marks must be between 0 and " + maxMarks + " for this question");
        }

        // Update the answer
        int previousMarks = answer.getMarksObtained() != null ? answer.getMarksObtained() : 0;
        answer.setMarksObtained(marks);
        answer.setIsCorrect(marks > 0);
        answer.setEvaluationStatus(EvaluationStatus.EVALUATED);
        answer.setEvaluationComment(comment);
        answerRepository.save(answer);

        // Update the attempt's total marks obtained and score
        QuizAttempt attempt = answer.getAttempt();
        int marksDelta = marks - previousMarks;
        int newMarksObtained = (attempt.getMarksObtained() != null ? attempt.getMarksObtained() : 0) + marksDelta;
        newMarksObtained = Math.max(0, newMarksObtained);
        attempt.setMarksObtained(newMarksObtained);

        int totalMarks = attempt.getTotalMarks() != null ? attempt.getTotalMarks() : 1;
        int newScore = totalMarks > 0 ? (int) Math.round((newMarksObtained * 100.0) / totalMarks) : 0;
        attempt.setScore(newScore);

        // If marks awarded > 0 and this was previously not counted as correct, increment correct count
        if (marks > 0 && previousMarks == 0) {
            attempt.setCorrectAnswers(
                    (attempt.getCorrectAnswers() != null ? attempt.getCorrectAnswers() : 0) + 1);
        } else if (marks == 0 && previousMarks > 0) {
            attempt.setCorrectAnswers(
                    Math.max(0, (attempt.getCorrectAnswers() != null ? attempt.getCorrectAnswers() : 0) - 1));
        }

        // Check if all descriptive answers for this attempt are now evaluated
        long pendingCount = attempt.getAnswers().stream()
                .filter(a -> a.getEvaluationStatus() == EvaluationStatus.PENDING)
                .count();

        quizAttemptRepository.save(attempt);

        log.info("Evaluated answer {} for attempt {}: {} / {} marks (pending: {})",
                answerId, attempt.getId(), marks, maxMarks, pendingCount);

        return convertToDTO(answer);
    }

    /**
     * Get all pending DESCRIPTIVE answers for a quiz (for teacher evaluation view).
     */
    public List<AnswerDTO> getPendingAnswers(Long quizId, UserPrincipal principal) {
        // Validate ownership inline — no Quiz entity needed, we filter at DB level
        List<Answer> pending = answerRepository.findPendingDescriptiveByQuizId(quizId);

        if (!pending.isEmpty()) {
            Quiz quiz = pending.get(0).getAttempt().getQuiz();
            if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
                throw new ForbiddenException("You can only view pending answers for your own quizzes");
            }
        }

        return pending.stream().map(this::convertToDTO).toList();
    }

    private AnswerDTO convertToDTO(Answer a) {
        Question q = a.getQuestion();
        QuestionType qType = q.getQuestionType() != null ? q.getQuestionType() : QuestionType.MCQ;

        return AnswerDTO.builder()
                .id(a.getId())
                .questionId(q.getId())
                .questionText(q.getText())
                .questionType(qType)
                .selectedOption(a.getSelectedOption())
                .correctOption(q.getCorrectOption())
                .selectedOptions(a.getSelectedOptions())
                .correctOptions(q.getCorrectOptions())
                .textAnswer(a.getTextAnswer())
                .modelAnswer(q.getModelAnswer())
                .isCorrect(a.getIsCorrect())
                .marksObtained(a.getMarksObtained())
                .maxMarks(q.getMarks() != null ? q.getMarks() : 1)
                .evaluationStatus(a.getEvaluationStatus())
                .evaluationComment(a.getEvaluationComment())
                .build();
    }
}
