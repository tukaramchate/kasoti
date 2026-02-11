import React, { useState, useEffect, useCallback } from "react";
import { quizAPI } from "../../api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiChevronLeft, FiCheck, FiHome, FiClock, FiChevronRight, FiAward, FiAlertTriangle, FiShuffle } from "react-icons/fi";
import "./QuizData.css";
import PageHeader from "../../components/PageHeader";

const QuizData = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // Pagination & Timer
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const checkAttemptAndFetch = useCallback(async () => {
    try {
      // Check if user has already attempted this quiz
      const attemptResponse = await quizAPI.hasAttempted(id);
      const hasAttempted = attemptResponse.data?.attempted || attemptResponse.data === true;

      if (hasAttempted) {
        setAlreadyAttempted(true);
        setLoading(false);
        return;
      }

      // Fetch quiz details if not attempted
      const response = await quizAPI.getQuizById(id);
      const quiz = response.data;
      setQuizDetails(quiz);

      // Initialize Timer: Use quiz setting or 1 min per question
      const timeLimitMinutes = quiz.timeLimitMinutes || (quiz.questions?.length || 0) * 1;
      setTimeLeft(timeLimitMinutes * 60);
      setIsTimerRunning(true);
      setStartTime(Date.now());

    } catch (error) {
      console.error("Error:", error);
      if (error.response?.status === 403) {
        toast.error(error.response.data?.message || "You cannot access this quiz");
        navigate('/home');
      } else {
        toast.error("Failed to load quiz");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    checkAttemptAndFetch();
  }, [checkAttemptAndFetch]);

  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning && quizDetails) {
      handleSubmitQuiz();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning, timeLeft]);

  const handleOptionClick = (questionId, selectedOption) => {
    if (showResults) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const handleSubmitQuiz = async () => {
    setIsTimerRunning(false);

    // Calculate time taken in seconds
    const timeTakenSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    // Format answers for backend: { questionId: "A"|"B"|"C"|"D" }
    const formattedAnswers = {};
    Object.entries(selectedAnswers).forEach(([questionId, selectedOption]) => {
      const question = quizDetails.questions.find(q => q.id.toString() === questionId.toString());
      if (question) {
        const options = question.options || [];
        const index = options.indexOf(selectedOption);
        if (index !== -1) {
          formattedAnswers[questionId] = String.fromCharCode(65 + index);
        }
      }
    });

    try {
      const response = await quizAPI.submitQuiz(id, formattedAnswers, timeTakenSeconds);
      setResultData(response.data);
      setShowResults(true);

      if (timeLeft === 0) {
        toast.info("Time's up! Quiz submitted.");
      } else {
        toast.success("Quiz completed! 🎉");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error(error.response?.data?.message || "Failed to submit quiz");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getOptionClass = (questionId, option) => {
    const selected = selectedAnswers[questionId];
    if (selected === option) return "selected";
    return "";
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return "🏆";
    if (score >= 60) return "⭐";
    if (score >= 40) return "👍";
    return "💪";
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return "Excellent!";
    if (score >= 60) return "Good Job!";
    if (score >= 40) return "Not Bad!";
    return "Keep Practicing!";
  };

  if (loading) {
    return (
      <div className="quizdata-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading quiz...</span>
        </div>
      </div>
    );
  }

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
  const totalQuestions = quizDetails?.questions?.length || 0;

  // Get options array for current question
  const getOptions = (question) => {
    if (!question) return [];
    return question.options || [];
  };

  return (
    <div className="quizdata-container">
      <div className="quiz-header-row">
        <PageHeader title={showResults ? "Quiz Results" : quizDetails?.title || "Quiz"} />
        {!showResults && (
          <div className={`timer-badge ${timeLeft < 60 ? 'urgent' : ''}`}>
            <FiClock /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Quiz Info Bar */}
      {!showResults && quizDetails && (
        <div className="quiz-info-bar">
          {quizDetails.shuffleQuestions && (
            <div className="quiz-info-item">
              <FiShuffle /> Shuffled
            </div>
          )}
          {quizDetails.negativeMarking && (
            <div className="quiz-info-item">
              <FiAlertTriangle /> Negative Marking
            </div>
          )}
          {quizDetails.passPercentage && (
            <div className="quiz-info-item">
              Pass: {quizDetails.passPercentage}%
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {!showResults && (
        <div className="quiz-progress-bar-container">
          <div className="quiz-progress-text">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
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
            {getOptions(currentQuestion).map((option, oIndex) => (
              <li
                key={oIndex}
                className={`option-item ${getOptionClass(currentQuestion.id, option)}`}
                onClick={() => handleOptionClick(currentQuestion.id, option)}
              >
                <span className="option-label">
                  {String.fromCharCode(65 + oIndex)}
                </span>
                <span className="option-text">{option}</span>
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

          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              className="nav-btn submit-btn"
              onClick={handleSubmitQuiz}
            >
              Finish Quiz <FiCheck />
            </button>
          ) : (
            <button
              className="nav-btn next-btn"
              onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
            >
              Next <FiChevronRight />
            </button>
          )}
        </div>
      )}

      {/* Results Card */}
      {showResults && resultData && (
        <div className="score-card">
          <div className="score-emoji">{getScoreEmoji(resultData.score)}</div>
          <h2 className="score-title">{getScoreMessage(resultData.score)}</h2>
          <p className="score-subtitle">You've completed the quiz!</p>

          <div className="score-value">
            {resultData.correctAnswers} / {resultData.totalQuestions}
          </div>
          <div className="score-percentage">
            Score: {resultData.score}%
            {resultData.marksObtained != null && resultData.totalMarks != null && (
              <> &bull; Marks: {resultData.marksObtained}/{resultData.totalMarks}</>
            )}
          </div>

          {resultData.passed != null && (
            <div className={`pass-badge ${resultData.passed ? 'passed' : 'failed'}`}>
              {resultData.passed ? '✓ Passed' : '✗ Did Not Pass'}
            </div>
          )}

          <div className="score-actions">
            <Link to={`/leaderboard/${id}`} className="retry-btn">
              <FiAward /> Leaderboard
            </Link>
            <Link to="/home" className="home-btn">
              <FiHome /> Back Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizData;
