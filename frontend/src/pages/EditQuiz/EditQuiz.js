import React, { useState, useEffect, useCallback } from "react";
import { quizAPI } from "../../api";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import QuizForm from "../../components/QuizForm";

const EditQuiz = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchQuizData = useCallback(async () => {
        try {
            const response = await quizAPI.getQuizById(id);
            const quiz = response.data;

            // Map to QuizForm's initialData format
            setInitialData({
                title: quiz.title || "",
                description: quiz.description || "",
                category: quiz.category || "General",
                status: quiz.status || "DRAFT",
                timeLimitMinutes: quiz.timeLimitMinutes || "",
                negativeMarking: quiz.negativeMarking || false,
                shuffleQuestions: quiz.shuffleQuestions || false,
                shuffleOptions: quiz.shuffleOptions || false,
                passPercentage: quiz.passPercentage || "",
                startTime: quiz.startTime || "",
                endTime: quiz.endTime || "",
                questions: quiz.questions?.length
                    ? quiz.questions.map((q) => ({
                        id: q.id,
                        text: q.text || "",
                        optionA: q.options?.[0] || "",
                        optionB: q.options?.[1] || "",
                        optionC: q.options?.[2] || "",
                        optionD: q.options?.[3] || "",
                        correctAnswer: q.correctOption || "A",
                        marks: q.marks || 1,
                    }))
                    : undefined,
            });
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

    const handleSubmit = async (quizData) => {
        try {
            await quizAPI.updateQuiz(id, quizData);
            toast.success("Quiz updated successfully! ✓");
            setTimeout(() => navigate("/home"), 1500);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update quiz");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-[860px] mx-auto">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-[860px] mx-auto max-sm:p-4">
            <PageHeader title="Edit Quiz" />
            <QuizForm
                initialData={initialData}
                onSubmit={handleSubmit}
                submitLabel="Save Changes"
                submittingLabel="Saving..."
                showStatus
            />
        </div>
    );
};

export default EditQuiz;
