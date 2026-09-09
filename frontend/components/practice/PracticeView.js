"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

export default function PracticeView({ kitId }) {
  const [kit, setKit] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    apiRequest(`/api/kits/${kitId}`).then((result) => setKit(result.data)).catch(() => setKit({ questions: [] }));
  }, [kitId]);

  if (!kit) return <main className="page"><p className="mono">Loading practice...</p></main>;
  const questions = kit.questions || [];
  const question = questions[index];
  if (!question) return <main className="page"><h1>Nothing queued yet.</h1><Link className="button secondary" href={`/kits/${kitId}`}>Back to kit</Link></main>;

  return <main className="page"><div className="kit-hero"><div><span className="eyebrow">Practice mode · {index + 1} / {questions.length}</span><h1>Think first. Then reveal.</h1></div><Link className="button secondary" href={`/kits/${kitId}`}>Exit practice</Link></div><section className="form-card" style={{ marginTop: 28 }}><span className="mono">{question.category} · difficulty {question.difficulty}/3</span><h2 style={{ fontSize: 40, margin: "24px 0 34px" }}>{question.prompt}</h2>{revealed && <div className="content-panel"><span className="eyebrow">Answer outline</span><p style={{ lineHeight: 1.6, marginTop: 12 }}>{question.answer_outline}</p></div>}<div className="actions"><button className="button coral" onClick={() => setRevealed((value) => !value)}>{revealed ? "Hide outline" : "Reveal outline"}</button>{index < questions.length - 1 && <button className="button secondary" onClick={() => { setIndex((value) => value + 1); setRevealed(false); }}>Next question</button>}</div></section></main>;
}
