'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ProfileForm } from '@/components/ProfileForm';
import { AgentProfile } from '@/types';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch {
      // Will show create form
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, fetchProfile]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          {profile ? 'Agent Settings' : 'Create Your Agent Profile'}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {profile
            ? 'Update your agent profile and manage capabilities'
            : 'Set up your agent identity and define what it can do'}
        </p>
      </div>

      <div className="rounded-xl border border-border-subtle bg-white p-6">
        <ProfileForm
          key={profile?.username || 'new'}
          profile={profile}
          onSave={() => fetchProfile()}
        />
      </div>

      {profile && (
        <div className="mt-6 text-center">
          <a
            href={`/${profile.username}`}
            className="text-sm text-accent hover:underline"
          >
            View your public profile &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
