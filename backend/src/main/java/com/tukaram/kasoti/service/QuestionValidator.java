package com.tukaram.kasoti.service;

import com.tukaram.kasoti.exception.BadRequestException;
import com.tukaram.kasoti.model.Question;
import com.tukaram.kasoti.model.QuestionType;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Validates question structure based on question type.
 * Rules enforced:
 * <ul>
 *   <li><b>MCQ</b> — 2–10 options, exactly 1 correctOption, correctOption ∈ options.</li>
 *   <li><b>MSQ</b> — 2–10 options, 1+ correctOptions, all correctOptions ∈ options, no duplicates.</li>
 *   <li><b>TRUE_FALSE</b> — exactly 2 options ("True", "False"), 1 correctOption ∈ {"True","False"}.</li>
 *   <li><b>DESCRIPTIVE</b> — no options, no correctOption/correctOptions, optional modelAnswer.</li>
 * </ul>
 */
@Component
public class QuestionValidator {

    private static final Set<String> TRUE_FALSE_OPTIONS = Set.of("True", "False");
    private static final int MIN_OPTIONS = 2;
    private static final int MAX_OPTIONS = 10;

    /**
     * Validate a question according to its type.
     *
     * @param question the question to validate
     * @param index    0-based index for user-friendly error messages
     */
    public void validate(Question question, int index) {
        QuestionType type = question.getQuestionType();
        if (type == null) {
            type = QuestionType.MCQ; // backward compat default
        }

        String prefix = "Question " + (index + 1) + " (" + type + "): ";

        switch (type) {
            case MCQ -> validateMCQ(question, prefix);
            case MSQ -> validateMSQ(question, prefix);
            case TRUE_FALSE -> validateTrueFalse(question, prefix);
            case DESCRIPTIVE -> validateDescriptive(question, prefix);
        }
    }

    // ===================== MCQ =====================

    private void validateMCQ(Question q, String prefix) {
        requireOptions(q, prefix);
        requireOptionCount(q, prefix, MIN_OPTIONS, MAX_OPTIONS);
        requireNoDuplicateOptions(q, prefix);

        if (q.getCorrectOption() == null || q.getCorrectOption().isBlank()) {
            throw new BadRequestException(prefix + "correctOption is required");
        }
        if (!q.getOptions().contains(q.getCorrectOption())) {
            throw new BadRequestException(
                    prefix + "correctOption '" + q.getCorrectOption() + "' must be one of the provided options");
        }
    }

    // ===================== MSQ =====================

    private void validateMSQ(Question q, String prefix) {
        requireOptions(q, prefix);
        requireOptionCount(q, prefix, MIN_OPTIONS, MAX_OPTIONS);
        requireNoDuplicateOptions(q, prefix);

        List<String> correct = q.getCorrectOptions();
        if (correct == null || correct.isEmpty()) {
            throw new BadRequestException(prefix + "correctOptions list is required (at least 1)");
        }
        if (new HashSet<>(correct).size() != correct.size()) {
            throw new BadRequestException(prefix + "correctOptions must not contain duplicates");
        }
        for (String opt : correct) {
            if (!q.getOptions().contains(opt)) {
                throw new BadRequestException(
                        prefix + "correctOption '" + opt + "' must be one of the provided options");
            }
        }
        if (correct.size() == q.getOptions().size()) {
            throw new BadRequestException(
                    prefix + "correctOptions cannot include all options — use MCQ if there's only one correct answer");
        }
    }

    // ===================== TRUE_FALSE =====================

    private void validateTrueFalse(Question q, String prefix) {
        List<String> opts = q.getOptions();
        if (opts == null || opts.size() != 2) {
            throw new BadRequestException(prefix + "must have exactly 2 options: True, False");
        }
        Set<String> optSet = new HashSet<>(opts);
        if (!optSet.equals(TRUE_FALSE_OPTIONS)) {
            throw new BadRequestException(prefix + "options must be exactly 'True' and 'False'");
        }
        if (q.getCorrectOption() == null || !TRUE_FALSE_OPTIONS.contains(q.getCorrectOption())) {
            throw new BadRequestException(prefix + "correctOption must be 'True' or 'False'");
        }
    }

    // ===================== DESCRIPTIVE =====================

    private void validateDescriptive(Question q, String prefix) {
        if (q.getOptions() != null && !q.getOptions().isEmpty()) {
            throw new BadRequestException(prefix + "DESCRIPTIVE questions must not have options");
        }
        if (q.getCorrectOption() != null && !q.getCorrectOption().isBlank()) {
            throw new BadRequestException(prefix + "DESCRIPTIVE questions must not have correctOption");
        }
        if (q.getCorrectOptions() != null && !q.getCorrectOptions().isEmpty()) {
            throw new BadRequestException(prefix + "DESCRIPTIVE questions must not have correctOptions");
        }
        // modelAnswer is optional — it's a guide for teachers
    }

    // ===================== Shared helpers =====================

    private void requireOptions(Question q, String prefix) {
        if (q.getOptions() == null || q.getOptions().isEmpty()) {
            throw new BadRequestException(prefix + "options are required");
        }
    }

    private void requireOptionCount(Question q, String prefix, int min, int max) {
        int size = q.getOptions().size();
        if (size < min || size > max) {
            throw new BadRequestException(
                    prefix + "must have between " + min + " and " + max + " options (found " + size + ")");
        }
    }

    private void requireNoDuplicateOptions(Question q, String prefix) {
        List<String> opts = q.getOptions();
        if (new HashSet<>(opts).size() != opts.size()) {
            throw new BadRequestException(prefix + "options must not contain duplicates");
        }
    }
}
