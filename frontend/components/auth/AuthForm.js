"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (result.data?.token) localStorage.setItem("prep_token", result.data.token);
      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Authentication failed.");
      setLoading(false);
    }
  }

  return <main className="page form-layout"><span className="eyebrow">{isRegister ? "Make a workspace" : "Welcome back"}</span><h1>{isRegister ? "Keep your signal close." : "Pick up where you left off."}</h1><form className="form-card" onSubmit={submit}>{error && <div className="error">{error}</div>}{isRegister && <div className="field"><label htmlFor="name">Name</label><input id="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>}<div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" minLength="6" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div><div className="form-footer"><Link className="kit-meta" href={isRegister ? "/login" : "/register"}>{isRegister ? "Already have an account? Sign in" : "New here? Create an account"}</Link><button className="button coral" disabled={loading}>{loading ? "Working..." : isRegister ? "Create account" : "Sign in"}</button></div></form></main>;
}
