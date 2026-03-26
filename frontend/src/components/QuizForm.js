import React, { useState } from "react";
import { FiPlus, FiTrash2, FiCalendar } from "react-icons/fi";

export const CATEGORIES = [
  "General", "Science", "Mathematics", "History",
  "Technology", "Languages", "Arts", "Programming",
];

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

const QUESTION_TYPES = [
  { value: "MCQ", label: "Multiple Choice (Single)" },
  { value: "MSQ", label: "Multiple Select" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "DESCRIPTIVE", label: "Descriptive" },
];

const inputClass = "w-full py-2.5 px-3 font-inherit text-sm text-[color:var(--text-primary)] bg-[color:var(--bg-input)] border border-[color:var(--border)] rounded-lg outline-none transition-all focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)] placeholder:text-[color:var(--text-muted)]";
const inputErrorClass = "w-full py-2.5 px-3 font-inherit text-sm text-[color:var(--text-primary)] bg-[color:var(--bg-input)] border border-[color:var(--danger)] rounded-lg outline-none transition-all focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)] placeholder:text-[color:var(--text-muted)]";
const labelClass = "block mb-[5px] text-[13px] font-medium text-[color:var(--text-primary)]";

const ToggleSwitch = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 px-3.5 bg-[color:var(--bg-input)] border border-[color:var(--border)] rounded-lg">
    <div className="flex flex-col gap-px">
      <span className="text-[13px] font-medium text-[color:var(--text-primary)]">{label}</span>
      <span className="text-[11px] text-[color:var(--text-muted)]">{description}</span>
    </div>
    <div
      className={`relative w-[42px] h-6 rounded-full cursor-pointer transition-all shrink-0 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-[18px] after:h-[18px] after:bg-white after:rounded-full after:transition-all ${checked ? "bg-[color:var(--accent)] after:left-[21px]" : "bg-[color:var(--border)]"}`}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
    />
  </div>
);

