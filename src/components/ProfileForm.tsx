'use client';

import { useState, useEffect, useCallback } from 'react';
import { AgentProfile, Capability } from '@/types';
import { CapabilityEditor } from './CapabilityEditor';
import { Check, X, Loader2, Globe, Eye, EyeOff } from 'lucide-react';

interface ProfileFormProps {
  profile: AgentProfile | null;
  onSave: () => void;
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const isNew = !profile;

  const [username, setUsername] = useState(profile?.username || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [capabilities, setCapabilities] = useState<Capability[]>(profile?.capabilities || []);
  const [isPublished, setIsPublished] = useState(profile?.isPublished || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Username availability check (debounced)
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) || value.length > 40) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    try {
      const res = await fetch(`/api/profile?check=${encodeURIComponent(value)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (!isNew) return; // Don't check if editing existing profile
    const timer = setTimeout(() => checkUsername(username), 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const body = { username, displayName, bio, website, capabilities, isPublished };
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch('/api/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            disabled={!isNew}
            placeholder="my-agent"
            className="w-full rounded-lg border border-border-subtle py-2.5 pl-8 pr-10 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-bg-secondary disabled:text-text-muted"
          />
          {isNew && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 text-text-muted animate-spin" />}
              {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
              {usernameStatus === 'taken' && <X className="h-4 w-4 text-red-500" />}
              {usernameStatus === 'invalid' && <X className="h-4 w-4 text-amber-500" />}
            </span>
          )}
        </div>
        {!isNew && (
          <p className="mt-1 text-xs text-text-muted">Username cannot be changed</p>
        )}
        {isNew && usernameStatus === 'invalid' && (
          <p className="mt-1 text-xs text-amber-600">3-40 chars, lowercase letters, numbers, and hyphens</p>
        )}
        {isNew && usernameStatus === 'taken' && (
          <p className="mt-1 text-xs text-red-500">This username is taken</p>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="My Scheduling Agent"
          className="w-full rounded-lg border border-border-subtle px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Describe what your agent does..."
          rows={3}
          className="w-full rounded-lg border border-border-subtle px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
        />
      </div>

      {/* Website */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Website</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://myagent.com"
            className="w-full rounded-lg border border-border-subtle py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* Capabilities */}
      <div className="border-t border-border-subtle pt-6">
        <CapabilityEditor capabilities={capabilities} onChange={setCapabilities} />
      </div>

      {/* Publish Toggle + Submit */}
      <div className="border-t border-border-subtle pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsPublished(!isPublished)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            isPublished
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-bg-secondary text-text-muted border border-border-subtle'
          }`}
        >
          {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {isPublished ? 'Published — visible in directory' : 'Unpublished — only you can see'}
        </button>

        <button
          type="submit"
          disabled={saving || (isNew && usernameStatus !== 'available')}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isNew ? 'Create Profile' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
