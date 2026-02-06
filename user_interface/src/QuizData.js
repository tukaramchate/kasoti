import React, { useState, useEffect } from "react";
import { quizAPI } from "./api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiChevronLeft, FiCheck, FiX, FiRefreshCw, FiHome, FiClock, FiChevronRight, FiAward } from "react-icons/fi";
import "./style/QuizData.css";
// Components
import PageHeader from "./components/PageHeader";
import LoadingSpinner from "./components/LoadingSpinner";

const QuizData = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // New State for Pagination & Timer
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    checkAttemptAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      // Time's up!
      handleSubmitQuiz();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning, timeLeft]);

  const checkAttemptAndFetch = async () => {
    try {
      // Check if user has already attempted this quiz
      const attemptResponse = await quizAPI.hasAttempted(id);
      if (attemptResponse.data === true) {
        setAlreadyAttempted(true);
        setLoading(false);
        return;
      }

      // Fetch quiz details if not attempted
      const response = await quizAPI.getQuizById(id);
      const quiz = response.data;
      setQuizDetails(quiz);

      // Initialize Timer: 1 minute per question
      const totalTime = (quiz.questions?.length || 0) * 60;
      setTimeLeft(totalTime);
      setIsTimerRunning(true);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (questionIndex, selectedOption, correctOption) => {
    if (showResults) return; // Prevent changing after submit

    const newAnswers = { ...selectedAnswers };
    const isCorrect = selectedOption === correctOption;

    newAnswers[questionIndex] = {
      selected: selectedOption,
      correct: correctOption,
      isCorrect: isCorrect,
    };
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    setIsTimerRunning(false);

    // Calculate Score
    const totalQuestions = quizDetails.questions.length;
    const correctCount = Object.values(selectedAnswers).filter((a) => a.isCorrect).length;
    setScore(correctCount);
    setShowResults(true);

    if (timeLeft === 0) {
      toast.info("Time's up! Quiz submitted.");
    } else {
      toast.success("Quiz completed! 🎉");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getOptionClass = (questionIndex, option) => {
    const answer = selectedAnswers[questionIndex];
    if (!answer) return "";

    // If showing results, verify logic
    if (showResults) {
      if (option === answer.correct) return "correct";
      if (answer.selected === option && !answer.isCorrect) return "incorrect";
    } else {
      // While taking quiz, just show selected state
      if (answer.selected === option) return "selected";
    }
    return "";
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setTimeLeft((quizDetails.questions?.length || 0) * 60);
    setIsTimerRunning(true);
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
        <LoadingSpinner text="Loading quiz..." />
      </div>
    );
  }

  // Show message if already attempted
  if (alreadyAttempted) {
    return (
      <div className="quizdata-container">
        <PageHeader title="Quiz Already Completed" />
        <div className="already-attempted-message">
          <div className="already-attempted-icon">✅</div>
          <h2>You've Already Taken This Quiz</h2>
          <p>Each quiz can only be attempted once.</p>
          <p>Check your profile to see your score.</p>
          <div className="already-attempted-actions">
            <Link to="/home" className="home-btn">
              <FiHome /> Back to Home
            </Link>
            <Link to="/profile" className="profile-btn">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizDetails?.questions?.[currentQuestionIndex];

  return (
    <div className="quizdata-container">
      <div className="quiz-header-row">
        <PageHeader title={showResults ? "Quiz Results" : "Quiz Challenge"} />
        {!showResults && (
          <div className={`timer-badge ${timeLeft < 60 ? 'urgent' : ''}`}>
            <FiClock /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Quiz Info Bar (Compact) */}
      {!showResults && (
        <div className="quiz-progress-bar-container">
          <div className="quiz-progress-text">
            Question {currentQuestionIndex + 1} of {quizDetails.questions.length}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / quizDetails.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Question Card */}
      {!showResults && currentQuestion && (
        <div className="question-card active-question">
          <span className="question-number">Q{currentQuestionIndex + 1}</span>
          <h3 className="question-text">{currentQuestion.text}</h3>

          <ul className="options-list">
            {currentQuestion.options?.map((option, oIndex) => (
              <li
                key={oIndex}
                className={`option-item ${getOptionClass(currentQuestionIndex, option)}`}
                onClick={() =>
                  handleOptionClick(currentQuestionIndex, option, currentQuestion.correctOption)
                }
              >
                <span className="option-label">
                  {String.fromCharCode(65 + oIndex)}
                </span>
                <span className="option-text">{option}</span>
                {/* Icons only show on results or immediate feedback if we wanted that, but standard quiz flow usually hides correctness until end */}
                {/* Keeping simple selection style for now per plan */}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Footer */}
      {!showResults && (
        <div className="quiz-footer">
          <button
            className="nav-btn prev-btn"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <FiChevronLeft /> Previous
          </button>

          {currentQuestionIndex === quizDetails.questions.length - 1 ? (
            <button
              className="nav-btn submit-btn"
              onClick={handleSubmitQuiz}
            >
              Finish Quiz <FiCheck />
            </button>
          ) : (
            <button
              className="nav-btn next-btn"
              onClick={() => setCurrentQuestionIndex(prev => Math.min(quizDetails.questions.length - 1, prev + 1))}
            >
              Next <FiChevronRight />
            </button>
          )}
        </div>
      )}

      {/* Score Card (Reused) */}
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
            <Link to={`/leaderboard/${id}`} className="retry-btn" style={{ color: '#fff', background: '#FFD700' }}>
              <FiAward /> Leaderboard
            </Link>
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

