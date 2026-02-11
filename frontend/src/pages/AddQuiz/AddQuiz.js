import React from "react";
import { quizAPI } from "../../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import QuizForm from "../../components/QuizForm";

const AddQuiz = () => {
  const navigate = useNavigate();

  const handleSubmit = async (quizData) => {
    try {
      await quizAPI.createQuiz(quizData);
      toast.success("Quiz created successfully! 🎉");
      setTimeout(() => navigate("/home"), 1500);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error("Please login to create quizzes");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to create quiz");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-w-[860px] mx-auto max-sm:p-4">
      <PageHeader title="Create New Quiz" />
      <QuizForm
        onSubmit={handleSubmit}
        submitLabel="Create Quiz"
        submittingLabel="Creating..."
      />
    </div>
  );
};

export default AddQuiz;
