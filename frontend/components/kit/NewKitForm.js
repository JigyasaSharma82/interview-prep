"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

export default function NewKitForm() {
  const router = useRouter();
  const [form, setForm] = useState({ jd: "", company_url: "", days: 7 });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await apiRequest("/api/kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, days: Number(form.days) }),
      });
      router.push(`/kits/${result.data._id}`);
    } catch (requestError) {
      setError(requestError.message || "Could not start kit generation.");
      setSubmitting(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      {error && <div className="error">{error}</div>}
      <div className="field"><label htmlFor="company_url">Company website</label><input id="company_url" type="url" placeholder="https://company.com" required value={form.company_url} onChange={update("company_url")} /><small>We&apos;ll use public pages to build a useful company brief.</small></div>
      <div className="field"><label htmlFor="days">Days until interview</label><input id="days" type="number" min="1" max="60" required value={form.days} onChange={update("days")} /></div>
      <div className="field"><label htmlFor="jd">Job description</label><textarea id="jd" placeholder="Paste the full job description here..." required value={form.jd} onChange={update("jd")} /><small>The sharper the source material, the sharper the practice set.</small></div>
      <div className="form-footer"><span className="mono">Usually takes a few minutes</span><button className="button coral" disabled={submitting}>{submitting ? "Building kit..." : "Build my kit"}</button></div>
    </form>
  );
}
