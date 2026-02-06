import React, { useContext, useState, useEffect } from "react";
import { quizAPI } from "./api";
import { UserContext } from "./userContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useForm, useFieldArray } from "react-hook-form";
import "./style/AddQuiz.css";
// Components
import PageHeader from "./components/PageHeader";
import LoadingSpinner from "./components/LoadingSpinner";

const CATEGORIES = ['General', 'Science', 'Mathematics', 'History', 'Technology', 'Languages', 'Arts'];

const EditQuiz = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            title: "",
            category: "General",
            questions: [{ text: "", options: ["", ""], correctOption: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions",
    });

    // Fetch existing quiz data
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await quizAPI.getQuizById(id);
                const quiz = response.data;

                // Check ownership
                if (quiz.username !== user?.user?.username) {
                    toast.error("You can only edit your own quizzes");
                    navigate("/home");
                    return;
                }

                // Reset form with fetched data
                reset({
                    title: quiz.title,
                    category: quiz.category || "General",
                    questions: quiz.questions.map(q => ({
                        text: q.text,
                        options: q.options || ["", ""],
                        correctOption: q.correctOption,
                    })),
                });
            } catch (error) {
                console.error("Error fetching quiz:", error);
                toast.error("Failed to load quiz");
                navigate("/home");
            } finally {
                setFetching(false);
            }
        };

        fetchQuiz();
    }, [id, reset, navigate, user]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const quizData = {
                ...data,
                username: user?.user?.username,
            };

            await quizAPI.updateQuiz(id, quizData);
            toast.success("Quiz updated successfully! 🎉");
            setTimeout(() => navigate("/home"), 1500);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                toast.error("Please login to edit quizzes");
                navigate("/");
            } else {
                toast.error(error.response?.data?.message || "Failed to update quiz");
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="addquiz-container">
                <LoadingSpinner text="Loading quiz..." />
            </div>
        );
    }

    return (
        <div className="addquiz-container">
            <PageHeader title="Edit Quiz" />

            <form onSubmit={handleSubmit(onSubmit)} className="form-container">
                {/* Quiz Details Section */}
                <div className="form-section">
                    <h2 className="section-title">📝 Quiz Details</h2>
                    <div className="form-group">
                        <label className="form-label">Quiz Title</label>
                        <input
                            type="text"
                            className={`form-input ${errors.title ? "error" : ""}`}
                            placeholder="Enter an engaging quiz title..."
                            {...register("title", { required: "Quiz title is required" })}
                        />
                        {errors.title && (
                            <span className="error-text">{errors.title.message}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-input"
                            {...register("category", { required: "Category is required" })}
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="form-section">
                    <h2 className="section-title">❓ Questions</h2>

                    {fields.map((field, qIndex) => (
                        <div key={field.id} className="question-card">
                            <div className="question-header">
                                <span className="question-number">Question {qIndex + 1}</span>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => remove(qIndex)}
                                        aria-label="Remove question"
                                    >
                                        <FiTrash2 aria-hidden="true" />
                                    </button>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Question Text</label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.questions?.[qIndex]?.text ? "error" : ""}`}
                                    placeholder="Enter your question..."
                                    {...register(`questions.${qIndex}.text`, {
                                        required: "Question text is required",
                                    })}
                                />
                                {errors.questions?.[qIndex]?.text && (
                                    <span className="error-text">
                                        {errors.questions[qIndex].text.message}
                                    </span>
                                )}
                            </div>

                            <NestedOptionList
                                nestIndex={qIndex}
                                control={control}
                                register={register}
                                errors={errors}
                            />

                            <div className="correct-answer-section">
                                <div className="form-group">
                                    <label className="form-label">Correct Answer</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.questions?.[qIndex]?.correctOption ? "error" : ""}`}
                                        placeholder="Enter the correct answer..."
                                        {...register(`questions.${qIndex}.correctOption`, {
                                            required: "Correct answer is required",
                                        })}
                                    />
                                    {errors.questions?.[qIndex]?.correctOption && (
                                        <span className="error-text">
                                            {errors.questions[qIndex].correctOption.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="add-question-btn"
                        onClick={() => append({ text: "", options: ["", ""], correctOption: "" })}
                    >
                        <FiPlus aria-hidden="true" /> Add Another Question
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
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>

            <ToastContainer />
        </div>
    );
};

// Helper component for nested options array
const NestedOptionList = ({ nestIndex, control, register, errors }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `questions.${nestIndex}.options`,
    });

    return (
        <div className="options-container">
            <label className="form-label">Answer Options</label>
            {fields.map((field, k) => (
                <div key={field.id} className="option-row">
                    <span className="option-label">{String.fromCharCode(65 + k)}</span>
                    <input
                        type="text"
                        className="option-input"
                        placeholder={`Option ${k + 1}`}
                        {...register(`questions.${nestIndex}.options.${k}`)}
                    />
                </div>
            ))}
            <button
                type="button"
                className="add-option-btn"
                onClick={() => append("")}
            >
                <FiPlus /> Add Option
            </button>
        </div>
    );
};

export default EditQuiz;
