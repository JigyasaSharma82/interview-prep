"use client";

import { useState } from "react";
import { apiRequest } from "../../lib/api";

const categories = ["technical", "behavioral", "system-design", "company-fit"];

const editedState = (item, pinned = item.content_state?.is_pinned) => ({
  ...(item.content_state || {}),
  origin: item.content_state?.origin === "handwritten" ? "handwritten" : "edited",
  is_pinned: Boolean(pinned),
});

export default function KitEditor({ kit, onSaved }) {
  const [draft, setDraft] = useState(kit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const updateQuestion = (id, field, value) => update("questions", draft.questions.map((question) => question.id === id ? { ...question, [field]: value, content_state: editedState(question) } : question));
  const updateFlashcard = (id, field, value) => update("flashcards", draft.flashcards.map((card) => card.id === id ? { ...card, [field]: value, content_state: editedState(card) } : card));

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

  const addQuestion = () => {
    const nextNumber = draft.questions.length + 1;
    update("questions", [...draft.questions, {
      id: `q${Date.now()}`,
      requirement_ids: draft.role.requirements[0] ? [draft.role.requirements[0].id] : [],
      category: "technical",
      prompt: "",
      answer_outline: "",
      difficulty: 1,
      content_state: { origin: "handwritten", is_pinned: true },
      _label: `New question ${nextNumber}`,
    }]);
  };

  const addFlashcard = () => update("flashcards", [...draft.flashcards, {
    id: `f${Date.now()}`,
    front: "",
    back: "",
    requirement_ids: draft.role.requirements[0] ? [draft.role.requirements[0].id] : [],
    content_state: { origin: "handwritten", is_pinned: true },
  }]);

  const moveQuestion = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.questions.length) return;
    const questions = [...draft.questions];
    [questions[index], questions[nextIndex]] = [questions[nextIndex], questions[index]];
    update("questions", questions);
  };

  const togglePin = (item, collection, setter) => {
    setter(collection.map((entry) => entry.id === item.id ? { ...entry, content_state: editedState(entry, !entry.content_state?.is_pinned) } : entry));
  };

  return <section className="content-panel" style={{ marginTop: 24 }}>
    <div className="section-heading"><h2>Builder</h2><button className="button coral" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save changes"}</button></div>
    {error && <div className="error">{error}</div>}
    {notice && <p className="kit-meta">{notice}</p>}
    <h3>Company brief</h3>
    <textarea value={draft.company_brief.summary} onChange={(event) => update("company_brief", { ...draft.company_brief, summary: event.target.value, content_state: editedState(draft.company_brief) })} />
    <textarea value={draft.company_brief.what_they_do} onChange={(event) => update("company_brief", { ...draft.company_brief, what_they_do: event.target.value, content_state: editedState(draft.company_brief) })} />
    <textarea value={draft.company_brief.interview_process || ""} onChange={(event) => update("company_brief", { ...draft.company_brief, interview_process: event.target.value, content_state: editedState(draft.company_brief) })} />

    <div className="section-heading"><h3>Questions</h3><button className="button secondary" onClick={addQuestion}>Add question</button></div>
    {draft.questions.map((question, index) => <article className="question" key={question.id}>
      <div className="actions"><button className="button secondary" onClick={() => moveQuestion(index, -1)}>Up</button><button className="button secondary" onClick={() => moveQuestion(index, 1)}>Down</button><button className="button secondary" onClick={() => togglePin(question, draft.questions, (value) => update("questions", value))}>{question.content_state?.is_pinned ? "Unpin" : "Pin"}</button><button className="button secondary" onClick={() => update("questions", draft.questions.filter((entry) => entry.id !== question.id))}>Delete</button></div>
      <select value={question.category} onChange={(event) => updateQuestion(question.id, "category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
      <input value={question.difficulty} type="number" min="1" max="3" onChange={(event) => updateQuestion(question.id, "difficulty", Number(event.target.value))} />
      <textarea value={question.prompt} onChange={(event) => updateQuestion(question.id, "prompt", event.target.value)} placeholder="Question" />
      <textarea value={question.answer_outline} onChange={(event) => updateQuestion(question.id, "answer_outline", event.target.value)} placeholder="Answer outline" />
    </article>)}

    <div className="section-heading"><h3>Flashcards</h3><button className="button secondary" onClick={addFlashcard}>Add flashcard</button></div>
    {draft.flashcards.map((card) => <article className="question" key={card.id}>
      <div className="actions"><button className="button secondary" onClick={() => togglePin(card, draft.flashcards, (value) => update("flashcards", value))}>{card.content_state?.is_pinned ? "Unpin" : "Pin"}</button><button className="button secondary" onClick={() => update("flashcards", draft.flashcards.filter((entry) => entry.id !== card.id))}>Delete</button></div>
      <textarea value={card.front} onChange={(event) => updateFlashcard(card.id, "front", event.target.value)} placeholder="Front" />
      <textarea value={card.back} onChange={(event) => updateFlashcard(card.id, "back", event.target.value)} placeholder="Back" />
    </article>)}
  </section>;
}
