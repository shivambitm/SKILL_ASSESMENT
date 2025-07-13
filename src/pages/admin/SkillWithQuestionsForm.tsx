import React, { useState } from "react";
import "./dashboard-custom.css";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorMessage from "../../components/common/ErrorMessage";

interface QuestionForm {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  difficulty: string;
}

const emptyQuestion: QuestionForm = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  difficulty: "easy",
};

const SkillWithQuestionsForm: React.FC = () => {
  const [skill, setSkill] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { ...emptyQuestion },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkill({ ...skill, [e.target.name]: e.target.value });
  };
  const handleQuestionChange = (
    idx: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const updated = [...questions];
    updated[idx][e.target.name as keyof QuestionForm] = e.target.value;
    setQuestions(updated);
  };
  const addQuestion = () => setQuestions([...questions, { ...emptyQuestion }]);
  const removeQuestion = (idx: number) =>
    setQuestions(
      questions.length > 1 ? questions.filter((_, i) => i !== idx) : questions
    );
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/skills/with-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...skill, questions }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Skill and questions added successfully!");
        setSkill({ name: "", description: "", category: "" });
        setQuestions([{ ...emptyQuestion }]);
      } else {
        setError(data.message || "Failed to add skill and questions");
      }
    } catch {
      setError("Failed to add skill and questions");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">Skill Name</label>
            <input
              name="name"
              value={skill.name}
              onChange={handleSkillChange}
              required
              placeholder="Skill Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <input
              name="description"
              value={skill.description}
              onChange={handleSkillChange}
              required
              placeholder="Description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Category</label>
            <input
              name="category"
              value={skill.category}
              onChange={handleSkillChange}
              required
              placeholder="Category"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-2">Questions</label>
          <div className="space-y-4 smooth-scrollbar max-h-[400px] overflow-y-auto pr-2">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 shadow-lg backdrop-blur-md relative transition-colors"
              >
                <div className="mb-2 flex justify-between items-center">
                  <span className="font-semibold">Question {idx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:underline text-xs"
                      onClick={() => removeQuestion(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  name="questionText"
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(idx, e)}
                  required
                  placeholder="Question Text"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 mb-2 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    name="optionA"
                    value={q.optionA}
                    onChange={(e) => handleQuestionChange(idx, e)}
                    required
                    placeholder="Option A"
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                  />
                  <input
                    name="optionB"
                    value={q.optionB}
                    onChange={(e) => handleQuestionChange(idx, e)}
                    required
                    placeholder="Option B"
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                  />
                  <input
                    name="optionC"
                    value={q.optionC}
                    onChange={(e) => handleQuestionChange(idx, e)}
                    required
                    placeholder="Option C"
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                  />
                  <input
                    name="optionD"
                    value={q.optionD}
                    onChange={(e) => handleQuestionChange(idx, e)}
                    required
                    placeholder="Option D"
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                  />
                </div>
                <div className="flex gap-2 mb-2">
                  <select
                    name="correctAnswer"
                    value={q.correctAnswer}
                    onChange={(e) => handleQuestionChange(idx, e)}
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                  <select
                    name="difficulty"
                    value={q.difficulty}
                    onChange={(e) => handleQuestionChange(idx, e)}
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs"
            onClick={addQuestion}
          >
            + Add Another Question
          </button>
        </div>
        <Button type="submit" className="w-full mt-4" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
        {success && <div className="text-green-600 text-sm">{success}</div>}
        {error && <ErrorMessage message={error} />}
      </form>
    </div>
  );

  // Add the missing closing brace for the component
};
export default SkillWithQuestionsForm;
