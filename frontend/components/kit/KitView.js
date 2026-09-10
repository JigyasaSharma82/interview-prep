"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

export default function KitView({ kitId }) {
  const [kit, setKit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      console.log("KIT STATUS POLL STARTED", kitId);

      try {
        const result = await apiRequest(`/api/kits/${kitId}`);
        const nextKit = result.data;

        console.log("KIT STATUS RESPONSE", nextKit);
        console.log("KIT GENERATION STAGE", nextKit?.generation_stage);
        console.log("KIT GENERATION STATUS", nextKit?.generation_status);
        console.log("KIT GENERATION ERROR", nextKit?.generation_error);

        if (!active) return;

        setKit(nextKit);
        setError("");

        if (nextKit?.generation_status === "generating") {
          timer = setTimeout(load, 2000);
        }
      } catch (requestError) {
        console.error("KIT STATUS POLL FAILED", requestError);
        if (active) {
          setError(requestError.message || "Could not load this kit.");
        }
      }
    };

    load();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [kitId]);

  if (error) return <main className="page"><div className="error">{error}</div><Link className="button secondary" href="/dashboard">Back to dashboard</Link></main>;
  if (!kit) return <main className="page"><p className="mono">Loading kit...</p></main>;

  const status = kit.generation_status || "completed";
  const requirements = kit.role?.requirements || [];
  const requirementById = new Map(
    requirements.map((requirement) => [requirement.id, requirement])
  );
  return (
    <main className="page">
      <div className="kit-hero"><div><span className="eyebrow">Preparation kit</span><h1>{kit.source?.role || "Your interview kit"}</h1><p className="kit-meta">{kit.source?.company || kit.source?.company_url}</p></div><span className={`pill ${status === "generating" ? "pending" : status === "failed" ? "failed" : ""}`}>{status}</span></div>
      {status === "generating" && <div className="content-panel" style={{ marginTop: 24 }}><h3>Your kit is taking shape.</h3><p className="kit-meta">Current stage: {kit.generation_stage || "queued"}. This page will refresh automatically.</p></div>}
      {status === "failed" && <div className="error" style={{ marginTop: 24 }}><h3>Kit generation failed</h3><p>Stage: {kit.generation_stage || "unknown"}</p><p>Error: {kit.generation_error || "Generation failed."}</p><p>Kit ID: {kit._id || kitId}</p></div>}
      {status === "completed" && <div className="kit-content"><section className="content-panel"><div className="section-heading"><h2>Requirements</h2><Link className="button secondary" href={`/kits/${kitId}/practice`}>Practice now</Link></div><div className="question-list">{requirements.map((requirement) => <article className="question" key={requirement.id}><span className="mono">{requirement.kind} · {requirement.priority === "must" ? "Must Have" : "Nice to Have"}</span><h3>{requirement.text}</h3></article>)}</div><div className="section-heading"><h2>Question bank</h2></div><div className="question-list">{(kit.questions || []).map((question) => { const requirement = requirementById.get(question.requirement_ids?.[0]); return <article className="question" key={question.id}><span className="mono">{question.id} · {question.category} · {requirement?.priority === "must" ? "Must Have" : "Nice to Have"}</span><h3>{question.prompt}</h3><p>{question.answer_outline}</p></article>; })}</div></section><aside className="side-stack"><div className="content-panel"><span className="eyebrow">Company brief</span><h3>{kit.company_brief?.summary || "Research complete"}</h3><p className="kit-meta">{kit.company_brief?.what_they_do}</p></div><div className="content-panel"><span className="eyebrow">Schedule</span><h3>{kit.schedule?.days_available} focused days</h3><p className="kit-meta">{kit.flashcards?.length || 0} flashcards · {kit.questions?.length || 0} questions</p></div></aside></div>}
    </main>
  );
}
