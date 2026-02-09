package isil.java_quiz_server.dto;

/**
 * DTO for individual answer in attempt review.
 */
public class AnswerDTO {
    private Long questionId;
    private String questionText;
    private String selectedOption;
    private String correctOption;
    private Boolean isCorrect;
    private Integer marksObtained;
    private Integer maxMarks;

    public AnswerDTO() {
    }

    public AnswerDTO(Long questionId, String questionText, String selectedOption,
            String correctOption, Boolean isCorrect, Integer marksObtained, Integer maxMarks) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.selectedOption = selectedOption;
        this.correctOption = correctOption;
        this.isCorrect = isCorrect;
        this.marksObtained = marksObtained;
        this.maxMarks = maxMarks;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getSelectedOption() {
        return selectedOption;
    }

    public void setSelectedOption(String selectedOption) {
        this.selectedOption = selectedOption;
    }

    public String getCorrectOption() {
        return correctOption;
    }

    public void setCorrectOption(String correctOption) {
        this.correctOption = correctOption;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }

    public Integer getMarksObtained() {
        return marksObtained;
    }

    public void setMarksObtained(Integer marksObtained) {
        this.marksObtained = marksObtained;
    }

    public Integer getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Integer maxMarks) {
        this.maxMarks = maxMarks;
    }
}
