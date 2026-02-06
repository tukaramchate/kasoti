import React, { useState, useEffect } from "react";
import { quizAPI } from "./api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiChevronLeft, FiCheck, FiX, FiRefreshCw, FiHome } from "react-icons/fi";
import "./style/QuizData.css";

const QuizData = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  const fetchQuizDetails = async () => {
    try {
      const response = await quizAPI.getQuizById(id);
      setQuizDetails(response.data);
    } catch (error) {
      console.error("Error fetching quiz details:", error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (questionIndex, selectedOption, correctOption) => {
    if (showResults || selectedAnswers[questionIndex]) return;

    const newAnswers = { ...selectedAnswers };
    newAnswers[questionIndex] = {
      selected: selectedOption,
      correct: correctOption,
      isCorrect: selectedOption === correctOption,
    };
    setSelectedAnswers(newAnswers);

    // Show feedback
    if (selectedOption === correctOption) {
      toast.success("Correct! 🎉", { autoClose: 1000 });
    } else {
      toast.error("Incorrect!", { autoClose: 1000 });
    }

    // Check if all questions answered
    if (Object.keys(newAnswers).length === quizDetails.questions.length) {
      setTimeout(() => {
        const correctCount = Object.values(newAnswers).filter((a) => a.isCorrect).length;
        setScore(correctCount);
        setShowResults(true);
      }, 1500);
    }
  };

  const getOptionClass = (questionIndex, option) => {
    const answer = selectedAnswers[questionIndex];
    if (!answer) return "";

    if (option === answer.correct && answer.selected) return "correct";
    if (option === answer.selected && !answer.isCorrect) return "incorrect";
    return "";
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const getScoreEmoji = () => {
    const percentage = (score / quizDetails.questions.length) * 100;
    if (percentage >= 80) return "🏆";
    if (percentage >= 60) return "⭐";
    return "💪";
  };

  const getScoreMessage = () => {
    const percentage = (score / quizDetails.questions.length) * 100;
    if (percentage >= 80) return "Excellent!";
    if (percentage >= 60) return "Good Job!";
    return "Keep Practicing!";
  };

  if (loading) {
    return (
      <div className="quizdata-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quizdata-container">
      {/* Header */}
      <header className="quizdata-header">
        <button onClick={() => navigate("/home")} className="back-button">
          <FiChevronLeft />
        </button>
        <h1 className="page-title">Quiz Challenge</h1>
      </header>

      {/* Quiz Info Card */}
      <div className="quiz-info-card">
        <div className="quiz-icon">📝</div>
        <h2 className="quiz-title">{quizDetails?.title}</h2>
        <div className="quiz-meta">
          <span className="quiz-meta-item">
            ❓ {quizDetails?.questions?.length || 0} Questions
          </span>
          <span className="quiz-meta-item">👤 By {quizDetails?.username}</span>
        </div>

        <div className="progress-container">
          <div className="progress-label">
            <span>Progress</span>
            <span>
              {Object.keys(selectedAnswers).length} / {quizDetails?.questions?.length}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(Object.keys(selectedAnswers).length /
                    (quizDetails?.questions?.length || 1)) *
                  100
                  }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Questions */}
      {!showResults && (
        <div className="questions-container">
          {quizDetails?.questions?.map((question, qIndex) => (
            <div key={question.id || qIndex} className="question-card">
              <span className="question-number">Question {qIndex + 1}</span>
              <h3 className="question-text">{question.text}</h3>

              <ul className="options-list">
                {question.options?.map((option, oIndex) => (
                  <li
                    key={oIndex}
                    className={`option-item ${getOptionClass(qIndex, option)}`}
                    onClick={() =>
                      handleOptionClick(qIndex, option, question.correctOption)
                    }
                  >
                    <span className="option-label">
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <span className="option-text">{option}</span>
                    {getOptionClass(qIndex, option) === "correct" && (
                      <FiCheck className="option-icon" />
                    )}
                    {getOptionClass(qIndex, option) === "incorrect" && (
                      <FiX className="option-icon" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Score Card */}
      {showResults && (
        <div className="score-card">
          <div className="score-emoji">{getScoreEmoji()}</div>
          <h2 className="score-title">{getScoreMessage()}</h2>
          <p className="score-subtitle">You've completed the quiz!</p>
          <div className="score-value">
            {score} / {quizDetails?.questions?.length}
          </div>
          <div className="score-actions">
            <button className="retry-btn" onClick={resetQuiz}>
              <FiRefreshCw /> Try Again
            </button>
            <Link to="/home" className="home-btn">
              <FiHome /> Back Home
            </Link>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default QuizData;
