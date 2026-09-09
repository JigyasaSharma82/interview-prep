import Link from "next/link";
import AppShell from "../components/ui/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <main className="page hero">
        <section>
          <span className="eyebrow">Interview preparation, with signal</span>
          <h1>Turn a job description into a sharper next move.</h1>
          <p className="lede">
            Build a focused preparation kit from the role you want: company context,
            likely questions, revision cards, and a plan that respects your time.
          </p>
          <div className="actions">
            <Link className="button" href="/kits/new">Build a prep kit</Link>
            <Link className="button secondary" href="/dashboard">Open dashboard</Link>
          </div>
        </section>
        <section className="hero-visual" aria-label="Preparation kit preview">
          <div className="sticker one">less noise<br />more signal</div>
          <div className="hero-board">
            <div className="board-top">
              <div><strong>Platform Engineer</strong><br /><span className="mono">ACME / REMOTE</span></div>
              <span className="pill">ready</span>
            </div>
            <div className="progress-line"><span /></div>
            <div className="mono">PREPAREDNESS / 68%</div>
            <div className="board-list" style={{ marginTop: 18 }}>
              <div className="board-row"><span><strong>Company brief</strong><br /><span className="mono">5 useful pages</span></span><span className="status-dot" /></div>
              <div className="board-row"><span><strong>Question bank</strong><br /><span className="mono">18 questions</span></span><span className="status-dot" /></div>
              <div className="board-row"><span><strong>Practice schedule</strong><br /><span className="mono">7 focused days</span></span><span className="status-dot" /></div>
            </div>
          </div>
          <div className="sticker two">built for<br />the real thing</div>
        </section>
      </main>
    </AppShell>
  );
}
