package isil.java_quiz_server.dto;

import java.util.List;

/**
 * DTO for Quiz that uses QuestionDTO (without correct answers).
 * Used when returning quizzes to students.
 */
public class QuizDTO {
    private Long id;
    private String title;
    private String username;
    private String category;
    private List<QuestionDTO> questions;

    public QuizDTO() {
    }

    public QuizDTO(Long id, String title, String username, String category, List<QuestionDTO> questions) {
        this.id = id;
        this.title = title;
        this.username = username;
        this.category = category;
        this.questions = questions;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<QuestionDTO> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionDTO> questions) {
        this.questions = questions;
    }
}
