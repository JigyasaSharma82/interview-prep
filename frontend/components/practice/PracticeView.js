"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

export default function PracticeView({ kitId }) {
  const [practice, setPractice] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest(`/api/kits/${kitId}/practice`)
      .then((result) => setPractice(result.data))
      .catch((requestError) => setError(requestError.message));
  }, [kitId]);

  const saveConfidence = async (confidence) => {
    const item = practice.items[index];
    setSaving(true);

    try {
      await apiRequest(`/api/kits/${kitId}/practice/${item.item_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidence }),
      });

      const items = practice.items.map((entry) =>
        entry.item_id === item.item_id ? { ...entry, confidence } : entry
      );
      setPractice({
        ...practice,
        items,
        weak_spots: items.filter((entry) => entry.confidence !== 3).slice(0, 5),
      });
      setRevealed(false);
      setIndex((value) => Math.min(value + 1, items.length - 1));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <main className="page"><div className="error">{error}</div><Link className="button secondary" href={`/kits/${kitId}`}>Back to kit</Link></main>;
  if (!practice) return <main className="page"><p className="mono">Loading practice...</p></main>;
  const item = practice.items[index];
  if (!item) return <main className="page"><h1>Nothing queued yet.</h1><Link className="button secondary" href={`/kits/${kitId}`}>Back to kit</Link></main>;

  return <main className="page"><div className="kit-hero"><div><span className="eyebrow">Practice mode · {index + 1} / {practice.items.length}</span><h1>Think first. Then reveal.</h1></div><Link className="button secondary" href={`/kits/${kitId}`}>Exit practice</Link></div><section className="form-card" style={{ marginTop: 28 }}><span className="mono">{item.item_type} · {item.category} · difficulty {item.difficulty || "n/a"}/3</span><p className="kit-meta">Requirement: {item.requirement?.text || "Unmapped"}</p><p className="kit-meta">Priority: {item.requirement?.priority === "must" ? "Must Have" : "Nice to Have"}</p><p className="kit-meta">Coverage: {item.covered ? "Covered" : "Uncovered"}</p><h2 style={{ fontSize: 40, margin: "24px 0 34px" }}>{item.prompt}</h2>{revealed && <div className="content-panel"><span className="eyebrow">Answer outline</span><p style={{ lineHeight: 1.6, marginTop: 12 }}>{item.answer}</p></div>}<div className="actions"><button className="button coral" onClick={() => setRevealed((value) => !value)}>{revealed ? "Hide outline" : "Reveal outline"}</button></div><p className="kit-meta">Confidence</p><div className="actions"><button className="button secondary" disabled={saving || !revealed} onClick={() => saveConfidence(1)}>Low</button><button className="button secondary" disabled={saving || !revealed} onClick={() => saveConfidence(2)}>Medium</button><button className="button secondary" disabled={saving || !revealed} onClick={() => saveConfidence(3)}>High</button></div></section><section className="content-panel" style={{ marginTop: 24 }}><h2>Weak Spots</h2>{practice.weak_spots.length === 0 ? <p>None yet.</p> : practice.weak_spots.map((weakSpot) => <p className="kit-meta" key={weakSpot.item_id}>{weakSpot.requirement?.text || weakSpot.item_id} — {weakSpot.confidence === 1 ? "Low" : weakSpot.confidence === 2 ? "Medium" : "Unrated"}</p>)}</section></main>;
}
