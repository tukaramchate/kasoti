import React, { useState, useContext } from "react";
import { quizAPI } from "./api";
import { UserContext } from "./userContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import "./style/AddQuiz.css";

const AddQuiz = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const username = user?.user?.username || "";

  const [quiz, setQuiz] = useState({
    title: "",
    username: username,
    questions: [
      {
        text: "",
        options: ["", ""],
        correctOption: "",
      },
    ],
  });
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        { text: "", options: ["", ""], correctOption: "" },
      ],
    });
  };

  const removeQuestion = (qIndex) => {
    if (quiz.questions.length > 1) {
      const newQuestions = quiz.questions.filter((_, index) => index !== qIndex);
      setQuiz({ ...quiz, questions: newQuestions });
    }
  };

  const addOption = (qIndex) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].options.push("");
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const updateQuestion = (qIndex, field, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex][field] = value;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!quiz.title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    const hasEmptyQuestion = quiz.questions.some((q) => !q.text.trim());
    if (hasEmptyQuestion) {
      toast.error("Please fill in all question texts");
      return;
    }

    const hasEmptyCorrectAnswer = quiz.questions.some(
      (q) => !q.correctOption.trim()
    );
    if (hasEmptyCorrectAnswer) {
      toast.error("Please set correct answer for all questions");
      return;
    }

    setLoading(true);
    try {
      await quizAPI.createQuiz(quiz);
      toast.success("Quiz created successfully! 🎉");
      setTimeout(() => navigate("/home"), 1500);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error("Please login to create quizzes");
        navigate("/");
      } else {
        toast.error(error.response?.data?.message || "Failed to create quiz");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addquiz-container">
      {/* Header */}
      <header className="addquiz-header">
        <button onClick={() => navigate("/home")} className="back-button">
          <FiChevronLeft />
        </button>
        <h1 className="page-title">Create New Quiz</h1>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="form-container">
        {/* Quiz Details Section */}
        <div className="form-section">
          <h2 className="section-title">📝 Quiz Details</h2>
          <div className="form-group">
            <label className="form-label">Quiz Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter an engaging quiz title..."
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            />
          </div>
        </div>

        {/* Questions Section */}
        <div className="form-section">
          <h2 className="section-title">❓ Questions</h2>

          {quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {qIndex + 1}</span>
                {quiz.questions.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Question Text</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your question..."
                  value={question.text}
                  onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                />
              </div>

              <div className="options-container">
                <label className="form-label">Answer Options</label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-row">
                    <span className="option-label">
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <input
                      type="text"
                      className="option-input"
                      placeholder={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="add-option-btn"
                  onClick={() => addOption(qIndex)}
                >
                  <FiPlus /> Add Option
                </button>
              </div>

              <div className="correct-answer-section">
                <div className="form-group">
                  <label className="form-label">Correct Answer</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter the correct answer..."
                    value={question.correctOption}
                    onChange={(e) =>
                      updateQuestion(qIndex, "correctOption", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="add-question-btn" onClick={addQuestion}>
            <FiPlus /> Add Another Question
          </button>
        </div>

        {/* Submit Section */}
        <div className="submit-section">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/home")}
          >
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </form>

      <ToastContainer />
    </div>
  );
};

export default AddQuiz;
