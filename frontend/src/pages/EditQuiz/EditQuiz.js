import React, { useContext, useState, useEffect, useCallback } from "react";
import { quizAPI } from "../../api";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import "../AddQuiz/AddQuiz.css";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";

const CATEGORIES = ['General', 'Science', 'Mathematics', 'History', 'Technology', 'Languages', 'Arts', 'Programming'];

const EditQuiz = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Quiz Details
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [status, setStatus] = useState("DRAFT");

    // Quiz Settings
    const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
    const [negativeMarking, setNegativeMarking] = useState(false);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleOptions, setShuffleOptions] = useState(false);
    const [passPercentage, setPassPercentage] = useState("");

    // Questions
    const [questions, setQuestions] = useState([
        { text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", marks: 10 }
    ]);

    const [errors, setErrors] = useState({});

    const fetchQuizData = useCallback(async () => {
        try {
            const response = await quizAPI.getQuizById(id);
            const quiz = response.data;

            setTitle(quiz.title || "");
            setDescription(quiz.description || "");
            setCategory(quiz.category || "General");
            setStatus(quiz.status || "DRAFT");
            setTimeLimitMinutes(quiz.timeLimitMinutes || "");
            setNegativeMarking(quiz.negativeMarking || false);
            setShuffleQuestions(quiz.shuffleQuestions || false);
            setShuffleOptions(quiz.shuffleOptions || false);
            setPassPercentage(quiz.passPercentage || "");

            // Map questions to form format
            if (quiz.questions && quiz.questions.length > 0) {
                setQuestions(quiz.questions.map(q => ({
                    id: q.id,
                    text: q.text || "",
                    optionA: q.options?.[0] || "",
                    optionB: q.options?.[1] || "",
                    optionC: q.options?.[2] || "",
                    optionD: q.options?.[3] || "",
                    correctAnswer: q.correctOption || "A",
                    marks: q.marks || 1
                })));
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast.error("Failed to load quiz data");
            navigate("/home");
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchQuizData();
    }, [fetchQuizData]);

    const validateForm = () => {
        const newErrors = {};

        if (!title.trim()) {
            newErrors.title = "Quiz title is required";
        }

        questions.forEach((q, index) => {
            if (!q.text.trim()) {
                newErrors[`question_${index}`] = "Question text is required";
            }
            if (!q.optionA.trim() || !q.optionB.trim()) {
                newErrors[`options_${index}`] = "At least 2 options are required";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSaving(true);
        try {
            const quizData = {
                title,
                description,
                category,
                timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
                negativeMarking,
                shuffleQuestions,
                shuffleOptions,
                passPercentage: passPercentage ? parseInt(passPercentage) : null,
                questions: questions.map(q => {
                    const options = [q.optionA, q.optionB];
                    if (q.optionC) options.push(q.optionC);
                    if (q.optionD) options.push(q.optionD);
                    return {
                        id: q.id,
                        text: q.text,
                        options,
                        correctOption: q.correctAnswer,
                        marks: parseInt(q.marks) || 1
                    };
                })
            };

            await quizAPI.updateQuiz(id, quizData);
            toast.success("Quiz updated successfully! ✓");
            setTimeout(() => navigate("/home"), 1500);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update quiz");
        } finally {
            setSaving(false);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", marks: 10 }
        ]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    if (loading) {
        return (
            <div className="addquiz-container">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="addquiz-container">
            <PageHeader title="Edit Quiz" />

            <form onSubmit={handleSubmit} className="form-container">
                {/* Quiz Details Section */}
                <div className="form-section">
                    <h2 className="section-title">
                        📝 Quiz Details
                        {status && (
                            <span style={{
                                marginLeft: '12px',
                                fontSize: '12px',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                background: status === 'PUBLISHED' ? 'var(--success-light)' : 'var(--bg-hover)',
                                color: status === 'PUBLISHED' ? 'var(--success)' : 'var(--text-secondary)',
                            }}>
                                {status}
                            </span>
                        )}
                    </h2>

                    <div className="form-group">
                        <label className="form-label">Quiz Title *</label>
                        <input
                            type="text"
                            className={`form-input ${errors.title ? "error" : ""}`}
                            placeholder="Enter an engaging quiz title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        {errors.title && <span className="error-text">{errors.title}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            placeholder="Brief description of the quiz..."
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Quiz Settings Section */}
                <div className="form-section">
                    <h2 className="section-title">⚙️ Quiz Settings</h2>

                    <div className="settings-grid">
                        <div className="form-group">
                            <label className="form-label">Time Limit (minutes)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Leave empty for no limit"
                                min="1"
                                value={timeLimitMinutes}
                                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Pass Percentage</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g., 60"
                                min="0"
                                max="100"
                                value={passPercentage}
                                onChange={(e) => setPassPercentage(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="settings-grid" style={{ marginTop: '16px' }}>
                        <div className="toggle-group">
                            <div className="toggle-label">
                                <span className="toggle-label-text">Shuffle Questions</span>
                                <span className="toggle-label-desc">Randomize order</span>
                            </div>
                            <div
                                className={`toggle-switch ${shuffleQuestions ? 'active' : ''}`}
                                onClick={() => setShuffleQuestions(!shuffleQuestions)}
                            />
                        </div>

                        <div className="toggle-group">
                            <div className="toggle-label">
                                <span className="toggle-label-text">Shuffle Options</span>
                                <span className="toggle-label-desc">Randomize answers</span>
                            </div>
                            <div
                                className={`toggle-switch ${shuffleOptions ? 'active' : ''}`}
                                onClick={() => setShuffleOptions(!shuffleOptions)}
                            />
                        </div>

                        <div className="toggle-group">
                            <div className="toggle-label">
                                <span className="toggle-label-text">Negative Marking</span>
                                <span className="toggle-label-desc">Penalty for wrong</span>
                            </div>
                            <div
                                className={`toggle-switch ${negativeMarking ? 'active' : ''}`}
                                onClick={() => setNegativeMarking(!negativeMarking)}
                            />
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="form-section">
                    <h2 className="section-title">❓ Questions ({questions.length})</h2>

                    {questions.map((question, qIndex) => (
                        <div key={question.id || qIndex} className="question-card">
                            <div className="question-header">
                                <span className="question-number">Question {qIndex + 1}</span>
                                {questions.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeQuestion(qIndex)}
                                        title="Remove question"
                                    >
                                        <FiTrash2 />
                                    </button>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Question Text *</label>
                                <input
                                    type="text"
                                    className={`form-input ${errors[`question_${qIndex}`] ? "error" : ""}`}
                                    placeholder="Enter your question..."
                                    value={question.text}
                                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                />
                            </div>

                            <div className="options-container">
                                <label className="form-label">Answer Options</label>
                                <div className="options-grid">
                                    <div className="option-row">
                                        <span className="option-label">A</span>
                                        <input
                                            type="text"
                                            className="option-input"
                                            placeholder="Option A *"
                                            value={question.optionA}
                                            onChange={(e) => updateQuestion(qIndex, 'optionA', e.target.value)}
                                        />
                                    </div>
                                    <div className="option-row">
                                        <span className="option-label">B</span>
                                        <input
                                            type="text"
                                            className="option-input"
                                            placeholder="Option B *"
                                            value={question.optionB}
                                            onChange={(e) => updateQuestion(qIndex, 'optionB', e.target.value)}
                                        />
                                    </div>
                                    <div className="option-row">
                                        <span className="option-label">C</span>
                                        <input
                                            type="text"
                                            className="option-input"
                                            placeholder="Option C (optional)"
                                            value={question.optionC}
                                            onChange={(e) => updateQuestion(qIndex, 'optionC', e.target.value)}
                                        />
                                    </div>
                                    <div className="option-row">
                                        <span className="option-label">D</span>
                                        <input
                                            type="text"
                                            className="option-input"
                                            placeholder="Option D (optional)"
                                            value={question.optionD}
                                            onChange={(e) => updateQuestion(qIndex, 'optionD', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="correct-answer-section">
                                <div className="form-group" style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Correct Answer</label>
                                        <select
                                            className="correct-answer-select"
                                            value={question.correctAnswer}
                                            onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                        >
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                            <option value="D">D</option>
                                        </select>
                                    </div>
                                    <div style={{ width: '120px' }}>
                                        <label className="form-label">Marks</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={question.marks}
                                            min="1"
                                            onChange={(e) => updateQuestion(qIndex, 'marks', e.target.value)}
                                        />
                                    </div>
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
                    <button type="button" className="cancel-btn" onClick={() => navigate("/home")}>
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditQuiz;
