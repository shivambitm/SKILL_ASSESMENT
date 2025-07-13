import React, { useEffect, useState } from "react";
import "./admin-questions-scrollbar.css";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { skillsApi, adminApi } from "../../services/api";

interface Question {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty?: string;
  is_active: number;
  isSeedOnly?: boolean;
}

interface Skill {
  id: number;
  name: string;
  description: string;
  questions: Question[];
}

const AdminQuestions: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [error, setError] = useState("");

  // Question modals
  const [showQModal, setShowQModal] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [qForm, setQForm] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    difficulty: "easy",
    is_active: 1,
  });
  const [isAddQ, setIsAddQ] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [qError, setQError] = useState("");

  // For seed-only import, use merged endpoint and show importable questions
  // Removed unused seedQuestions state and related code for lint clean-up.
  useEffect(() => {
    // Fetch DB skills/questions for CRUD
    fetchSkills();
    // Removed fetchSeed and related code for lint clean-up.
  }, []);

  // Fetch skills/questions from DB only (for full CRUD)
  const fetchSkills = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await skillsApi.getAllSkillsWithQuestions();
      setSkills(res.data.data);
      if (res.data.data.length > 0) setSelectedSkill(res.data.data[0]);
      else setSelectedSkill(null);
    } catch {
      setError("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  // Skill edit
  const handleEditClick = (skill: Skill) => {
    setEditSkill(skill);
    setEditForm({ name: skill.name, description: skill.description });
    setShowSkillModal(true);
  };
  const handleEditSave = async () => {
    if (!editSkill) return;
    await skillsApi.updateSkill(editSkill.id, editForm);
    setShowSkillModal(false);
    setEditSkill(null);
    fetchSkills();
  };
  const handleDeleteSkill = async (id: number) => {
    if (!window.confirm("Delete this skill and all its questions?")) return;
    await skillsApi.deleteSkill(id);
    setSelectedSkill(null);
    fetchSkills();
  };

  // Question CRUD
  const handleEditQClick = (q: Question) => {
    setEditQ(q);
    setQForm({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      difficulty: q.difficulty || "easy",
      is_active: q.is_active,
    });
    setIsAddQ(false);
    setShowQModal(true);
  };
  const handleAddQClick = () => {
    setEditQ(null);
    setQForm({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      difficulty: "easy",
      is_active: 1,
    });
    setIsAddQ(true);
    setShowQModal(true);
  };
  const handleQSave = async () => {
    setQError("");
    if (!selectedSkill) return;
    if (
      !qForm.question_text.trim() ||
      !qForm.option_a.trim() ||
      !qForm.option_b.trim() ||
      !qForm.option_c.trim() ||
      !qForm.option_d.trim()
    ) {
      setQError("All fields are required.");
      return;
    }
    try {
      if (isAddQ) {
        await adminApi.addQuestion({
          skill_id: selectedSkill.id,
          ...qForm,
        });
        setSuccessMsg("Question added successfully.");
      } else if (editQ) {
        await adminApi.updateQuestion(editQ.id, qForm);
        setSuccessMsg("Question updated successfully.");
      }
      setShowQModal(false);
      setEditQ(null);
      setQForm({
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "A",
        difficulty: "easy",
        is_active: 1,
      });
      fetchSkills();
    } catch {
      setQError("Failed to save question.");
    }
  };
  const handleDeleteQuestion = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Delete this question?")) return;
    await adminApi.deleteQuestion(id);
    fetchSkills();
  };

  return (
    <div
      className="flex flex-col md:flex-row gap-8 py-8 px-4 max-w-7xl mx-auto"
      style={{ height: "80vh" }}
    >
      <div
        className="md:w-1/3 w-full overflow-y-auto pr-2 custom-scrollbar"
        style={{ maxHeight: "100%" }}
      >
        <h2 className="text-xl font-bold mb-4">Skills</h2>
        {loading ? (
          <div className="flex justify-center">
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => (
              <Card
                key={skill.id}
                className={`p-4 cursor-pointer border-2 transition-all duration-200 ${
                  selectedSkill && selectedSkill.id === skill.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-blue-300"
                }`}
                onClick={() => setSelectedSkill(skill)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg text-blue-900">
                      {skill.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {skill.description}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(skill);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSkill(skill.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div
        className="md:w-2/3 w-full overflow-y-auto pl-2 custom-scrollbar"
        style={{ maxHeight: "100%" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Questions</h2>
          {selectedSkill && (
            <Button size="sm" variant="primary" onClick={handleAddQClick}>
              Add Question
            </Button>
          )}
        </div>
        {selectedSkill &&
        selectedSkill.questions &&
        selectedSkill.questions.length > 0 ? (
          <div className="space-y-3">
            {selectedSkill.questions.map((q, idx) => (
              <Card
                key={q.id ? q.id : `seed-${idx}`}
                className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between border shadow-sm ${
                  q.isSeedOnly
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    {q.question_text}
                    {q.isSeedOnly && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-200 text-yellow-800 border border-yellow-400 align-middle">
                        Seed Only
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D:{" "}
                    {q.option_d}
                  </div>
                  <div className="text-xs text-gray-400">
                    Correct: {q.correct_answer} | Difficulty: {q.difficulty} |
                    Active: {q.is_active ? "Yes" : "No"}
                  </div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditQClick(q)}
                    disabled={q.isSeedOnly}
                    title={
                      q.isSeedOnly
                        ? "Import to DB before editing"
                        : "Edit question"
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteQuestion(q.id)}
                    disabled={q.isSeedOnly}
                    title={
                      q.isSeedOnly ? "Import to DB before deleting" : undefined
                    }
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
      {/* Skill Edit Modal */}
      <Modal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        title="Edit Skill"
      >
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">Skill Name</label>
          <input
            className="border border-[var(--border-color)] bg-[rgba(var(--modal-bg-rgb,255,255,255),0.5)] backdrop-blur text-[var(--text-primary)] p-2 mb-2 w-full rounded-lg shadow-inner focus:ring-2 focus:ring-accent focus:border-accent theme-transition"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Skill Name"
            autoComplete="off"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="border border-[var(--border-color)] bg-[rgba(var(--modal-bg-rgb,255,255,255),0.5)] backdrop-blur text-[var(--text-primary)] p-2 mb-2 w-full rounded-lg shadow-inner focus:ring-2 focus:ring-accent focus:border-accent theme-transition"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Description"
            autoComplete="off"
          />
        </div>
        <Button onClick={handleEditSave} variant="primary">
          Save
        </Button>
      </Modal>
      {/* Question Edit/Add Modal */}
      <Modal
        isOpen={showQModal}
        onClose={() => {
          setShowQModal(false);
          setQError("");
        }}
        title={isAddQ ? "Add Question" : "Edit Question"}
      >
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            Question Text
          </label>
          <textarea
            className="border border-[var(--border-color)] bg-[rgba(var(--modal-bg-rgb,255,255,255),0.5)] backdrop-blur text-[var(--text-primary)] p-2 mb-2 w-full rounded-lg shadow-inner focus:ring-2 focus:ring-accent focus:border-accent theme-transition"
            value={qForm.question_text}
            onChange={(e) =>
              setQForm({ ...qForm, question_text: e.target.value })
            }
            placeholder="Question Text"
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium mb-1">Option A</label>
            <input
              className="border p-2 w-full rounded"
              value={qForm.option_a}
              onChange={(e) => setQForm({ ...qForm, option_a: e.target.value })}
              placeholder="Option A"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Option B</label>
            <input
              className="border p-2 w-full rounded"
              value={qForm.option_b}
              onChange={(e) => setQForm({ ...qForm, option_b: e.target.value })}
              placeholder="Option B"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Option C</label>
            <input
              className="border p-2 w-full rounded"
              value={qForm.option_c}
              onChange={(e) => setQForm({ ...qForm, option_c: e.target.value })}
              placeholder="Option C"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Option D</label>
            <input
              className="border p-2 w-full rounded"
              value={qForm.option_d}
              onChange={(e) => setQForm({ ...qForm, option_d: e.target.value })}
              placeholder="Option D"
            />
          </div>
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium mb-1">
            Correct Answer
          </label>
          <select
            className="border-2 border-[var(--accent-color)] bg-[rgba(139,92,246,0.10)] text-[var(--accent-color)] font-semibold p-3 w-full rounded-xl shadow-[0_2px_12px_rgba(139,92,246,0.10)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] theme-transition outline-none"
            value={qForm.correct_answer}
            onChange={(e) =>
              setQForm({ ...qForm, correct_answer: e.target.value })
            }
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium mb-1">Difficulty</label>
          <select
            className="border-2 border-[var(--accent-color)] bg-[rgba(139,92,246,0.10)] text-[var(--accent-color)] font-semibold p-3 w-full rounded-xl shadow-[0_2px_12px_rgba(139,92,246,0.10)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] theme-transition outline-none"
            value={qForm.difficulty}
            onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1">Active</label>
          <select
            className="border-2 border-[var(--accent-color)] bg-[rgba(139,92,246,0.10)] text-[var(--accent-color)] font-semibold p-3 w-full rounded-xl shadow-[0_2px_12px_rgba(139,92,246,0.10)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] theme-transition outline-none"
            value={qForm.is_active}
            onChange={(e) =>
              setQForm({ ...qForm, is_active: Number(e.target.value) })
            }
          >
            <option value={1}>Yes</option>
            <option value={0}>No</option>
          </select>
        </div>
        {qError && <div className="text-red-500 text-sm mb-2">{qError}</div>}
        <Button
          onClick={handleQSave}
          variant="primary"
          disabled={
            !qForm.question_text.trim() ||
            !qForm.option_a.trim() ||
            !qForm.option_b.trim() ||
            !qForm.option_c.trim() ||
            !qForm.option_d.trim()
          }
        >
          Save
        </Button>
      </Modal>
      {successMsg && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {successMsg}
          <button
            className="ml-2 text-white font-bold"
            onClick={() => setSuccessMsg("")}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminQuestions;
