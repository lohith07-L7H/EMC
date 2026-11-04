import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Keep a generation request alive if the student changes EMC sections.
const STORAGE_KEY = "emc_concept_assignment_job";
let activeJob = null;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener(activeJob ? { ...activeJob, promise: undefined } : null));
}

function saveJob(job) {
  activeJob = job;
  try {
    const { promise, ...saved } = job;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // In-memory state remains available for this browser session.
  }
  notifyListeners();
}

function getSavedJob() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function subscribe(listener) {
  listeners.add(listener);
  if (activeJob) listener({ ...activeJob, promise: undefined });
  return () => listeners.delete(listener);
}

async function fetchQuestions(assignmentId) {
  const { data, error } = await supabase
    .from("concept_assignment_questions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .order("question_number", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchAssignments(topic) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Please log in again.");
  const { data, error } = await supabase
    .from("concept_assignments")
    .select("*")
    .eq("user_id", user.id)
    .eq("roadmap_topic", topic)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchLatestResult(assignmentId) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Please log in again.");
  const { data: attempts, error } = await supabase
    .from("concept_assignment_attempts")
    .select("id, attempt_number, score, total_marks, status, submitted_at")
    .eq("assignment_id", assignmentId)
    .eq("user_id", user.id)
    .order("attempt_number", { ascending: false })
    .limit(1);
  if (error) throw error;
  const attempt = attempts?.[0];
  if (!attempt || attempt.status !== "evaluated") return null;
  const { data: answers, error: answersError } = await supabase
    .from("concept_assignment_answers")
    .select("question_id, answer, is_correct, awarded_marks, feedback")
    .eq("attempt_id", attempt.id);
  if (answersError) throw answersError;
  return {
    attempt,
    results: (answers || []).map((answer) => {
      const feedback = answer.feedback || "";
      const correctMatch = feedback.match(/Correct answer: (.*?)\. (.*)$/s);
      return {
        question_id: answer.question_id,
        selected_answer: typeof answer.answer === "string" ? answer.answer : "",
        is_correct: answer.is_correct,
        awarded_marks: answer.awarded_marks,
        correct_answer: answer.is_correct ? (typeof answer.answer === "string" ? answer.answer : "") : (correctMatch?.[1] || "Not available"),
        explanation: answer.is_correct ? feedback.replace(/^Correct\.\s*/, "") : (correctMatch?.[2] || feedback),
      };
    }),
  };
}

function startGeneration({ topic, careerPath, difficulty }) {
  if (activeJob?.status === "generating" && activeJob.promise) return activeJob.promise;
  const job = {
    status: "generating",
    topic,
    difficulty,
    message: "Creating 15 multiple-choice questions...",
    assignment: null,
    error: "",
    startedAt: Date.now(),
  };
  saveJob(job);

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-concept-assignment", {
        body: { topic, careerPath: careerPath || "General", difficulty },
      });
      if (error) {
        let message = error.message || "Assignment generation failed.";
        try {
          const response = error.context;
          if (response && typeof response.json === "function") {
            const details = await response.json();
            if (details?.error) message = details.error;
          }
        } catch {
          // Keep the original message.
        }
        throw new Error(message);
      }
      if (!data?.success || !data?.assignment) throw new Error(data?.error || "The server returned an unexpected response.");
      const completed = {
        status: "completed", topic, difficulty,
        message: "Your new assignment is ready!",
        assignment: data.assignment, error: "", startedAt: job.startedAt,
        completedAt: Date.now(),
      };
      saveJob(completed);
      return completed;
    } catch (err) {
      const failed = {
        status: "failed", topic, difficulty, message: "", assignment: null,
        error: err.message || "Could not generate the assignment.",
        startedAt: job.startedAt, failedAt: Date.now(),
      };
      saveJob(failed);
      throw err;
    }
  })();

  activeJob = { ...job, promise };
  return promise;
}

