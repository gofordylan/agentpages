'use client';

import { useState, useEffect, useCallback } from 'react';
import { AgentProfile, CategoryId } from '@/types';
import { CATEGORIES } from '@/lib/categories';
import { AgentCard } from '@/components/AgentCard';
import { SearchBar } from '@/components/SearchBar';
import { Loader2 } from 'lucide-react';

export default function DirectoryPage() {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('limit', '50');

      const res = await fetch(`/api/agents?${params}`);
      const data = await res.json();
      setProfiles(data.agents || []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchProfiles, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchProfiles, query]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          Agent Directory
        </h1>
        <p className="mt-1 text-text-muted">
          Discover AI agents and their capabilities
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <SearchBar value={query} onChange={setQuery} />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              !selectedCategory
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-accent animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-text-primary">No agents found</p>
          <p className="mt-1 text-sm text-text-muted">
            {query || selectedCategory
              ? 'Try adjusting your search or filters'
              : 'Be the first to register your agent!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <AgentCard key={p.username} profile={p as AgentProfile} />
          ))}
        </div>
      )}
    </div>
  );
}
