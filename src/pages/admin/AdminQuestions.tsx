import React, { useEffect, useState } from "react";
import "./admin-questions-scrollbar.css";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { useToast } from "../../contexts/ToastContext";
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
  const { showSuccess, showError } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [questionSearchTerm, setQuestionSearchTerm] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
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

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await skillsApi.getAllSkillsWithQuestions();
      setSkills(res.data.data);
      setFilteredSkills(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedSkill(res.data.data[0]);
        setFilteredQuestions(res.data.data[0].questions || []);
      } else {
        setSelectedSkill(null);
        setFilteredQuestions([]);
      }
    } catch {
      const errorMsg = "Failed to load skills";
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredSkills(skills);
      return;
    }
    
    const filtered = skills.filter(skill => 
      skill.name?.toLowerCase().includes(term.toLowerCase()) ||
      skill.description?.toLowerCase().includes(term.toLowerCase()) ||
      (skill as any).category?.toLowerCase()?.includes(term.toLowerCase())
    );
    setFilteredSkills(filtered);
  };

  const handleQuestionSearch = (term: string) => {
    setQuestionSearchTerm(term);
    if (!selectedSkill?.questions) {
      setFilteredQuestions([]);
      return;
    }
    
    if (!term.trim()) {
      setFilteredQuestions(selectedSkill.questions);
      return;
    }
    
    const filtered = selectedSkill.questions.filter(question => 
      question.question_text?.toLowerCase().includes(term.toLowerCase()) ||
      question.option_a?.toLowerCase().includes(term.toLowerCase()) ||
      question.option_b?.toLowerCase().includes(term.toLowerCase()) ||
      question.option_c?.toLowerCase().includes(term.toLowerCase()) ||
      question.option_d?.toLowerCase().includes(term.toLowerCase()) ||
      question.difficulty?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredQuestions(filtered);
  };

  const handleEditClick = (skill: Skill) => {
    setEditSkill(skill);
    setEditForm({ name: skill.name, description: skill.description });
    setShowSkillModal(true);
  };
  
  const handleEditSave = async () => {
    if (!editSkill) return;
    try {
      await skillsApi.updateSkill(editSkill.id, editForm);
      showSuccess(`Skill "${editForm.name}" updated successfully!`);
      setShowSkillModal(false);
      setEditSkill(null);
      fetchSkills();
    } catch {
      showError("Failed to update skill");
    }
  };
  
  const handleDeleteSkill = async (id: number) => {
    if (!window.confirm("Delete this skill and all its questions?")) return;
    try {
      await skillsApi.deleteSkill(id);
      showSuccess("Skill deleted successfully!");
      setSelectedSkill(null);
      fetchSkills();
    } catch {
      showError("Failed to delete skill");
    }
  };

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
      const errorMsg = "All fields are required.";
      showError(errorMsg);
      setQError(errorMsg);
      return;
    }
    try {
      if (isAddQ) {
        await adminApi.addQuestion({
          skill_id: selectedSkill.id,
          ...qForm,
        });
        showSuccess("Question added successfully!");
        setSuccessMsg("Question added successfully.");
      } else if (editQ) {
        await adminApi.updateQuestion(editQ.id, qForm);
        showSuccess("Question updated successfully!");
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
      const errorMsg = "Failed to save question.";
      showError(errorMsg);
      setQError(errorMsg);
    }
  };
  
  const handleDeleteQuestion = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Delete this question?")) return;
    try {
      await adminApi.deleteQuestion(id);
      showSuccess("Question deleted successfully!");
      fetchSkills();
    } catch {
      showError("Failed to delete question");
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row gap-8 py-8 px-4 max-w-full mx-auto"
      style={{ height: "90vh" }}
    >
      <div
        className="md:w-1/3 w-full overflow-y-auto pr-2 custom-scrollbar md:max-h-full max-h-[50vh]"
      >
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-xl font-bold">Skills</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search skills by name, description, or category..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 shadow-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center">
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="space-y-3">
            {filteredSkills.map((skill) => (
              <Card
                key={skill.id}
                className={`p-4 cursor-pointer border-2 transition-all duration-200 ${
                  selectedSkill && selectedSkill.id === skill.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-blue-300"
                }`}
                onClick={() => {
                  setSelectedSkill(skill);
                  setQuestionSearchTerm("");
                  setFilteredQuestions(skill.questions || []);
                }}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-blue-900 break-words">
                      {skill.name}
                    </div>
                    <div className="text-xs text-gray-500 break-words">
                      {skill.description}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end md:justify-start flex-shrink-0">
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
        className="md:w-2/3 w-full overflow-y-auto pl-2 custom-scrollbar md:max-h-full max-h-[50vh]"
      >
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-xl font-bold">Questions</h2>
            {selectedSkill && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleAddQClick}
                className="w-full md:w-auto"
              >
                Add Question
              </Button>
            )}
          </div>
          {selectedSkill && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions by text, options, or difficulty..."
                value={questionSearchTerm}
                onChange={(e) => handleQuestionSearch(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 shadow-lg"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
        </div>
        {selectedSkill && filteredQuestions.length > 0 ? (
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => (
              <Card
                key={q.id ? q.id : `seed-${idx}`}
                className={`p-4 border shadow-sm ${
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
                <div className="flex gap-2 mt-3 justify-start">
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
        ) : selectedSkill && questionSearchTerm ? (
          <div className="text-center py-8 text-gray-500">
            No questions found matching "{questionSearchTerm}"
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
      

    </div>
  );
};

export default AdminQuestions;