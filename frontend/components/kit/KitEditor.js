"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const categories = ["technical", "behavioral", "system-design", "company-fit"];
const label = (category) =>
  category
    .replace("system-design", "System design")
    .replace("company-fit", "Company fit");

const markEdited = (item, pinned = item.content_state?.is_pinned) => ({
  ...item,
  content_state: {
    ...(item.content_state || {}),
    origin:
      item.content_state?.origin === "handwritten" ? "handwritten" : "edited",
    is_pinned: Boolean(pinned),
  },
});

export default function KitEditor({ kit, onSaved }) {
  const [draft, setDraft] = useState(kit);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [operation, setOperation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setDraft(kit);
  }, [kit._id, kit.updatedAt]);

  useEffect(() => {
    console.log(
      "[REGENERATE UI] rendered question count:",
      draft.questions?.length || 0,
    );
  }, [draft.questions]);

  const requirements = draft.role?.requirements || [];
  const requirementById = new Map(
    requirements.map((requirement) => [requirement.id, requirement]),
  );
  const visibleQuestions = useMemo(
    () =>
      filter === "all"
        ? draft.questions
        : draft.questions.filter((question) => question.category === filter),
    [draft.questions, filter],
  );

  const setField = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const updateQuestion = (id, field, value) =>
    setField(
      "questions",
      draft.questions.map((question) =>
        question.id === id
          ? markEdited({ ...question, [field]: value })
          : question,
      ),
    );
  const updateBrief = (field, value) =>
    setField(
      "company_brief",
      markEdited({ ...draft.company_brief, [field]: value }),
    );

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/api/kits/${kit._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_brief: draft.company_brief,
          questions: draft.questions,
          flashcards: draft.flashcards,
          role: draft.role,
          schedule: draft.schedule,
        }),
      });
      setDraft(result.data);
      onSaved(result.data);
      setNotice("Changes saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const runOperation = async (name, path) => {
    const isQuestionRegeneration = path.startsWith("/regenerate/questions/");
    const category = path.split("/").pop();
    const questionsBefore = draft.questions || [];
    if (isQuestionRegeneration) {
      console.log("[REGENERATE UI] clicked category:", category);
      console.log("[REGENERATE UI] questions before:", questionsBefore);
    }
    setOperation(name);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/api/kits/${kit._id}${path}`, {
        method: "POST",
      });
      if (isQuestionRegeneration) {
        console.log("[REGENERATE UI] API response:", result);
      }

      let updatedKit = result.data;
      if (!updatedKit?.questions) {
        const latest = await apiRequest(`/api/kits/${kit._id}`);
        updatedKit = latest.data;
      }

      if (isQuestionRegeneration) {
        console.log(
          "[REGENERATE UI] questions after:",
          updatedKit?.questions || [],
        );
        console.log("[REGENERATE UI] updating kit state");
      }
      setDraft(updatedKit);
      onSaved(updatedKit);
      setNotice(`${name} completed.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setOperation("");
    }
  };

  const addQuestion = () => {
    const requirement = requirements[0];
    if (!requirement) {
      setError("Add a requirement before creating a question.");
      return;
    }
    setField("questions", [
      ...draft.questions,
      {
        id: `q${Date.now()}`,
        requirement_ids: [requirement.id],
        category: filter === "all" ? "technical" : filter,
        prompt: "",
        answer_outline: "",
        difficulty: 1,
        content_state: { origin: "handwritten", is_pinned: false },
      },
    ]);
  };

  const moveQuestion = (id, direction) => {
    const index = draft.questions.findIndex((question) => question.id === id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.questions.length) return;
    const questions = [...draft.questions];
    [questions[index], questions[nextIndex]] = [
      questions[nextIndex],
      questions[index],
    ];
    setField("questions", questions);
  };

  const addFlashcard = () => {
    const requirement = requirements[0];
    if (!requirement) {
      setError("Add a requirement before creating a flashcard.");
      return;
    }
    setField("flashcards", [
      ...draft.flashcards,
      {
        id: `f${Date.now()}`,
        front: "",
        back: "",
        requirement_ids: [requirement.id],
        content_state: { origin: "handwritten", is_pinned: false },
      },
    ]);
  };

  return (
    <section className="builder-dashboard">
      <div className="builder-toolbar">
        <div>
          <span className="eyebrow">Builder</span>
          <h2>Shape your interview kit</h2>
          <p className="kit-meta">
            Edits stay protected from category regeneration.
          </p>
        </div>
        <button className="button coral" disabled={saving} onClick={save}>
          {saving ? "Saving changes..." : "Save changes"}
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="builder-notice" role="status">
          {notice}
        </div>
      )}

      <section className="builder-card">
        <div className="builder-card-header">
          <div>
            <span className="eyebrow">Company brief</span>
            <h3>Know the room</h3>
          </div>
        </div>
        <label className="builder-field">
          Summary
          <textarea
            value={draft.company_brief?.summary || ""}
            onChange={(event) => updateBrief("summary", event.target.value)}
          />
        </label>
        <label className="builder-field">
          What they do
          <textarea
            value={draft.company_brief?.what_they_do || ""}
            onChange={(event) =>
              updateBrief("what_they_do", event.target.value)
            }
          />
        </label>
        <label className="builder-field">
          Interview process
          <textarea
            value={draft.company_brief?.interview_process || ""}
            onChange={(event) =>
              updateBrief("interview_process", event.target.value)
            }
          />
        </label>
        <div className="source-list">
          <strong>Sources</strong>
          {(draft.company_brief?.sources || []).map((source) => (
            <a href={source} target="_blank" rel="noreferrer" key={source}>
              {source}
            </a>
          ))}
        </div>
      </section>

      <section className="builder-card">
        <div className="builder-card-header">
          <div>
            <span className="eyebrow">Question bank</span>
            <h3>Practice what matters</h3>
          </div>
          <button className="button coral" onClick={addQuestion}>
            Add question
          </button>
        </div>
        <div className="builder-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              className={filter === category ? "active" : ""}
              key={category}
              onClick={() => setFilter(category)}
            >
              {label(category)}
            </button>
          ))}
        </div>
        <div className="regen-row">
          {categories.map((category) => (
            <button
              className="button secondary"
              disabled={Boolean(operation)}
              key={category}
              onClick={() =>
                runOperation(
                  `Regenerate ${label(category)}`,
                  `/regenerate/questions/${category}`,
                )
              }
            >
              {operation === `Regenerate ${label(category)}`
                ? "Regenerating..."
                : `Regenerate ${label(category)}`}
            </button>
          ))}
        </div>
        <div className="builder-list">
          {visibleQuestions.length === 0 && (
            <p className="empty">No questions in this category yet.</p>
          )}
          {visibleQuestions.map((question, visibleIndex) => {
            const requirement = requirementById.get(
              question.requirement_ids?.[0],
            );
            const state = question.content_state || {};
            return (
              <article className="builder-question" key={question.id}>
                <div className="question-heading">
                  <div>
                    <span className="mono">
                      {question.id} · Question{" "}
                      {draft.questions.findIndex(
                        (entry) => entry.id === question.id,
                      ) + 1}
                    </span>
                    <div className="state-row">
                      <span className="state-badge">
                        {label(question.category)}
                      </span>
                      <span className="state-badge">
                        Difficulty {question.difficulty}/3
                      </span>
                      <span
                        className={`state-badge ${state.origin !== "generated" ? "state-edited" : ""}`}
                      >
                        {state.origin || "generated"}
                      </span>
                      {state.is_pinned && (
                        <span className="state-badge state-pinned">Pinned</span>
                      )}
                    </div>
                  </div>
                  <div className="question-actions">
                    <button
                      className="button secondary"
                      onClick={() => moveQuestion(question.id, -1)}
                      aria-label={`Move ${question.id} up`}
                    >
                      Move up
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => moveQuestion(question.id, 1)}
                      aria-label={`Move ${question.id} down`}
                    >
                      Move down
                    </button>
                    <button
                      className="button secondary"
                      onClick={() =>
                        setField(
                          "questions",
                          draft.questions.map((entry) =>
                            entry.id === question.id
                              ? markEdited(
                                  entry,
                                  !entry.content_state?.is_pinned,
                                )
                              : entry,
                          ),
                        )
                      }
                    >
                      {state.is_pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      className="button danger"
                      onClick={() =>
                        setField(
                          "questions",
                          draft.questions.filter(
                            (entry) => entry.id !== question.id,
                          ),
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="kit-meta">
                  Requirement:{" "}
                  {requirement?.text ||
                    question.requirement_ids?.join(", ") ||
                    "None"}{" "}
                  ·{" "}
                  {requirement?.priority === "must"
                    ? "Must Have"
                    : "Nice to Have"}
                </p>
                <label className="builder-field">
                  Category
                  <select
                    value={question.category}
                    onChange={(event) =>
                      updateQuestion(
                        question.id,
                        "category",
                        event.target.value,
                      )
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {label(category)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="builder-field">
                  Difficulty
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={question.difficulty}
                    onChange={(event) =>
                      updateQuestion(
                        question.id,
                        "difficulty",
                        Number(event.target.value),
                      )
                    }
                  />
                </label>
                <label className="builder-field">
                  Question
                  <textarea
                    className="question-textarea"
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(question.id, "prompt", event.target.value)
                    }
                  />
                </label>
                <label className="builder-field">
                  Answer outline
                  <textarea
                    className="answer-textarea"
                    value={question.answer_outline}
                    onChange={(event) =>
                      updateQuestion(
                        question.id,
                        "answer_outline",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </article>
            );
          })}
        </div>
      </section>

      <section className="builder-card">
        <div className="builder-card-header">
          <div>
            <span className="eyebrow">Schedule</span>
            <h3>Suggested runway</h3>
          </div>
          <button
            className="button secondary"
            disabled={Boolean(operation)}
            onClick={() =>
              runOperation("Schedule regeneration", "/regenerate/schedule")
            }
          >
            {operation === "Schedule regeneration"
              ? "Regenerating..."
              : "Regenerate schedule"}
          </button>
        </div>
        <div className="schedule-grid">
          {(draft.schedule?.days || []).map((day) => (
            <article className="day-card" key={day.day}>
              <span className="mono">Day {day.day}</span>
              <h4>{day.focus}</h4>
              <p>{day.minutes} minutes</p>
              <p className="kit-meta">
                Questions: {day.question_ids.join(", ") || "None"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="builder-card">
        <div className="builder-card-header">
          <div>
            <span className="eyebrow">Flashcards</span>
            <h3>Quick recall</h3>
          </div>
          <button className="button secondary" onClick={addFlashcard}>
            Add flashcard
          </button>
        </div>
        <div className="flashcard-grid">
          {(draft.flashcards || []).map((card) => (
            <article className="builder-question" key={card.id}>
              <div className="question-actions">
                <button
                  className="button danger"
                  onClick={() =>
                    setField(
                      "flashcards",
                      draft.flashcards.filter((entry) => entry.id !== card.id),
                    )
                  }
                >
                  Delete
                </button>
              </div>
              <label className="builder-field">
                Front
                <textarea
                  value={card.front}
                  onChange={(event) =>
                    setField(
                      "flashcards",
                      draft.flashcards.map((entry) =>
                        entry.id === card.id
                          ? markEdited({ ...entry, front: event.target.value })
                          : entry,
                      ),
                    )
                  }
                />
              </label>
              <label className="builder-field">
                Back
                <textarea
                  value={card.back}
                  onChange={(event) =>
                    setField(
                      "flashcards",
                      draft.flashcards.map((entry) =>
                        entry.id === card.id
                          ? markEdited({ ...entry, back: event.target.value })
                          : entry,
                      ),
                    )
                  }
                />
              </label>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