export default function ConceptAssignments({ topic, careerPath }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [generatingLocal, setGeneratingLocal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [job, setJob] = useState(() => activeJob ? { ...activeJob, promise: undefined } : getSavedJob());

  useEffect(() => subscribe(setJob), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAssignments(topic);
        if (cancelled) return;
        setAssignments(data);
        if (data.length) await openAssignment(data[0], () => cancelled);
        else {
          setSelectedAssignment(null);
          setQuestions([]);
          setAnswers({});
          setResult(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load assignments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // Load again when the roadmap topic changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  useEffect(() => {
    if (job?.topic === topic && job.status === "completed" && job.assignment) {
      refreshAssignments(job.assignment).catch((err) => setError(err.message));
      setSuccess(job.message);
    } else if (job?.topic === topic && job.status === "failed") {
      setError(job.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status, job?.assignment?.id, topic]);

  async function openAssignment(assignment, isCancelled = () => false) {
    setSelectedAssignment(assignment);
    setQuestionsLoading(true);
    setError("");
    setAnswers({});
    setResult(null);
    try {
      const [loadedQuestions, latestResult] = await Promise.all([
        fetchQuestions(assignment.id),
        fetchLatestResult(assignment.id),
      ]);
      if (isCancelled()) return;
      setQuestions(loadedQuestions);
      setResult(latestResult);
      if (latestResult) {
        const previousAnswers = {};
        latestResult.results.forEach((item) => { previousAnswers[item.question_id] = item.selected_answer; });
        setAnswers(previousAnswers);
      }
    } catch (err) {
      if (!isCancelled()) setError(err.message || "Unable to load this assignment.");
    } finally {
      if (!isCancelled()) setQuestionsLoading(false);
    }
  }

  async function refreshAssignments(preferred = null) {
    const data = await fetchAssignments(topic);
    setAssignments(data);
    const target = preferred || data[0];
    if (target) await openAssignment(target);
  }

  async function generateAssignment() {
    if (generating || submitting) return;
    setError("");
    setSuccess("");
    setGeneratingLocal(true);
    try {
      const generated = await startGeneration({ topic, careerPath, difficulty });
      if (generated.assignment) {
        await refreshAssignments(generated.assignment);
        setSuccess(generated.message);
      }
    } catch (err) {
      setError(err.message || "Could not generate assignment.");
    } finally {
      setGeneratingLocal(false);
    }
  }

  async function submitAssignment() {
    if (!selectedAssignment || submitting) return;
    if (questions.length !== 15) {
      setError("This assignment does not contain 15 questions. Please generate a new assignment.");
      return;
    }
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length) {
      setError(`Please answer all 15 questions. ${unanswered.length} question(s) are still unanswered.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data, error: functionError } = await supabase.functions.invoke("submit-concept-assignment", {
        body: { assignmentId: selectedAssignment.id, answers },
      });
      if (functionError) {
        let message = functionError.message || "Could not submit your assignment.";
        try {
          const details = await functionError.context?.json?.();
          if (details?.error) message = details.error;
        } catch { /* Use the original message. */ }
        throw new Error(message);
      }
      if (!data?.success) throw new Error(data?.error || "The server could not evaluate your assignment.");
      setResult({ attempt: data.attempt, results: data.results });
      setSuccess("Assignment submitted successfully. Your result is ready!");
      await refreshAssignments(selectedAssignment);
    } catch (err) {
      setError(err.message || "Could not submit your assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  function startAnotherAttempt() {
    setAnswers({});
    setResult(null);
    setError("");
    setSuccess("");
  }

  const generating = generatingLocal || (job?.status === "generating" && job.topic === topic);
  const allMcq = questions.length === 15 && questions.every((q) => q.question_type === "mcq" && Array.isArray(q.options) && q.options.length === 4);
  const resultByQuestion = new Map((result?.results || []).map((item) => [item.question_id, item]));

  return (
    <section style={styles.container}>
      <div>
        <p style={styles.eyebrow}>CONCEPTUAL LEARNING</p>
        <h3 style={styles.heading}>AI Assignments</h3>
        <p style={styles.description}>
          Practise {topic} with AI-generated multiple-choice assignments. Generate a fresh set whenever you want.
        </p>
      </div>

      <div style={styles.generator}>
        <div style={{ flex: "1 1 220px" }}>
          <strong>Generate a new assignment</strong>
          <p style={styles.muted}>15 MCQs · 4 options each · 100 marks</p>
        </div>
        <label style={styles.label}>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={styles.select} disabled={generating}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button type="button" onClick={generateAssignment} disabled={generating || submitting} style={{ ...styles.primaryButton, opacity: generating ? 0.65 : 1 }}>
          {generating ? "Generating..." : assignments.length ? "✦ Generate Another Assignment" : "✦ Generate Assignment"}
        </button>
      </div>

      {generating && (
        <div style={styles.progress} role="status" aria-live="polite">
          <div style={styles.spinner} />
          <div>
            <strong>EMC AI is creating your MCQs</strong>
            <p style={styles.muted}>{job?.message || "Preparing 15 questions..."}</p>
            <p style={styles.muted}>You can move to another EMC section and return while this request is running. Keep this browser tab open.</p>
          </div>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {assignments.length > 0 && (
        <div style={styles.history}>
          <strong>Assignment history ({assignments.length})</strong>
          <div style={styles.historyList}>
            {assignments.map((assignment, index) => (
              <button type="button" key={assignment.id} onClick={() => openAssignment(assignment)} style={{ ...styles.historyButton, ...(selectedAssignment?.id === assignment.id ? styles.historyActive : {}) }}>
                <span>{assignment.title || `Assignment ${assignments.length - index}`}</span>
                <small>{assignment.difficulty} · {assignment.total_marks} marks · {new Date(assignment.created_at).toLocaleDateString()}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p style={styles.muted}>Loading saved assignments...</p>}

      {selectedAssignment && (
        <div style={styles.assignment}>
          <div style={styles.assignmentHeader}>
            <div>
              <p style={styles.eyebrow}>YOUR ASSIGNMENT</p>
              <h3 style={styles.heading}>{selectedAssignment.title}</h3>
              <p style={styles.description}>{selectedAssignment.description}</p>
            </div>
            <div style={styles.totalScore}><strong>100</strong><small>Total marks</small></div>
          </div>
          <p style={styles.muted}>15 questions · {selectedAssignment.difficulty} difficulty · Questions 1–10: 5 marks each · Questions 11–15: 10 marks each</p>

          {questionsLoading ? <p style={styles.muted}>Loading questions...</p> : !allMcq ? (
            <div style={styles.warning}>
              <strong>This is an older assignment format.</strong>
              <p style={styles.muted}>New assignments are MCQ-only. Generate another assignment to use the new answer and scoring experience.</p>
            </div>
          ) : (
            <>
              {questions.map((question) => {
                const questionResult = resultByQuestion.get(question.id);
                return (
                  <article style={styles.question} key={question.id}>
                    <div style={styles.questionTop}>
                      <strong>Question {question.question_number}</strong>
                      <span style={styles.marks}>{question.marks} marks</span>
                    </div>
                    <p style={styles.questionText}>{question.question}</p>
                    <div style={styles.options}>
                      {question.options.map((option, index) => {
                        const selected = answers[question.id] === option;
                        const correctOption = result && questionResult?.correct_answer === option;
                        const wrongSelected = result && selected && !questionResult?.is_correct;
                        return (
                          <label key={`${question.id}-${index}`} style={{ ...styles.option, ...(selected ? styles.optionSelected : {}), ...(correctOption ? styles.optionCorrect : {}), ...(wrongSelected ? styles.optionWrong : {}), cursor: result ? "default" : "pointer" }}>
                            <input type="radio" name={`question-${question.id}`} value={option} checked={selected} disabled={!!result || submitting} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />
                            <span><strong>{String.fromCharCode(65 + index)}.</strong> {option}</span>
                          </label>
                        );
                      })}
                    </div>
                    {result && questionResult && (
                      <div style={questionResult.is_correct ? styles.correctFeedback : styles.wrongFeedback}>
                        <strong>{questionResult.is_correct ? "Correct" : `Incorrect · Correct answer: ${questionResult.correct_answer}`}</strong>
                        <p>{questionResult.explanation}</p>
                        <small>{questionResult.awarded_marks} / {question.marks} marks</small>
                      </div>
                    )}
                  </article>
                );
              })}

              {!result ? (
                <div style={styles.submitArea}>
                  <p style={styles.muted}>{Object.keys(answers).length} of 15 questions answered</p>
                  <button type="button" onClick={submitAssignment} disabled={submitting || questions.length !== 15} style={{ ...styles.primaryButton, opacity: submitting ? 0.65 : 1 }}>
                    {submitting ? "Submitting and checking..." : "Submit Assignment"}
                  </button>
                </div>
              ) : (
                <div style={styles.resultPanel}>
                  <p style={styles.eyebrow}>ASSIGNMENT RESULT · ATTEMPT {result.attempt?.attempt_number || ""}</p>
                  <div style={styles.resultScore}>{result.attempt?.score ?? 0}<span> / 100</span></div>
                  <p>{Math.round(((result.attempt?.score || 0) / 100) * 100)}% score</p>
                  <p style={styles.muted}>Your result is saved. You can try this assignment again or generate a completely new one.</p>
                  <button type="button" onClick={startAnotherAttempt} style={styles.secondaryButton}>Try This Assignment Again</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!loading && assignments.length === 0 && !selectedAssignment && (
        <div style={styles.empty}>
          <strong>No assignments yet</strong>
          <p>Choose a difficulty and generate your first 15-question MCQ assignment.</p>
        </div>
      )}
    </section>
  );
}

const styles = {
  container: { display: "grid", gap: 20, color: "inherit" },
  eyebrow: { color: "#c9a65b", fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 8 },
  heading: { fontSize: 23, margin: "0 0 8px" },
  description: { opacity: 0.75, lineHeight: 1.6, margin: 0 },
  generator: { display: "flex", flexWrap: "wrap", alignItems: "end", gap: 16, padding: 20, border: "1px solid rgba(201,166,91,.3)", borderRadius: 14, background: "rgba(201,166,91,.06)" },
  muted: { opacity: 0.7, fontSize: 13, lineHeight: 1.5 },
  label: { display: "grid", gap: 7, fontSize: 13 },
  select: { padding: 11, borderRadius: 8, minWidth: 130, background: "#171717", color: "#fff", border: "1px solid rgba(201,166,91,.4)" },
  primaryButton: { padding: "12px 18px", border: 0, borderRadius: 8, background: "#c9a65b", color: "#17130b", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { padding: "11px 16px", border: "1px solid rgba(201,166,91,.55)", borderRadius: 8, background: "transparent", color: "inherit", fontWeight: 700, cursor: "pointer" },
  progress: { display: "flex", alignItems: "center", gap: 15, padding: 18, border: "1px solid rgba(201,166,91,.35)", borderRadius: 12, background: "rgba(201,166,91,.07)" },
  spinner: { width: 25, height: 25, flexShrink: 0, border: "3px solid rgba(201,166,91,.25)", borderTopColor: "#c9a65b", borderRadius: "50%", animation: "emc-assignment-spin 0.8s linear infinite" },
  error: { color: "#e57373", padding: 12, background: "rgba(229,115,115,.08)", borderRadius: 8 },
  success: { color: "#78d6a0", padding: 12, background: "rgba(120,214,160,.08)", borderRadius: 8 },
  history: { display: "grid", gap: 12 },
  historyList: { display: "flex", flexWrap: "wrap", gap: 10 },
  historyButton: { display: "grid", gap: 5, textAlign: "left", padding: 12, border: "1px solid rgba(201,166,91,.25)", borderRadius: 9, background: "transparent", color: "inherit", cursor: "pointer", maxWidth: "100%" },
  historyActive: { borderColor: "#c9a65b", background: "rgba(201,166,91,.1)" },
  assignment: { display: "grid", gap: 16 },
  assignmentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap" },
  totalScore: { display: "grid", textAlign: "center", padding: "12px 18px", border: "1px solid rgba(201,166,91,.35)", borderRadius: 10 },
  question: { padding: 18, marginBottom: 13, border: "1px solid rgba(201,166,91,.2)", borderRadius: 12, background: "rgba(255,255,255,.025)" },
  questionTop: { display: "flex", justifyContent: "space-between", gap: 10 },
  questionText: { lineHeight: 1.65, fontWeight: 600 },
  marks: { color: "#c9a65b", fontSize: 13 },
  options: { display: "grid", gap: 8, marginTop: 13 },
  option: { display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 12px", borderRadius: 7, background: "rgba(201,166,91,.07)", lineHeight: 1.5, border: "1px solid transparent" },
  optionSelected: { borderColor: "#c9a65b", background: "rgba(201,166,91,.15)" },
  optionCorrect: { borderColor: "#55b987", background: "rgba(85,185,135,.12)" },
  optionWrong: { borderColor: "#df7777", background: "rgba(223,119,119,.1)" },
  correctFeedback: { marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(85,185,135,.1)", color: "#8cddb1", lineHeight: 1.5 },
  wrongFeedback: { marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(223,119,119,.1)", color: "#f0a0a0", lineHeight: 1.5 },
  submitArea: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 18, border: "1px solid rgba(201,166,91,.25)", borderRadius: 12 },
  resultPanel: { display: "grid", justifyItems: "center", gap: 8, textAlign: "center", padding: 24, border: "1px solid rgba(201,166,91,.4)", borderRadius: 14, background: "rgba(201,166,91,.06)" },
  resultScore: { color: "#c9a65b", fontSize: 48, fontWeight: 900 },
  warning: { padding: 16, border: "1px solid rgba(201,166,91,.35)", borderRadius: 10 },
  empty: { textAlign: "center", padding: 30, border: "1px dashed rgba(201,166,91,.4)", borderRadius: 12 },
};
