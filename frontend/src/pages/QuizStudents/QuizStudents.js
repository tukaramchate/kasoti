import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizAPI } from "../../api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FiUsers, FiFilter, FiDownload, FiEdit3, FiSend, FiClock, FiCheckCircle } from "react-icons/fi";

const SORT_OPTIONS = [
    { value: 'score_desc', label: 'Highest Score' },
    { value: 'score_asc', label: 'Lowest Score' },
    { value: 'time_asc', label: 'Fastest Time' },
    { value: 'attemptedAt_desc', label: 'Most Recent' },
];

const QuizStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [quizInfo, setQuizInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('score_desc');
    const [activeTab, setActiveTab] = useState('students');
    const [pendingEvals, setPendingEvals] = useState([]);
    const [evalLoading, setEvalLoading] = useState(false);
    const [evalForms, setEvalForms] = useState({}); // { answerId: { marks: '', comment: '' } }

    const fetchData = useCallback(async () => {
        try {
            const [quizRes, studentsRes] = await Promise.all([
                quizAPI.getQuizById(id),
                quizAPI.getQuizStudents(id, sortBy)
            ]);

            setQuizInfo(quizRes.data);
            setStudents(studentsRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            if (error.response?.status === 403) {
                toast.error("You don't have access to view this");
                navigate('/home');
            }
        } finally {
            setLoading(false);
        }
    }, [id, sortBy, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchPendingEvals = useCallback(async () => {
        setEvalLoading(true);
        try {
            const res = await quizAPI.getPendingEvaluations(id);
            setPendingEvals(res.data || []);
        } catch (error) {
            console.error("Error fetching pending evaluations:", error);
        } finally {
            setEvalLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (activeTab === 'evaluations') fetchPendingEvals();
    }, [activeTab, fetchPendingEvals]);

    const handleEvalFormChange = (answerId, field, value) => {
        setEvalForms(prev => ({
            ...prev,
            [answerId]: { ...prev[answerId], [field]: value }
        }));
    };

    const handleEvaluateAnswer = async (answerId, maxMarks) => {
        const form = evalForms[answerId] || {};
        const marks = parseInt(form.marks);
        if (isNaN(marks) || marks < 0 || marks > maxMarks) {
            toast.error(`Marks must be between 0 and ${maxMarks}`);
            return;
        }
        try {
            await quizAPI.evaluateAnswer(answerId, marks, form.comment || '');
            toast.success('Answer evaluated successfully');
            setPendingEvals(prev => prev.filter(e => e.id !== answerId));
            setEvalForms(prev => { const n = { ...prev }; delete n[answerId]; return n; });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to evaluate answer');
        }
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setLoading(true);
    };

    const handleExportJSON = async () => {
        try {
            const res = await quizAPI.exportQuiz(id);
            const blob = res.data instanceof Blob ? res.data : new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz-${id}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Quiz exported as JSON');
        } catch { toast.error('Failed to export quiz'); }
    };

    const handleExportCSV = async () => {
        try {
            const res = await quizAPI.exportAttempts(id);
            const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz-${id}-attempts.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Attempts exported as CSV');
        } catch { toast.error('Failed to export attempts'); }
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "-";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const getScoreColor = (score, passPercentage) => {
        if (passPercentage && score < passPercentage) return 'text-[color:var(--danger)]';
        if (score >= 80) return 'text-[color:var(--success)]';
        if (score >= 50) return 'text-[color:var(--warning)]';
        return 'text-[color:var(--text-secondary)]';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-sm:p-4">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-sm:p-4">
            <div className="max-w-[760px] mx-auto">
                <PageHeader title="Student Attempts" />

                <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl overflow-hidden">
                    <div className="p-7 text-center border-b border-[color:var(--border)] max-sm:p-5">
                        <h1 className="flex items-center justify-center gap-2.5 text-2xl font-bold text-[color:var(--text-primary)] mb-1.5 max-sm:text-xl">
                            <FiUsers /> Student Attempts
                        </h1>
                        <p className="text-[color:var(--text-secondary)] text-sm">
                            {quizInfo?.title} • {students.length} attempts
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[color:var(--border)]">
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex-1 py-3 px-4 text-sm font-medium text-center transition-all ${activeTab === 'students' ? 'text-[color:var(--accent)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'}`}
                        >
                            <FiUsers className="inline mr-1.5" /> Students
                        </button>
                        <button
                            onClick={() => setActiveTab('evaluations')}
                            className={`flex-1 py-3 px-4 text-sm font-medium text-center transition-all ${activeTab === 'evaluations' ? 'text-[color:var(--accent)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'}`}
                        >
                            <FiEdit3 className="inline mr-1.5" /> Pending Evaluations
                            {pendingEvals.length > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[color:var(--accent)] text-white text-[10px] font-bold">{pendingEvals.length}</span>
                            )}
                        </button>
                    </div>

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                    <>
                    {/* Sort Controls */}
                    <div className="py-4 px-6 border-b border-[color:var(--border)] flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-3 flex-1">
                            <FiFilter className="text-[color:var(--text-muted)]" />
                            <span className="text-sm text-[color:var(--text-secondary)]">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="py-2 px-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border)] rounded-lg font-inherit text-sm text-[color:var(--text-primary)] cursor-pointer"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="flex items-center gap-1.5 py-2 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-[13px] font-medium text-[color:var(--text-secondary)] cursor-pointer transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                                onClick={handleExportJSON}
                                title="Export quiz as JSON"
                            >
                                <FiDownload /> Quiz JSON
                            </button>
                            <button
                                className="flex items-center gap-1.5 py-2 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-[13px] font-medium text-[color:var(--text-secondary)] cursor-pointer transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                                onClick={handleExportCSV}
                                title="Export attempts as CSV"
                            >
                                <FiDownload /> Attempts CSV
                            </button>
                        </div>
                    </div>

                    <div>
                        {students.length === 0 ? (
                            <div className="p-12 text-center max-sm:p-8">
                                <FiUsers className="text-[40px] text-[color:var(--text-muted)] mb-3" />
                                <h3 className="text-base text-[color:var(--text-primary)] mb-1.5">No attempts yet</h3>
                                <p className="text-[color:var(--text-secondary)] text-[13px]">Students will appear here once they take the quiz.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">#</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Student</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Score</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Marks</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Time</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)] max-sm:hidden">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((attempt, index) => {
                                        const username = attempt.username || attempt.user?.username;

                                        return (
                                            <tr key={attempt.id || index} className="transition-all hover:bg-[color:var(--bg-hover)]">
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-sm w-14">
                                                    <span className="pl-2.5">{index + 1}</span>
                                                </td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-sm">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 bg-[color:var(--accent)] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
                                                            {username ? username.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                        <span>{username || "Unknown"}</span>
                                                    </div>
                                                </td>
                                                <td className={`py-3.5 px-4 border-b border-[color:var(--border-light)] text-base font-bold ${getScoreColor(attempt.score, quizInfo?.passPercentage)}`}>
                                                    {attempt.score}%
                                                </td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-[color:var(--text-secondary)]">
                                                    {attempt.marksObtained || '-'}/{attempt.totalMarks || '-'}
                                                </td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-[13px] text-[color:var(--text-secondary)]">{formatTime(attempt.timeTakenSeconds || attempt.timeTaken)}</td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-xs text-[color:var(--text-muted)] max-sm:hidden">{formatDate(attempt.attemptedAt)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    </>
                    )}

                    {/* Evaluations Tab */}
                    {activeTab === 'evaluations' && (
                        <div className="p-6 max-sm:p-4">
                            {evalLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : pendingEvals.length === 0 ? (
                                <div className="py-12 text-center">
                                    <FiCheckCircle className="mx-auto text-[40px] text-[color:var(--success)] mb-3" />
                                    <h3 className="text-base text-[color:var(--text-primary)] mb-1.5">All caught up!</h3>
                                    <p className="text-[color:var(--text-secondary)] text-[13px]">No descriptive answers waiting for evaluation.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <p className="text-sm text-[color:var(--text-muted)]">
                                        <FiClock className="inline mr-1" /> {pendingEvals.length} answer{pendingEvals.length !== 1 ? 's' : ''} pending evaluation
                                    </p>
                                    {pendingEvals.map((answer) => {
                                        const form = evalForms[answer.id] || { marks: '', comment: '' };
                                        return (
                                            <div key={answer.id} className="bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded-xl p-5">
                                                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                                                    <div>
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-[color:var(--accent-light)] text-[color:var(--accent)] font-semibold uppercase">Descriptive</span>
                                                        {answer.username && (
                                                            <span className="ml-2 text-xs text-[color:var(--text-muted)]">by {answer.username}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-[color:var(--text-muted)]">Max marks: {answer.maxMarks || answer.marks || '?'}</span>
                                                </div>

                                                <p className="text-sm font-medium text-[color:var(--text-primary)] mb-3">{answer.questionText}</p>

                                                {answer.modelAnswer && (
                                                    <div className="py-2 px-3 bg-[color:var(--success-light)] rounded-lg mb-2 text-sm text-[color:var(--success)]">
                                                        <span className="text-[11px] block opacity-70 mb-0.5">Model Answer:</span>
                                                        {answer.modelAnswer}
                                                    </div>
                                                )}

                                                <div className="py-2 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg mb-4 text-sm text-[color:var(--text-primary)]">
                                                    <span className="text-[11px] block text-[color:var(--text-muted)] mb-0.5">Student's Answer:</span>
                                                    {answer.textAnswer || <span className="italic text-[color:var(--text-muted)]">No answer provided</span>}
                                                </div>

                                                <div className="flex items-end gap-3 flex-wrap">
                                                    <div className="flex-shrink-0">
                                                        <label className="text-xs text-[color:var(--text-muted)] mb-1 block">Marks</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={answer.maxMarks || 100}
                                                            value={form.marks}
                                                            onChange={(e) => handleEvalFormChange(answer.id, 'marks', e.target.value)}
                                                            className="w-20 py-2 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--accent)]"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-[200px]">
                                                        <label className="text-xs text-[color:var(--text-muted)] mb-1 block">Comment (optional)</label>
                                                        <input
                                                            type="text"
                                                            value={form.comment}
                                                            onChange={(e) => handleEvalFormChange(answer.id, 'comment', e.target.value)}
                                                            className="w-full py-2 px-3 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--accent)]"
                                                            placeholder="Feedback for student..."
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleEvaluateAnswer(answer.id, answer.maxMarks || 100)}
                                                        className="flex items-center gap-1.5 py-2 px-4 bg-[color:var(--accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[color:var(--accent-hover)] transition-all"
                                                    >
                                                        <FiSend size={14} /> Evaluate
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizStudents;
