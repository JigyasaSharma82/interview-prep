import Link from "next/link";

export default function AppShell({ children }) {
  return (
    <div className="shell">
      <header className="navbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          Prep / signal
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/kits/new">New kit</Link>
          <Link className="button secondary" href="/login">
            Sign in
          </Link>
        </nav>
      </header>

      {children}
    </div>
  );
}