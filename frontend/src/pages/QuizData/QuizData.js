import React, { useState, useEffect, useCallback, useRef } from "react";
import { quizAPI } from "../../api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiChevronLeft, FiCheck, FiHome, FiClock, FiChevronRight, FiAward, FiAlertTriangle, FiShuffle, FiGrid, FiX, FiCheckCircle, FiXCircle, FiMaximize } from "react-icons/fi";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import FullScreenGuard from "../../components/FullScreenGuard";

/* ─── Question Grid (side panel / mobile drawer) ─── */
const QuestionGrid = ({ questions, selectedAnswers, multiAnswers, textAnswers, currentIndex, onSelect, onClose }) => (
  <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-semibold text-[color:var(--text-primary)]">Questions</h4>
      {onClose && (
        <button onClick={onClose} className="p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"><FiX size={16} /></button>
      )}
    </div>
    <div className="grid grid-cols-5 gap-2">
      {questions.map((q, i) => {
        const type = q.questionType || 'MCQ';
        const answered = type === 'DESCRIPTIVE'
          ? !!textAnswers[q.id]?.trim()
          : type === 'MSQ'
            ? (multiAnswers[q.id] || []).length > 0
            : selectedAnswers[q.id] != null;
        const isCurrent = i === currentIndex;
        return (
          <button
            key={q.id}
            onClick={() => onSelect(i)}
            className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all border
              ${isCurrent
                ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)]'
                : answered
                  ? 'bg-[color:var(--success-light)] text-[color:var(--success)] border-[color:var(--success)]'
                  : 'bg-[color:var(--bg-primary)] text-[color:var(--text-muted)] border-[color:var(--border)] hover:border-[color:var(--accent-subtle)]'
              }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
    <div className="flex items-center gap-4 mt-3 text-[11px] text-[color:var(--text-muted)]">
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[color:var(--accent)]"></span>Current</span>
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[color:var(--success)]"></span>Answered</span>
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border border-[color:var(--border)]"></span>Unanswered</span>
    </div>
  </div>
);

/* ─── Answer Review Card (post-submission) ─── */
const ReviewCard = ({ answer, index, options }) => {
  const questionType = answer.questionType || 'MCQ';
  const isPending = answer.isCorrect == null;

  // For MCQ / TRUE_FALSE
  const selIdx = answer.selectedOption ? (options || []).indexOf(answer.selectedOption) : -1;
  const selectedLabel = selIdx >= 0 ? String.fromCharCode(65 + selIdx) : null;
  const corIdx = answer.correctOption ? (options || []).indexOf(answer.correctOption) : -1;
  const correctLabel = corIdx >= 0 ? String.fromCharCode(65 + corIdx) : null;

  const borderClass = isPending
    ? 'border-[color:var(--warning)]'
    : answer.isCorrect ? 'border-[color:var(--success)]' : 'border-[color:var(--danger)]';

  return (
    <div className={`bg-[color:var(--bg-card)] border rounded-xl p-5 ${borderClass}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block py-0.5 px-2.5 bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded-full text-[11px] font-semibold">Q{index + 1}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[color:var(--bg-hover)] text-[color:var(--text-muted)] font-medium uppercase">{questionType.replace('_', '/')}</span>
        </div>
        {isPending
          ? <span className="flex items-center gap-1 text-xs text-[color:var(--warning)] font-medium"><FiClock /> Pending Review</span>
          : answer.isCorrect
            ? <span className="flex items-center gap-1 text-xs text-[color:var(--success)] font-medium"><FiCheckCircle /> Correct</span>
            : <span className="flex items-center gap-1 text-xs text-[color:var(--danger)] font-medium"><FiXCircle /> Wrong</span>
        }
      </div>
      <p className="text-sm font-medium text-[color:var(--text-primary)] mb-3">{answer.questionText}</p>

      {/* DESCRIPTIVE */}
      {questionType === 'DESCRIPTIVE' && (
        <>
          {answer.textAnswer ? (
            <div className="py-2 px-3 bg-[color:var(--bg-primary)] rounded-lg mb-2 text-sm text-[color:var(--text-primary)] border border-[color:var(--border)]">
              <span className="text-[11px] text-[color:var(--text-muted)] block mb-1">Your answer:</span>
              {answer.textAnswer}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 bg-[color:var(--bg-hover)] rounded-lg mb-2 text-sm text-[color:var(--text-muted)]">
              <FiAlertTriangle className="shrink-0" /> Not answered
            </div>
          )}
          {answer.marksObtained != null && answer.totalMarks != null && (
            <div className="text-xs text-[color:var(--text-secondary)]">Marks: {answer.marksObtained}/{answer.totalMarks}</div>
          )}
        </>
      )}

      {/* MSQ */}
      {questionType === 'MSQ' && (
        <>
          {answer.selectedOptions?.length > 0 ? (
            <div className={`py-2 px-3 rounded-lg mb-2 text-sm ${!answer.isCorrect ? 'bg-[color:var(--danger-light)] text-[color:var(--danger)]' : 'bg-[color:var(--success-light)] text-[color:var(--success)]'}`}>
              <span className="block text-[11px] opacity-70 mb-1">Your selections:</span>
              {answer.selectedOptions.map((opt, oi) => <div key={oi}>• {opt}</div>)}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 bg-[color:var(--bg-hover)] rounded-lg mb-2 text-sm text-[color:var(--text-muted)]">
              <FiAlertTriangle className="shrink-0" /> Not answered
            </div>
          )}
          {answer.correctOptions?.length > 0 && (
            <div className="py-2 px-3 bg-[color:var(--success-light)] rounded-lg text-sm text-[color:var(--success)]">
              <span className="block text-[11px] opacity-70 mb-1">Correct answers:</span>
              {answer.correctOptions.map((opt, oi) => <div key={oi}>• {opt}</div>)}
            </div>
          )}
        </>
      )}

      {/* MCQ / TRUE_FALSE */}
      {(questionType === 'MCQ' || questionType === 'TRUE_FALSE') && (
        <>
          {!answer.isCorrect && answer.selectedOption && (
            <div className="flex items-center gap-2 py-2 px-3 bg-[color:var(--danger-light)] rounded-lg mb-2 text-sm text-[color:var(--danger)]">
              <FiXCircle className="shrink-0" />
              <span>Your answer: <strong>{selectedLabel && `${selectedLabel}. `}{answer.selectedOption}</strong></span>
            </div>
          )}
          {!answer.selectedOption && (
            <div className="flex items-center gap-2 py-2 px-3 bg-[color:var(--bg-hover)] rounded-lg mb-2 text-sm text-[color:var(--text-muted)]">
              <FiAlertTriangle className="shrink-0" /> Not answered
            </div>
          )}
          {answer.correctOption && (
            <div className="flex items-center gap-2 py-2 px-3 bg-[color:var(--success-light)] rounded-lg text-sm text-[color:var(--success)]">
              <FiCheckCircle className="shrink-0" />
              <span>Correct answer: <strong>{correctLabel && `${correctLabel}. `}{answer.correctOption}</strong></span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const QuizData = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});  // MCQ & TRUE_FALSE
  const [multiAnswers, setMultiAnswers] = useState({});        // MSQ
  const [textAnswers, setTextAnswers] = useState({});           // DESCRIPTIVE
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // all | correct | wrong
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Pagination & Timer
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Per-question time tracking (analytics)
  const [timePerQuestion, setTimePerQuestion] = useState({});
  const questionStartTimeRef = useRef(null);

  // Refs to avoid stale closures in timer auto-submit
  const selectedAnswersRef = useRef(selectedAnswers);
  const multiAnswersRef = useRef(multiAnswers);
  const textAnswersRef = useRef(textAnswers);
  const startTimeRef = useRef(startTime);
  const timePerQuestionRef = useRef(timePerQuestion);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  useEffect(() => { selectedAnswersRef.current = selectedAnswers; }, [selectedAnswers]);
  useEffect(() => { multiAnswersRef.current = multiAnswers; }, [multiAnswers]);
  useEffect(() => { textAnswersRef.current = textAnswers; }, [textAnswers]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { timePerQuestionRef.current = timePerQuestion; }, [timePerQuestion]);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);

  const checkAttemptAndFetch = useCallback(async () => {
    try {
      const attemptResponse = await quizAPI.hasAttempted(id);
      const hasAttempted = attemptResponse.data?.attempted || attemptResponse.data === true;

      if (hasAttempted) {
        setAlreadyAttempted(true);
        setLoading(false);
        return;
      }

      const response = await quizAPI.getQuizById(id);
      const quiz = response.data;
      setQuizDetails(quiz);

      const timeLimitMinutes = quiz.timeLimitMinutes || (quiz.questions?.length || 0) * 1;
      setTimeLeft(timeLimitMinutes * 60);
      setIsTimerRunning(true);
      setStartTime(Date.now());
      questionStartTimeRef.current = Date.now();
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

  useEffect(() => { checkAttemptAndFetch(); }, [checkAttemptAndFetch]);

  /** Record elapsed time for the current question and reset the per-question timer. */
  const recordQuestionTime = useCallback((questions, qIndex, tpqState) => {
    if (!questionStartTimeRef.current || !questions?.length) return tpqState;
    const qId = questions[qIndex]?.id;
    if (qId == null) return tpqState;
    const elapsed = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    questionStartTimeRef.current = Date.now();
    const updated = { ...tpqState, [qId]: (tpqState[qId] || 0) + elapsed };
    return updated;
  }, []);

  /** Navigate to a different question while tracking time. */
  const navigateToQuestion = useCallback((newIndex) => {
    if (!quizDetails?.questions) return;
    setTimePerQuestion(prev => {
      const updated = recordQuestionTime(quizDetails.questions, currentQuestionIndex, prev);
      timePerQuestionRef.current = updated;
      return updated;
    });
    setCurrentQuestionIndex(newIndex);
  }, [quizDetails, currentQuestionIndex, recordQuestionTime]);

  const handleSubmitQuiz = useCallback(async (isAutoSubmit = false) => {
    setIsTimerRunning(false);
    // Use refs for auto-submit (timer) to avoid stale closures
    const answers = isAutoSubmit ? selectedAnswersRef.current : selectedAnswers;
    const multiAns = isAutoSubmit ? multiAnswersRef.current : multiAnswers;
    const textAns = isAutoSubmit ? textAnswersRef.current : textAnswers;
    const start = isAutoSubmit ? startTimeRef.current : startTime;

    // Record time for the last question being viewed
    let finalTimePerQ = isAutoSubmit ? timePerQuestionRef.current : timePerQuestion;
    const qIdx = isAutoSubmit ? currentQuestionIndexRef.current : currentQuestionIndex;
    if (questionStartTimeRef.current && quizDetails?.questions?.length) {
      const qId = quizDetails.questions[qIdx]?.id;
      if (qId != null) {
        const elapsed = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        finalTimePerQ = { ...finalTimePerQ, [qId]: (finalTimePerQ[qId] || 0) + elapsed };
      }
    }

    const timeTakenSeconds = start ? Math.floor((Date.now() - start) / 1000) : 0;

    // Build separate answer maps matching backend SubmitQuizRequest
    const answerMap = {};       // MCQ & TRUE_FALSE: questionId → option text
    const multiAnsMap = {};     // MSQ: questionId → [option texts]
    const textAnsMap = {};      // DESCRIPTIVE: questionId → text

    // MCQ & TRUE_FALSE answers — send the option text directly
    Object.entries(answers).forEach(([questionId, selectedOption]) => {
      answerMap[questionId] = selectedOption;
    });

    // MSQ answers
    Object.entries(multiAns).forEach(([questionId, options]) => {
      if (options.length > 0) multiAnsMap[questionId] = options;
    });

    // DESCRIPTIVE answers
    Object.entries(textAns).forEach(([questionId, text]) => {
      if (text.trim()) textAnsMap[questionId] = text.trim();
    });

    try {
      const response = await quizAPI.submitQuiz(id, answerMap, timeTakenSeconds, multiAnsMap, textAnsMap, finalTimePerQ);
      setResultData(response.data);
      setShowResults(true);
      toast[isAutoSubmit ? 'info' : 'success'](isAutoSubmit ? "Time's up! Quiz submitted." : "Quiz completed! 🎉");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error(error.response?.data?.message || "Failed to submit quiz");
    }
  }, [id, selectedAnswers, multiAnswers, textAnswers, startTime, timePerQuestion, quizDetails, currentQuestionIndex]);

  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning && quizDetails) {
      handleSubmitQuiz(true); // auto-submit uses refs for latest state
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, quizDetails, handleSubmitQuiz]);

  // Warn before tab close / refresh during active quiz
  useEffect(() => {
    if (!isTimerRunning || showResults) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isTimerRunning, showResults]);

  const handleOptionClick = (questionId, selectedOption) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: selectedOption }));
  };

  const handleMultiOptionClick = (questionId, option) => {
    if (showResults) return;
    setMultiAnswers(prev => {
      const current = prev[questionId] || [];
      const exists = current.includes(option);
      return { ...prev, [questionId]: exists ? current.filter(o => o !== option) : [...current, option] };
    });
  };

  const handleTextAnswer = (questionId, text) => {
    if (showResults) return;
    setTextAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-[760px] mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="w-10 h-10 border-4 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[color:var(--text-muted)] text-[13px]">Loading quiz...</span>
        </div>
      </div>
    );
  }

  /* ─── Already Attempted ─── */
  if (alreadyAttempted) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-[760px] mx-auto max-sm:p-4">
        <PageHeader title="Quiz Already Completed" />
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-12 text-center max-sm:p-8">
          <div className="text-[56px] mb-3">✅</div>
          <h2 className="text-[22px] mb-2 text-[color:var(--text-primary)]">You've Already Taken This Quiz</h2>
          <p className="text-[color:var(--text-secondary)] mb-1.5">Each quiz can only be attempted once.</p>
          <p className="text-[color:var(--text-secondary)] mb-1.5">Check your profile to see your score.</p>
          <div className="flex justify-center gap-2.5 mt-5">
            <Link to="/home" className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-[color:var(--bg-hover)] text-[color:var(--text-primary)] border border-[color:var(--border)] rounded-lg no-underline font-medium text-[13px] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
              <FiHome /> Back to Home
            </Link>
            <Link to="/profile" className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-[color:var(--accent)] text-white rounded-lg no-underline font-medium text-[13px] hover:bg-[color:var(--accent-hover)]">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizDetails?.questions?.[currentQuestionIndex];
  const totalQuestions = quizDetails?.questions?.length || 0;
  const getOptions = (question) => question?.options || [];
  const answeredCount = Object.keys(selectedAnswers).length
    + Object.keys(multiAnswers).filter(k => multiAnswers[k].length > 0).length
    + Object.keys(textAnswers).filter(k => textAnswers[k]?.trim()).length;

  /* ─── Answer Review Screen ─── */
  if (showReview && resultData?.answers) {
    const filteredAnswers = resultData.answers.filter(a => {
      if (reviewFilter === 'all') return true;
      if (reviewFilter === 'correct') return a.isCorrect === true;
      if (reviewFilter === 'pending') return a.isCorrect == null;
      return a.isCorrect === false;
    });
    const correctCount = resultData.answers.filter(a => a.isCorrect === true).length;
    const wrongCount = resultData.answers.filter(a => a.isCorrect === false).length;
    const pendingCount = resultData.answers.filter(a => a.isCorrect == null).length;

    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-[760px] mx-auto max-sm:p-4">
        <div className="flex items-center justify-between mb-5 max-sm:flex-col max-sm:gap-3 max-sm:items-stretch">
          <PageHeader title="Answer Review" />
          <button
            onClick={() => setShowReview(false)}
            className="py-2 px-4 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-[13px] font-medium text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] transition-all"
          >
            ← Back to Results
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'all', label: `All (${resultData.answers.length})` },
            { key: 'correct', label: `Correct (${correctCount})` },
            { key: 'wrong', label: `Wrong (${wrongCount})` },
            ...(pendingCount > 0 ? [{ key: 'pending', label: `Pending (${pendingCount})` }] : []),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setReviewFilter(tab.key)}
              className={`py-2 px-4 rounded-lg text-xs font-medium transition-all border ${
                reviewFilter === tab.key
                  ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)]'
                  : 'bg-[color:var(--bg-card)] text-[color:var(--text-secondary)] border-[color:var(--border)] hover:border-[color:var(--accent-subtle)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Review Cards */}
        <div className="flex flex-col gap-3">
          {filteredAnswers.length === 0 ? (
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-8 text-center text-[color:var(--text-muted)] text-sm">
              No {reviewFilter} answers to show
            </div>
          ) : (
            filteredAnswers.map((answer, i) => {
              const originalIndex = resultData.answers.indexOf(answer);
              const question = quizDetails?.questions?.find(q => q.id === answer.questionId);
              return (
                <ReviewCard
                  key={answer.questionId}
                  answer={answer}
                  index={originalIndex}
                  options={question?.options}
                />
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <FullScreenGuard
      enabled={!!(quizDetails?.fullScreenRequired && !showResults && !alreadyAttempted)}
      onAutoSubmit={() => handleSubmitQuiz(true)}
    >
    <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-[900px] mx-auto max-sm:p-4">
      {/* Header with Title + Timer */}
      <div className="flex justify-between items-center mb-5 max-sm:flex-col max-sm:gap-3 max-sm:items-stretch">
        <PageHeader title={showResults ? "Quiz Results" : quizDetails?.title || "Quiz"} />
        {!showResults && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(prev => !prev)}
              className={`p-2.5 rounded-lg border transition-all ${showGrid ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)]' : 'bg-[color:var(--bg-card)] text-[color:var(--text-secondary)] border-[color:var(--border)] hover:border-[color:var(--accent)]'}`}
              title="Question navigator"
            >
              <FiGrid size={16} />
            </button>
            <div className={`flex items-center gap-1.5 py-2.5 px-[18px] bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-[15px] font-semibold text-[color:var(--text-primary)] tabular-nums ${timeLeft < 60 ? 'bg-[color:var(--danger-light)] !border-[color:var(--danger)] !text-[color:var(--danger)] animate-pulse' : ''}`}>
              <FiClock /> {formatTime(timeLeft)}
            </div>
          </div>
        )}
      </div>

      {/* Quiz Info Bar */}
      {!showResults && quizDetails && (
        <div className="flex gap-2.5 mb-5 flex-wrap">
          {quizDetails.shuffleQuestions && (
            <div className="flex items-center gap-[5px] py-1.5 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-xs text-[color:var(--text-secondary)]">
              <FiShuffle className="text-[color:var(--accent)]" /> Shuffled
            </div>
          )}
          {quizDetails.negativeMarking && (
            <div className="flex items-center gap-[5px] py-1.5 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-xs text-[color:var(--text-secondary)]">
              <FiAlertTriangle className="text-[color:var(--accent)]" /> Negative Marking
            </div>
          )}
          {quizDetails.passPercentage > 0 && (
            <div className="flex items-center gap-[5px] py-1.5 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-xs text-[color:var(--text-secondary)]">
              Pass: {quizDetails.passPercentage}%
            </div>
          )}
          {quizDetails.fullScreenRequired && (
            <div className="flex items-center gap-[5px] py-1.5 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-xs text-[color:var(--text-secondary)]">
              <FiMaximize className="text-[color:var(--accent)]" /> Full Screen
            </div>
          )}
          <div className="flex items-center gap-[5px] py-1.5 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-xs text-[color:var(--text-secondary)]">
            {answeredCount}/{totalQuestions} answered
          </div>
        </div>
      )}

      {/* Main content with optional grid sidebar */}
      {!showResults && (
        <div className="flex gap-5 items-start max-md:flex-col">
          {/* Question Area */}
          <div className="flex-1 min-w-0">
            {/* Progress Bar */}
            <div className="mb-5">
              <div className="text-[13px] text-[color:var(--text-secondary)] mb-2 font-medium">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
              <div className="w-full h-1 bg-[color:var(--bg-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[color:var(--accent)] rounded-full transition-[width] duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-[color:var(--bg-card)] border border-[color:var(--accent-subtle)] rounded-xl p-7 mb-5 max-sm:p-5">
                <div className="flex items-center gap-2 mb-3.5">
                  <span className="inline-block py-1 px-3 bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded-full text-[11px] font-semibold">Q{currentQuestionIndex + 1}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[color:var(--bg-hover)] text-[color:var(--text-muted)] font-medium uppercase">
                    {(currentQuestion.questionType || 'MCQ').replace('_', '/')}
                  </span>
                  {currentQuestion.marks && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[color:var(--bg-hover)] text-[color:var(--text-muted)] font-medium ml-auto">
                      {currentQuestion.marks} marks
                    </span>
                  )}
                </div>
                <h3 className="text-[17px] font-semibold text-[color:var(--text-primary)] leading-[1.5] mb-5 max-sm:text-[15px]">{currentQuestion.text}</h3>

                {/* MCQ options (single select) */}
                {(!currentQuestion.questionType || currentQuestion.questionType === 'MCQ') && (
                  <ul className="list-none flex flex-col gap-2.5">
                    {getOptions(currentQuestion).map((option, oIndex) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === option;
                      return (
                        <li
                          key={oIndex}
                          className={`flex items-center gap-3 py-3.5 px-4 bg-[color:var(--bg-primary)] border-[1.5px] rounded-lg cursor-pointer transition-all hover:border-[color:var(--accent-subtle)] hover:bg-[color:var(--accent-light)] ${isSelected ? 'border-[color:var(--accent)] bg-[color:var(--accent-light)]' : 'border-[color:var(--border)]'}`}
                          onClick={() => handleOptionClick(currentQuestion.id, option)}
                        >
                          <span className={`flex items-center justify-center w-[30px] h-[30px] rounded-full font-semibold text-[13px] shrink-0 transition-all ${isSelected ? 'bg-[color:var(--accent)] text-white' : 'bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]'}`}>
                            {String.fromCharCode(65 + oIndex)}
                          </span>
                          <span className="flex-1 text-sm text-[color:var(--text-primary)]">{option}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* TRUE_FALSE options */}
                {currentQuestion.questionType === 'TRUE_FALSE' && (
                  <div className="flex gap-3">
                    {['True', 'False'].map((opt) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`flex-1 py-4 px-6 rounded-lg border-[1.5px] text-[15px] font-semibold transition-all cursor-pointer ${isSelected ? 'border-[color:var(--accent)] bg-[color:var(--accent-light)] text-[color:var(--accent)]' : 'border-[color:var(--border)] bg-[color:var(--bg-primary)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent-subtle)]'}`}
                          onClick={() => handleOptionClick(currentQuestion.id, opt)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* MSQ options (multi select with checkboxes) */}
                {currentQuestion.questionType === 'MSQ' && (
                  <>
                    <p className="text-xs text-[color:var(--text-muted)] mb-3 italic">Select all correct answers</p>
                    <ul className="list-none flex flex-col gap-2.5">
                      {getOptions(currentQuestion).map((option, oIndex) => {
                        const selected = (multiAnswers[currentQuestion.id] || []).includes(option);
                        return (
                          <li
                            key={oIndex}
                            className={`flex items-center gap-3 py-3.5 px-4 bg-[color:var(--bg-primary)] border-[1.5px] rounded-lg cursor-pointer transition-all hover:border-[color:var(--accent-subtle)] hover:bg-[color:var(--accent-light)] ${selected ? 'border-[color:var(--accent)] bg-[color:var(--accent-light)]' : 'border-[color:var(--border)]'}`}
                            onClick={() => handleMultiOptionClick(currentQuestion.id, option)}
                          >
                            <span className={`flex items-center justify-center w-[30px] h-[30px] rounded font-semibold text-[13px] shrink-0 transition-all ${selected ? 'bg-[color:var(--accent)] text-white' : 'bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]'}`}>
                              {selected ? '✓' : String.fromCharCode(65 + oIndex)}
                            </span>
                            <span className="flex-1 text-sm text-[color:var(--text-primary)]">{option}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {/* DESCRIPTIVE text input */}
                {currentQuestion.questionType === 'DESCRIPTIVE' && (
                  <div>
                    <textarea
                      className="w-full min-h-[150px] p-4 bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded-lg text-sm text-[color:var(--text-primary)] resize-y focus:outline-none focus:border-[color:var(--accent)] transition-colors"
                      placeholder="Type your answer here..."
                      value={textAnswers[currentQuestion.id] || ''}
                      onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                    />
                    <p className="text-xs text-[color:var(--text-muted)] mt-2 text-right">
                      {(textAnswers[currentQuestion.id] || '').length} characters
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between gap-3 max-sm:flex-col">
              <button
                className="flex items-center gap-1.5 py-3 px-5 text-[13px] font-medium rounded-lg cursor-pointer transition-all bg-[color:var(--bg-card)] border border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed max-sm:justify-center"
                onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <FiChevronLeft /> Previous
              </button>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <button
                  className="flex items-center gap-1.5 py-3 px-5 text-[13px] font-medium rounded-lg cursor-pointer transition-all bg-[color:var(--accent)] border-none text-white hover:bg-[color:var(--accent-hover)] max-sm:justify-center"
                  onClick={() => setConfirmSubmit(true)}
                >
                  Finish Quiz <FiCheck />
                </button>
              ) : (
                <button
                  className="flex items-center gap-1.5 py-3 px-5 text-[13px] font-medium rounded-lg cursor-pointer transition-all bg-[color:var(--accent)] border-none text-white hover:bg-[color:var(--accent-hover)] max-sm:justify-center"
                  onClick={() => navigateToQuestion(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                >
                  Next <FiChevronRight />
                </button>
              )}
            </div>
          </div>

          {/* Question Grid Sidebar (desktop) */}
          {showGrid && quizDetails?.questions && (
            <div className="w-[220px] shrink-0 sticky top-6 max-md:w-full max-md:static">
              <QuestionGrid
                questions={quizDetails.questions}
                selectedAnswers={selectedAnswers}
                multiAnswers={multiAnswers}
                textAnswers={textAnswers}
                currentIndex={currentQuestionIndex}
                onSelect={(i) => navigateToQuestion(i)}
                onClose={() => setShowGrid(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Results Card */}
      {showResults && resultData && (
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-12 text-center max-sm:p-8">
          <div className="text-[56px] mb-3">{getScoreEmoji(resultData.score)}</div>
          <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-1.5">{getScoreMessage(resultData.score)}</h2>
          <p className="text-[color:var(--text-secondary)] mb-6 text-sm">You've completed the quiz!</p>

          <div className="text-[44px] font-bold text-[color:var(--accent)] mb-1.5 max-sm:text-4xl">
            {resultData.correctAnswers} / {resultData.totalQuestions}
          </div>
          <div className="text-sm text-[color:var(--text-secondary)] mb-5">
            Score: {resultData.score}%
            {resultData.marksObtained != null && resultData.totalMarks != null && (
              <> &bull; Marks: {resultData.marksObtained}/{resultData.totalMarks}</>
            )}
          </div>

          {resultData.passed != null && (
            <div className={`inline-block py-1.5 px-[18px] rounded-full font-semibold text-[13px] mb-7 ${resultData.passed ? 'bg-[color:var(--success-light)] text-[color:var(--success)]' : 'bg-[color:var(--danger-light)] text-[color:var(--danger)]'}`}>
              {resultData.passed ? '✓ Passed' : '✗ Did Not Pass'}
            </div>
          )}

          <div className="flex justify-center gap-2.5 flex-wrap">
            {resultData.answers?.length > 0 && (
              <button
                onClick={() => setShowReview(true)}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-[color:var(--bg-hover)] text-[color:var(--text-primary)] border border-[color:var(--border)] rounded-lg font-medium text-[13px] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] transition-all"
              >
                <FiCheckCircle /> Review Answers
              </button>
            )}
            <Link to={`/leaderboard/${id}`} className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-[color:var(--accent)] text-white rounded-lg no-underline font-medium text-[13px] hover:bg-[color:var(--accent-hover)]">
              <FiAward /> Leaderboard
            </Link>
            <Link to="/home" className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-[color:var(--bg-hover)] text-[color:var(--text-primary)] border border-[color:var(--border)] rounded-lg no-underline font-medium text-[13px] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
              <FiHome /> Back Home
            </Link>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        open={confirmSubmit}
        title="Submit Quiz?"
        message={`You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit?`}
        confirmText="Submit Quiz"
        cancelText="Continue Quiz"
        variant="primary"
        onConfirm={() => { setConfirmSubmit(false); handleSubmitQuiz(false); }}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
    </FullScreenGuard>
  );
};

export default QuizData;
