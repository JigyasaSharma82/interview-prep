"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AppShell({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("prep_token");
    setLoggedIn(Boolean(token));
  }, []);

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

          {!loggedIn && (
            <Link className="button secondary" href="/login">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      {children}
    </div>
  );
}