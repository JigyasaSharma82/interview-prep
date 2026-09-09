"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const demoKits = [
  { _id: "demo-1", source: { role: "Platform Engineer", company: "Northstar" }, generation_status: "completed", questions: Array(18), schedule: { days_available: 7 } },
  { _id: "demo-2", source: { role: "Product Analyst", company: "Fieldnote" }, generation_status: "generating", questions: [], schedule: { days_available: 5 } },
];

export default function DashboardView() {
  const [kits, setKits] = useState(demoKits);
  const [notice, setNotice] = useState("Showing a local preview. Connect the API to load your kits.");

  useEffect(() => {
    let active = true;
    apiRequest("/api/kits")
      .then((result) => {
        if (active && Array.isArray(result.data)) {
          setKits(result.data);
          setNotice("");
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const completed = kits.filter((kit) => kit.generation_status === "completed").length;
  const questions = kits.reduce((total, kit) => total + (kit.questions?.length || 0), 0);

  return (
    <main className="page">
      <div className="dashboard-header">
        <div><span className="eyebrow">Your workspace</span><h1>Ready when you are.</h1></div>
        <Link className="button coral" href="/kits/new">+ New prep kit</Link>
      </div>
      {notice && <p className="mono" style={{ marginBottom: 24 }}>{notice}</p>}
      <section className="dashboard-grid" aria-label="Preparation summary">
        <div className="stat"><span className="stat-label">Kits built</span><strong className="stat-value">{kits.length}</strong></div>
        <div className="stat"><span className="stat-label">Ready to practice</span><strong className="stat-value">{completed}</strong></div>
        <div className="stat"><span className="stat-label">Questions in rotation</span><strong className="stat-value">{questions || "--"}</strong></div>
      </section>
      <section>
        <div className="section-heading"><h2>Recent kits</h2><span className="mono">{kits.length} total</span></div>
        <div className="kit-list">
          {kits.map((kit) => {
            const status = kit.generation_status || "completed";
            return (
              <Link className="kit-item" href={`/kits/${kit._id}`} key={kit._id}>
                <div>
                  <h3>{kit.source?.role || "Untitled role"}</h3>
                  <p className="kit-meta">{kit.source?.company || "Company research"} · {kit.schedule?.days_available || "-"} day plan</p>
                </div>
                <span className={`pill ${status === "generating" ? "pending" : status === "failed" ? "failed" : ""}`}>{status}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