/* ─── Question Type Selector (shared) ─── */
const QuestionTypeSelector = ({ value, onChange }) => (
  <div className="mb-3.5">
    <label className={labelClass}>Question Type</label>
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {QUESTION_TYPES.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  </div>
);

/* ─── MCQ / MSQ Options Section ─── */
const MCQOptionsSection = ({ question, index, errors, onUpdate }) => {
  const isMSQ = question.questionType === "MSQ";

  const handleCorrectToggle = (letter) => {
    if (isMSQ) {
      const current = question.correctOptions || [];
      const updated = current.includes(letter) ? current.filter(l => l !== letter) : [...current, letter];
      onUpdate(index, "correctOptions", updated);
    } else {
      onUpdate(index, "correctAnswer", letter);
    }
  };

  return (
    <>
      <div className="mt-3.5">
        <label className={labelClass}>
          Answer Options {isMSQ && <span className="text-[11px] text-[color:var(--text-muted)] font-normal">(click letters to mark correct)</span>}
        </label>
        <div className="grid grid-cols-2 gap-2.5 mt-1.5 max-sm:grid-cols-1">
          {["A", "B", "C", "D"].map((letter, oIdx) => {
            const field = `option${letter}`;
            const isRequired = oIdx < 2;
            const isCorrect = isMSQ ? (question.correctOptions || []).includes(letter) : question.correctAnswer === letter;
            return (
              <div key={letter} className="flex items-center gap-2">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full font-semibold text-xs shrink-0 cursor-pointer transition-all ${isCorrect ? 'bg-[color:var(--success)] text-white' : 'bg-[color:var(--accent-light)] text-[color:var(--accent)]'}`}
                  onClick={() => handleCorrectToggle(letter)}
                  title={isMSQ ? "Toggle correct" : "Set as correct"}
                >
                  {letter}
                </span>
                <input
                  type="text"
                  className="flex-1 py-[9px] px-[11px] font-inherit text-[13px] text-[color:var(--text-primary)] bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg outline-none transition-all focus:border-[color:var(--accent)]"
                  placeholder={`Option ${letter} ${isRequired ? "*" : "(optional)"}`}
                  value={question[field]}
                  onChange={(e) => onUpdate(index, field, e.target.value)}
                />
              </div>
            );
          })}
        </div>
        {isMSQ && <span className="text-[11px] text-[color:var(--text-muted)] mt-1.5 block">Green = correct answer. Select at least 2 correct options.</span>}
        {errors[`options_${index}`] && (
          <span className="block text-[color:var(--danger)] text-xs mt-1">{errors[`options_${index}`]}</span>
        )}
      </div>

      <div className="mt-3.5 pt-3.5 border-t border-[color:var(--border)]">
        <div className="flex gap-4">
          {!isMSQ && (
            <div className="flex-1">
              <label className={labelClass}>Correct Answer</label>
              <select
                className="w-full py-2.5 px-3 font-inherit text-[13px] text-[color:var(--text-primary)] bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg outline-none cursor-pointer"
                value={question.correctAnswer}
                onChange={(e) => onUpdate(index, "correctAnswer", e.target.value)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          )}
          <div className="w-[120px]">
            <label className={labelClass}>Marks</label>
            <input type="number" className={inputClass} value={question.marks} min="1" onChange={(e) => onUpdate(index, "marks", e.target.value)} />
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── True/False Section ─── */
const TrueFalseSection = ({ question, index, onUpdate }) => (
  <div className="mt-3.5 pt-3.5 border-t border-[color:var(--border)]">
    <div className="flex gap-4">
      <div className="flex-1">
        <label className={labelClass}>Correct Answer</label>
        <div className="flex gap-2">
          {["True", "False"].map((opt) => (
            <button
              key={opt}
              type="button"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${question.correctAnswer === opt ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)]' : 'bg-[color:var(--bg-card)] text-[color:var(--text-secondary)] border-[color:var(--border)] hover:border-[color:var(--accent)]'}`}
              onClick={() => onUpdate(index, "correctAnswer", opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="w-[120px]">
        <label className={labelClass}>Marks</label>
        <input type="number" className={inputClass} value={question.marks} min="1" onChange={(e) => onUpdate(index, "marks", e.target.value)} />
      </div>
    </div>
  </div>
);

/* ─── Descriptive Section ─── */
const DescriptiveSection = ({ question, index, onUpdate }) => (
  <>
    <div className="mb-3.5">
      <label className={labelClass}>Model Answer <span className="text-[11px] text-[color:var(--text-muted)] font-normal">(reference for grading)</span></label>
      <textarea
        className={inputClass}
        placeholder="Enter the model/expected answer..."
        rows={3}
        value={question.modelAnswer || ""}
        onChange={(e) => onUpdate(index, "modelAnswer", e.target.value)}
      />
    </div>
    <div className="mb-3.5">
      <label className={labelClass}>Keywords <span className="text-[11px] text-[color:var(--text-muted)] font-normal">(comma-separated, for grading)</span></label>
      <input
        type="text"
        className={inputClass}
        placeholder="e.g. polymorphism, inheritance, encapsulation"
        value={question.keywords || ""}
        onChange={(e) => onUpdate(index, "keywords", e.target.value)}
      />
    </div>
    <div className="mt-3.5 pt-3.5 border-t border-[color:var(--border)]">
      <div className="w-[120px]">
        <label className={labelClass}>Marks</label>
        <input type="number" className={inputClass} value={question.marks} min="1" onChange={(e) => onUpdate(index, "marks", e.target.value)} />
      </div>
    </div>
  </>
);

/* ─── Unified Question Card ─── */
const QuestionCard = ({ question, index, total, errors, onUpdate, onRemove }) => {
  const type = question.questionType || "MCQ";
  const typeLabel = QUESTION_TYPES.find(t => t.value === type)?.label || "MCQ";
  const typeBadgeColor = {
    MCQ: 'bg-[color:var(--accent-light)] text-[color:var(--accent)]',
    MSQ: 'bg-[color:var(--accent-light)] text-[color:var(--accent)]',
    TRUE_FALSE: 'bg-[color:var(--success-light)] text-[color:var(--success)]',
    DESCRIPTIVE: 'bg-[color:var(--warning-light)] text-[color:var(--warning)]',
  };

  return (
    <div className="bg-[color:var(--bg-input)] border border-[color:var(--border)] rounded-lg p-[18px] mb-3.5">
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[color:var(--accent)]">Question {index + 1}</span>
          <span className={`text-[10px] py-0.5 px-2 rounded-full font-medium ${typeBadgeColor[type] || ''}`}>{typeLabel}</span>
        </div>
        {total > 1 && (
          <button
            type="button"
            className="w-[30px] h-[30px] bg-transparent border-none text-[color:var(--danger)] rounded cursor-pointer flex items-center justify-center transition-all hover:bg-[color:var(--danger-light)]"
            onClick={() => onRemove(index)}
            title="Remove question"
          >
            <FiTrash2 />
          </button>
        )}
      </div>

      <QuestionTypeSelector value={type} onChange={(val) => onUpdate(index, "questionType", val)} />

      <div className="mb-3.5">
        <label className={labelClass}>{type === "TRUE_FALSE" ? "Statement *" : "Question Text *"}</label>
        <input
          type="text"
          className={errors[`question_${index}`] ? inputErrorClass : inputClass}
          placeholder={type === "TRUE_FALSE" ? "Enter a true or false statement..." : "Enter your question..."}
          value={question.text}
          onChange={(e) => onUpdate(index, "text", e.target.value)}
        />
        {errors[`question_${index}`] && (
          <span className="block text-[color:var(--danger)] text-xs mt-1">{errors[`question_${index}`]}</span>
        )}
      </div>

      {(type === "MCQ" || type === "MSQ") && <MCQOptionsSection question={question} index={index} errors={errors} onUpdate={onUpdate} />}
      {type === "TRUE_FALSE" && <TrueFalseSection question={question} index={index} onUpdate={onUpdate} />}
      {type === "DESCRIPTIVE" && <DescriptiveSection question={question} index={index} onUpdate={onUpdate} />}
    </div>
  );
};

/**
 * Shared quiz form used by both AddQuiz and EditQuiz.
 *
 * Props:
 * - initialData: { title, description, category, status, timeLimitMinutes, negativeMarking, shuffleQuestions, shuffleOptions, passPercentage, startTime, endTime, questions }
 * - onSubmit: async (quizData) => void
 * - submitLabel: string (e.g. "Create Quiz")
 * - submittingLabel: string (e.g. "Creating...")
 * - showStatus: boolean (show status badge for edit mode)
 */
const QuizForm = ({
  initialData = {},
  onSubmit,
  submitLabel = "Create Quiz",
  submittingLabel = "Creating...",
  showStatus = false,
}) => {
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [category, setCategory] = useState(initialData.category || "General");
  const [difficulty, setDifficulty] = useState(initialData.difficulty || "");
  const [tags, setTags] = useState(initialData.tags || "");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialData.timeLimitMinutes || "");
  const [negativeMarking, setNegativeMarking] = useState(initialData.negativeMarking || false);
  const [shuffleQuestions, setShuffleQuestions] = useState(initialData.shuffleQuestions || false);
  const [shuffleOptions, setShuffleOptions] = useState(initialData.shuffleOptions || false);
  const [fullScreenRequired, setFullScreenRequired] = useState(initialData.fullScreenRequired || false);
  const [passPercentage, setPassPercentage] = useState(initialData.passPercentage || "");
  const [startTime, setStartTime] = useState(initialData.startTime || "");
  const [endTime, setEndTime] = useState(initialData.endTime || "");
  const [questions, setQuestions] = useState(
    initialData.questions?.length
      ? initialData.questions
      : [{ text: "", questionType: "MCQ", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", correctOptions: [], modelAnswer: "", keywords: "", marks: 10 }]
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const status = initialData.status;

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Quiz title is required";
    questions.forEach((q, i) => {
      if (!q.text.trim()) newErrors[`question_${i}`] = "Question text is required";
      const type = q.questionType || "MCQ";
      if (type === "MCQ" || type === "MSQ") {
        if (!q.optionA?.trim() || !q.optionB?.trim()) newErrors[`options_${i}`] = "At least 2 options required";
        if (type === "MSQ" && (!q.correctOptions || q.correctOptions.length < 2)) {
          newErrors[`question_${i}`] = "MSQ requires at least 2 correct options";
        }
      }
      if (type === "TRUE_FALSE" && !q.correctAnswer) {
        newErrors[`question_${i}`] = "Select True or False";
      }
    });
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      newErrors.schedule = "End time must be after start time";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const quizData = {
        title,
        description,
        category,
        difficulty: difficulty || null,
        tags: tags.trim() || null,
        timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        fullScreenRequired,
        passPercentage: passPercentage ? parseInt(passPercentage) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        questions: questions.map((q) => {
          const type = q.questionType || "MCQ";

          if (type === "DESCRIPTIVE") {
            return {
              id: q.id,
              text: q.text,
              questionType: type,
              modelAnswer: q.modelAnswer || null,
              keywords: q.keywords || null,
              marks: parseInt(q.marks) || 1,
            };
          }

          if (type === "TRUE_FALSE") {
            return {
              id: q.id,
              text: q.text,
              questionType: type,
              options: ["True", "False"],
              correctOption: q.correctAnswer || "True",
              marks: parseInt(q.marks) || 1,
            };
          }

          // MCQ / MSQ
          const options = [q.optionA, q.optionB];
          if (q.optionC) options.push(q.optionC);
          if (q.optionD) options.push(q.optionD);

          const base = {
            id: q.id,
            text: q.text,
            questionType: type,
            options,
            marks: parseInt(q.marks) || 1,
          };

          if (type === "MSQ") {
            base.correctOptions = (q.correctOptions || [])
              .map(letter => {
                const idx = ["A", "B", "C", "D"].indexOf(letter);
                return idx >= 0 && idx < options.length ? options[idx] : null;
              })
              .filter(Boolean);
          } else {
            // MCQ: convert letter (A/B/C/D) to actual option text
            const idx = ["A", "B", "C", "D"].indexOf(q.correctAnswer);
            base.correctOption = idx >= 0 && idx < options.length ? options[idx] : q.correctAnswer;
          }

          return base;
        }),
      };
      await onSubmit(quizData);
    } finally {
      setSubmitting(false);
    }
  };

  const addQuestion = (type = "MCQ") => {
    const base = { text: "", questionType: type, marks: 10 };
    if (type === "MCQ" || type === "MSQ") {
      Object.assign(base, { optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", correctOptions: [] });
    } else if (type === "TRUE_FALSE") {
      Object.assign(base, { correctAnswer: "True" });
    } else if (type === "DESCRIPTIVE") {
      Object.assign(base, { modelAnswer: "", keywords: "" });
    }
    setQuestions([...questions, base]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[index], [field]: value };

      // When question type changes, reset relevant fields
      if (field === "questionType") {
        q.optionA = q.optionA || "";
        q.optionB = q.optionB || "";
        q.optionC = q.optionC || "";
        q.optionD = q.optionD || "";
        q.correctAnswer = value === "TRUE_FALSE" ? "True" : "A";
        q.correctOptions = [];
        q.modelAnswer = q.modelAnswer || "";
        q.keywords = q.keywords || "";
      }

      updated[index] = q;
      return updated;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Quiz Details */}
      <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-6 max-sm:p-4">
        <h2 className="text-base font-semibold text-[color:var(--text-primary)] mb-[18px] flex items-center gap-2">
          📝 Quiz Details
          {showStatus && status && (
            <span className={`ml-3 text-xs py-1 px-2.5 rounded-full ${status === "PUBLISHED" ? "bg-[color:var(--success-light)] text-[color:var(--success)]" : "bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]"}`}>
              {status}
            </span>
          )}
        </h2>

        <div className="mb-3.5">
          <label className={labelClass}>Quiz Title *</label>
          <input
            type="text"
            className={errors.title ? inputErrorClass : inputClass}
            placeholder="Enter an engaging quiz title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <span className="block text-[color:var(--danger)] text-xs mt-1">{errors.title}</span>}
        </div>

        <div className="mb-3.5">
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            placeholder="Brief description of the quiz..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mt-3.5 max-sm:grid-cols-1">
          <div>
            <label className={labelClass}>Difficulty Level</label>
            <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">Not Set</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. react, javascript, beginner"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <span className="text-[11px] text-[color:var(--text-muted)] mt-1 block">Comma-separated tags</span>
          </div>
        </div>
      </div>

      {/* Quiz Settings */}
      <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-6 max-sm:p-4">
        <h2 className="text-base font-semibold text-[color:var(--text-primary)] mb-[18px] flex items-center gap-2">⚙️ Quiz Settings</h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 max-sm:grid-cols-1">
          <div>
            <label className={labelClass}>Time Limit (minutes)</label>
            <input type="number" className={inputClass} placeholder="No limit" min="1" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Pass Percentage</label>
            <input type="number" className={inputClass} placeholder="e.g., 60" min="0" max="100" value={passPercentage} onChange={(e) => setPassPercentage(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mt-4 max-sm:grid-cols-1">
          <ToggleSwitch label="Shuffle Questions" description="Randomize order" checked={shuffleQuestions} onChange={() => setShuffleQuestions(!shuffleQuestions)} />
          <ToggleSwitch label="Shuffle Options" description="Randomize answers" checked={shuffleOptions} onChange={() => setShuffleOptions(!shuffleOptions)} />
          <ToggleSwitch label="Negative Marking" description="Penalty for wrong" checked={negativeMarking} onChange={() => setNegativeMarking(!negativeMarking)} />
          <ToggleSwitch label="Full Screen Mode" description="Require full screen" checked={fullScreenRequired} onChange={() => setFullScreenRequired(!fullScreenRequired)} />
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-6 max-sm:p-4">
        <h2 className="text-base font-semibold text-[color:var(--text-primary)] mb-[18px] flex items-center gap-2">
          <FiCalendar /> Schedule (Optional)
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 max-sm:grid-cols-1">
          <div>
            <label className={labelClass}>Start Time</label>
            <input type="datetime-local" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>End Time</label>
            <input type="datetime-local" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        {errors.schedule && <span className="block text-[color:var(--danger)] text-xs mt-2">{errors.schedule}</span>}
        <p className="text-[11px] text-[color:var(--text-muted)] mt-2">Leave empty to make the quiz available immediately with no deadline.</p>
      </div>

      {/* Questions */}
      <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-6 max-sm:p-4">
        <h2 className="text-base font-semibold text-[color:var(--text-primary)] mb-[18px] flex items-center gap-2">
          ❓ Questions ({questions.length})
        </h2>

        {questions.map((question, qIndex) => (
          <QuestionCard
            key={question.id || qIndex}
            question={question}
            index={qIndex}
            total={questions.length}
            errors={errors}
            onUpdate={updateQuestion}
            onRemove={removeQuestion}
          />
        ))}

        <div className="flex flex-wrap gap-2">
          {[
            { type: "MCQ", label: "MCQ", icon: "○" },
            { type: "MSQ", label: "Multi-Select", icon: "☑" },
            { type: "TRUE_FALSE", label: "True / False", icon: "T/F" },
            { type: "DESCRIPTIVE", label: "Descriptive", icon: "✎" },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              className="flex items-center justify-center gap-1.5 flex-1 min-w-[140px] py-3 bg-[color:var(--accent-light)] text-[color:var(--accent)] border-[1.5px] border-dashed border-[color:var(--accent-subtle)] rounded-lg font-inherit text-[13px] font-medium cursor-pointer transition-all hover:bg-[color:var(--accent)] hover:text-white hover:border-[color:var(--accent)] hover:border-solid"
              onClick={() => addQuestion(item.type)}
            >
              <FiPlus /> <span className="mr-0.5">{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2.5 pt-2 max-sm:flex-col">
        <button
          type="submit"
          className="py-2.5 px-7 bg-[color:var(--accent)] text-white border-none rounded-lg font-inherit text-[13px] font-medium cursor-pointer transition-all hover:bg-[color:var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed max-sm:w-full"
          disabled={submitting}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default QuizForm;
