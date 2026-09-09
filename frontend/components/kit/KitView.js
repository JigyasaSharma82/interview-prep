"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

export default function KitView({ kitId }) {
  const [kit, setKit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => apiRequest(`/api/kits/${kitId}`).then((result) => {
      if (active) setKit(result.data);
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Could not load this kit.");
    });
    load();
    const timer = setInterval(() => {
      if (kit?.generation_status === "generating") load();
    }, 4000);
    return () => { active = false; clearInterval(timer); };
  }, [kitId, kit?.generation_status]);

  if (error) return <main className="page"><div className="error">{error}</div><Link className="button secondary" href="/dashboard">Back to dashboard</Link></main>;
  if (!kit) return <main className="page"><p className="mono">Loading kit...</p></main>;

  const status = kit.generation_status || "completed";
  return (
    <main className="page">
      <div className="kit-hero"><div><span className="eyebrow">Preparation kit</span><h1>{kit.source?.role || "Your interview kit"}</h1><p className="kit-meta">{kit.source?.company || kit.source?.company_url}</p></div><span className={`pill ${status === "generating" ? "pending" : status === "failed" ? "failed" : ""}`}>{status}</span></div>
      {status === "generating" && <div className="content-panel" style={{ marginTop: 24 }}><h3>Your kit is taking shape.</h3><p className="kit-meta">Current stage: {kit.generation_stage || "queued"}. This page will refresh automatically.</p></div>}
      {status === "failed" && <div className="error" style={{ marginTop: 24 }}>{kit.generation_error || "Generation failed."}</div>}
      {status === "completed" && <div className="kit-content"><section className="content-panel"><div className="section-heading"><h2>Question bank</h2><Link className="button secondary" href={`/kits/${kitId}/practice`}>Practice now</Link></div><div className="question-list">{(kit.questions || []).map((question) => <article className="question" key={question.id}><span className="mono">{question.id} · {question.category}</span><h3>{question.prompt}</h3><p>{question.answer_outline}</p></article>)}</div></section><aside className="side-stack"><div className="content-panel"><span className="eyebrow">Company brief</span><h3>{kit.company_brief?.summary || "Research complete"}</h3><p className="kit-meta">{kit.company_brief?.what_they_do}</p></div><div className="content-panel"><span className="eyebrow">Schedule</span><h3>{kit.schedule?.days_available} focused days</h3><p className="kit-meta">{kit.flashcards?.length || 0} flashcards · {kit.questions?.length || 0} questions</p></div></aside></div>}
    </main>
  );
}
