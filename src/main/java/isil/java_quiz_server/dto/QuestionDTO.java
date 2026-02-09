package isil.java_quiz_server.dto;

import java.util.List;

/**
 * DTO for Question that excludes the correct answer.
 * Used when returning quizzes to students.
 */
public class QuestionDTO {
    private Long id;
    private String text;
    private List<String> options;
    // No correctOption field - students can't see the answer!

    public QuestionDTO() {
    }

    public QuestionDTO(Long id, String text, List<String> options) {
        this.id = id;
        this.text = text;
        this.options = options;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }
}
