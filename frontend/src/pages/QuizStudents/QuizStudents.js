import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizAPI } from "../../api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FiUsers, FiFilter, FiDownload } from "react-icons/fi";

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
                <PageHeader title="Back to Home" />

                <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl overflow-hidden">
                    <div className="p-7 text-center border-b border-[color:var(--border)] max-sm:p-5">
                        <h1 className="flex items-center justify-center gap-2.5 text-2xl font-bold text-[color:var(--text-primary)] mb-1.5 max-sm:text-xl">
                            <FiUsers /> Student Attempts
                        </h1>
                        <p className="text-[color:var(--text-secondary)] text-sm">
                            {quizInfo?.title} • {students.length} attempts
                        </p>
                    </div>

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
                </div>
            </div>
        </div>
    );
};

export default QuizStudents;
