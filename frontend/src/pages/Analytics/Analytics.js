import React, { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../../api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiBarChart2,
  FiTarget,
  FiTrendingUp,
  FiAlertTriangle,
  FiUsers,
  FiAward,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ─── Colors ─── */
const ACCENT = "var(--accent)";
const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#818cf8",
  "#7c3aed",
];
const CORRECT_COLOR = "#22c55e";
const WRONG_COLOR = "#ef4444";

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="flex items-center gap-3.5 bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-5 shadow-sm"
  >
    <div className="w-10 h-10 rounded-xl bg-[color:var(--accent-light)] flex items-center justify-center text-[color:var(--accent)]">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[22px] font-bold text-[color:var(--text-primary)] leading-tight">
        {value}
      </p>
      <p className="text-[11px] text-[color:var(--text-muted)]">{label}</p>
      {sub && (
        <p className="text-[10px] text-[color:var(--text-muted)]">{sub}</p>
      )}
    </div>
  </motion.div>
);

/* ─── Difficulty Badge ─── */
const DiffBadge = ({ value }) => {
  const pct = Math.round((value ?? 0) * 100);
  const color =
    pct >= 70
      ? "text-[color:var(--success)]"
      : pct >= 40
      ? "text-[color:var(--warning)]"
      : "text-[color:var(--danger)]";
  const label = pct >= 70 ? "Easy" : pct >= 40 ? "Medium" : "Hard";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {pct}% {label}
    </span>
  );
};

