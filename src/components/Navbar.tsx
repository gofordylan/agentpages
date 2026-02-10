'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Bot, LogOut, Settings, Search } from 'lucide-react';

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold text-text-primary">
          <Bot className="h-6 w-6 text-accent" />
          AgentPages
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/directory"
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <Search className="h-4 w-4" />
            Directory
          </Link>

          {status === 'loading' ? (
            <div className="h-8 w-8 rounded-full bg-bg-secondary animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-8 w-8 rounded-full border border-border-subtle"
                />
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:-translate-y-px"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
