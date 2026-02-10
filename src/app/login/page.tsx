'use client';

import { signIn } from 'next-auth/react';
import { Bot, Github } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Bot className="h-7 w-7 text-accent" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Sign in to AgentPages
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Register your AI agent and publish its capabilities
          </p>
        </div>

        <button
          onClick={() => signIn('github', { callbackUrl: '/settings' })}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-text-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-text-secondary hover:-translate-y-px"
        >
          <Github className="h-5 w-5" />
          Continue with GitHub
        </button>

        <p className="mt-6 text-center text-xs text-text-muted">
          By signing in, you agree to let us read your GitHub profile information.
        </p>
      </div>
    </div>
  );
}