/* ─── Main Analytics Page ─── */
export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await dashboardAPI.getQuizAnalytics(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to load analytics"
      );
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const {
    quizTitle,
    totalAttempts,
    averageScore,
    medianScore,
    standardDeviation,
    scoreDistribution,
    questionAnalytics,
    hardestQuestions,
    easiestQuestions,
    poorDiscriminators,
  } = data;

  /* Score histogram chart data */
  const histogramData = scoreDistribution
    ? Object.entries(scoreDistribution).map(([range, count]) => ({
        range,
        count,
      }))
    : [];

  /* Question table rows */
  const qRows = questionAnalytics || [];

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/dashboard"
          className="p-2 rounded-lg bg-[color:var(--bg-card)] border border-[color:var(--border)] text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] transition-colors"
        >
          <FiArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[color:var(--text-primary)]">
            Quiz Analytics
          </h1>
          <p className="text-sm text-[color:var(--text-muted)]">
            {quizTitle}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {totalAttempts === 0 ? (
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-12 text-center">
          <FiBarChart2
            size={48}
            className="mx-auto text-[color:var(--text-muted)] mb-4"
          />
          <p className="text-lg font-semibold text-[color:var(--text-primary)]">
            No attempts yet
          </p>
          <p className="text-sm text-[color:var(--text-muted)] mt-1">
            Analytics will appear once students start taking this quiz.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={FiUsers}
              label="Total Attempts"
              value={totalAttempts}
              delay={0}
            />
            <StatCard
              icon={FiTrendingUp}
              label="Average Score"
              value={`${averageScore}%`}
              delay={0.05}
            />
            <StatCard
              icon={FiAward}
              label="Median Score"
              value={`${medianScore}%`}
              delay={0.1}
            />
            <StatCard
              icon={FiBarChart2}
              label="Std Deviation"
              value={standardDeviation}
              delay={0.15}
            />
          </div>

          {/* Score Distribution Histogram */}
          {histogramData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-6 mb-6"
            >
              <h2 className="text-sm font-semibold text-[color:var(--text-primary)] mb-4">
                Score Distribution
              </h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {histogramData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Question-Level Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-6 mb-6"
          >
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)] mb-4">
              Per-Question Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border)] text-[color:var(--text-muted)] text-[11px] uppercase tracking-wide">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">Question</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-center py-2 pr-4">Marks</th>
                    <th className="text-center py-2 pr-4">Difficulty</th>
                    <th className="text-center py-2 pr-4">Discrimination</th>
                    <th className="text-center py-2 pr-4">Avg Time</th>
                    <th className="text-center py-2">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {qRows.map((q, i) => (
                    <tr
                      key={q.questionId}
                      onClick={() => setSelectedQuestion(q)}
                      className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--bg-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-4 text-[color:var(--text-muted)] font-medium">
                        {i + 1}
                      </td>
                      <td className="py-3 pr-4 text-[color:var(--text-primary)] max-w-[250px] truncate">
                        {q.questionText}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[color:var(--bg-hover)] text-[color:var(--text-muted)] font-medium uppercase">
                          {q.questionType?.replace("_", "/")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center text-[color:var(--text-secondary)]">
                        {q.marks}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <DiffBadge value={q.difficultyIndex} />
                      </td>
                      <td className="py-3 pr-4 text-center text-[color:var(--text-secondary)]">
                        {q.discriminationIndex?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-center text-[color:var(--text-secondary)]">
                        {q.averageTimeSeconds
                          ? `${q.averageTimeSeconds.toFixed(0)}s`
                          : "—"}
                      </td>
                      <td className="py-3 text-center text-[color:var(--text-secondary)]">
                        {q.totalAttempts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Question Detail Drawer */}
          {selectedQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[color:var(--bg-card)] border border-[color:var(--accent-subtle)] rounded-2xl p-6 mb-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
                    {selectedQuestion.questionText}
                  </h3>
                  <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5">
                    {selectedQuestion.questionType?.replace("_", " / ")} ·{" "}
                    {selectedQuestion.marks} marks ·{" "}
                    {selectedQuestion.totalAttempts} attempts
                  </p>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                >
                  Close
                </button>
              </div>

              {/* Option Distribution Chart (MCQ / MSQ / TRUE_FALSE) */}
              {selectedQuestion.optionDistribution &&
                Object.keys(selectedQuestion.optionDistribution).length >
                  0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-medium text-[color:var(--text-muted)] mb-2 uppercase tracking-wide">
                      Option Distribution
                    </p>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(
                            selectedQuestion.optionDistribution
                          ).map(([opt, count]) => ({
                            option: opt,
                            count,
                            isCorrect:
                              opt === selectedQuestion.correctOption ||
                              (selectedQuestion.correctOptions || []).includes(
                                opt
                              ),
                          }))}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="option"
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {Object.entries(
                              selectedQuestion.optionDistribution
                            ).map(([opt], i) => {
                              const isCorrect =
                                opt === selectedQuestion.correctOption ||
                                (
                                  selectedQuestion.correctOptions || []
                                ).includes(opt);
                              return (
                                <Cell
                                  key={i}
                                  fill={
                                    isCorrect ? CORRECT_COLOR : WRONG_COLOR
                                  }
                                  fillOpacity={0.8}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-[color:var(--text-muted)] mt-1">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded mr-1"
                        style={{ background: CORRECT_COLOR }}
                      />{" "}
                      Correct option{" "}
                      <span
                        className="inline-block w-2.5 h-2.5 rounded mr-1 ml-3"
                        style={{ background: WRONG_COLOR }}
                      />{" "}
                      Other options
                    </p>
                  </div>
                )}

              {/* Marks Distribution (DESCRIPTIVE) */}
              {selectedQuestion.marksDistribution &&
                Object.keys(selectedQuestion.marksDistribution).length >
                  0 && (
                  <div>
                    <p className="text-[11px] font-medium text-[color:var(--text-muted)] mb-2 uppercase tracking-wide">
                      Marks Distribution
                    </p>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(
                            selectedQuestion.marksDistribution
                          ).map(([marks, count]) => ({ marks, count }))}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="marks"
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                            label={{
                              value: "Marks",
                              position: "insideBottom",
                              fontSize: 10,
                              fill: "var(--text-muted)",
                              offset: -2,
                            }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Bar
                            dataKey="count"
                            fill={ACCENT}
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-[color:var(--bg-primary)] rounded-xl">
                  <p className="text-lg font-bold text-[color:var(--text-primary)]">
                    {Math.round((selectedQuestion.difficultyIndex ?? 0) * 100)}%
                  </p>
                  <p className="text-[10px] text-[color:var(--text-muted)]">
                    Difficulty Index
                  </p>
                </div>
                <div className="text-center p-3 bg-[color:var(--bg-primary)] rounded-xl">
                  <p className="text-lg font-bold text-[color:var(--text-primary)]">
                    {selectedQuestion.discriminationIndex?.toFixed(2) ?? "—"}
                  </p>
                  <p className="text-[10px] text-[color:var(--text-muted)]">
                    Discrimination
                  </p>
                </div>
                <div className="text-center p-3 bg-[color:var(--bg-primary)] rounded-xl">
                  <p className="text-lg font-bold text-[color:var(--text-primary)]">
                    {selectedQuestion.averageTimeSeconds
                      ? `${selectedQuestion.averageTimeSeconds.toFixed(0)}s`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-[color:var(--text-muted)]">
                    Avg Time
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Insights Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hardest Questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <FiTarget size={14} className="text-[color:var(--danger)]" />
                <h3 className="text-xs font-semibold text-[color:var(--text-primary)]">
                  Hardest Questions
                </h3>
              </div>
              {(hardestQuestions || []).length === 0 ? (
                <p className="text-xs text-[color:var(--text-muted)]">
                  No data
                </p>
              ) : (
                <ul className="space-y-2">
                  {hardestQuestions.map((q, i) => (
                    <li
                      key={q.questionId}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-[color:var(--text-secondary)] truncate max-w-[70%]">
                        {q.questionText}
                      </span>
                      <DiffBadge value={q.difficultyIndex} />
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Easiest Questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <FiAward size={14} className="text-[color:var(--success)]" />
                <h3 className="text-xs font-semibold text-[color:var(--text-primary)]">
                  Easiest Questions
                </h3>
              </div>
              {(easiestQuestions || []).length === 0 ? (
                <p className="text-xs text-[color:var(--text-muted)]">
                  No data
                </p>
              ) : (
                <ul className="space-y-2">
                  {easiestQuestions.map((q, i) => (
                    <li
                      key={q.questionId}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-[color:var(--text-secondary)] truncate max-w-[70%]">
                        {q.questionText}
                      </span>
                      <DiffBadge value={q.difficultyIndex} />
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Poor Discriminators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <FiAlertTriangle
                  size={14}
                  className="text-[color:var(--warning)]"
                />
                <h3 className="text-xs font-semibold text-[color:var(--text-primary)]">
                  Poor Discriminators
                </h3>
              </div>
              {(poorDiscriminators || []).length === 0 ? (
                <p className="text-xs text-[color:var(--text-muted)]">
                  All questions discriminate well!
                </p>
              ) : (
                <ul className="space-y-2">
                  {poorDiscriminators.map((q) => (
                    <li
                      key={q.questionId}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-[color:var(--text-secondary)] truncate max-w-[70%]">
                        {q.questionText}
                      </span>
                      <span className="text-[color:var(--warning)] font-semibold">
                        {q.discriminationIndex?.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
