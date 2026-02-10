'use client';

import { useState } from 'react';
import { Capability, CategoryId, ContactMethod, ApprovalMode } from '@/types';
import { CATEGORIES } from '@/lib/categories';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, DollarSign } from 'lucide-react';

interface CapabilityEditorProps {
  capabilities: Capability[];
  onChange: (capabilities: Capability[]) => void;
}

function generateId() {
  return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: 'api', label: 'REST API' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'email', label: 'Email' },
  { value: 'mcp', label: 'MCP Server' },
];

const APPROVAL_MODES: { value: ApprovalMode; label: string; desc: string }[] = [
  { value: 'autonomous', label: 'Autonomous', desc: 'No human approval needed' },
  { value: 'human_approval', label: 'Human Approval', desc: 'Requires manual approval' },
  { value: 'conditional', label: 'Conditional', desc: 'Approval based on rules' },
];

function emptyCapability(): Capability {
  return {
    id: generateId(),
    name: '',
    description: '',
    category: 'other',
    contactMethod: 'api',
    contactEndpoint: '',
    approvalMode: 'human_approval',
    scope: '',
    availability: '24/7',
    isPublic: true,
  };
}

function CapabilityItem({
  capability,
  onUpdate,
  onDelete,
}: {
  capability: Capability;
  onUpdate: (cap: Capability) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(!capability.name);

  return (
    <div className="rounded-lg border border-border-subtle bg-white overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="h-4 w-4 text-text-muted flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {capability.name || 'New Capability'}
          </p>
          {!expanded && capability.description && (
            <p className="text-xs text-text-muted truncate">{capability.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {capability.isPublic && (
            <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              PUBLIC
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border-subtle px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
              <input
                type="text"
                value={capability.name}
                onChange={(e) => onUpdate({ ...capability, name: e.target.value })}
                placeholder="e.g. Schedule Meetings"
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
              <select
                value={capability.category}
                onChange={(e) => onUpdate({ ...capability, category: e.target.value as CategoryId })}
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={capability.description}
              onChange={(e) => onUpdate({ ...capability, description: e.target.value })}
              placeholder="What can this capability do?"
              rows={2}
              className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Contact Method</label>
              <select
                value={capability.contactMethod}
                onChange={(e) => onUpdate({ ...capability, contactMethod: e.target.value as ContactMethod })}
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
              >
                {CONTACT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {capability.contactMethod === 'email' ? 'Email Address' : 'Endpoint URL'}
              </label>
              <input
                type="text"
                value={capability.contactEndpoint}
                onChange={(e) => onUpdate({ ...capability, contactEndpoint: e.target.value })}
                placeholder={capability.contactMethod === 'email' ? 'agent@example.com' : 'https://api.example.com/agent'}
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Approval Mode</label>
              <select
                value={capability.approvalMode}
                onChange={(e) => onUpdate({ ...capability, approvalMode: e.target.value as ApprovalMode })}
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
              >
                {APPROVAL_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Scope</label>
              <input
                type="text"
                value={capability.scope}
                onChange={(e) => onUpdate({ ...capability, scope: e.target.value })}
                placeholder="e.g. Google Calendar only"
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Availability</label>
              <input
                type="text"
                value={capability.availability}
                onChange={(e) => onUpdate({ ...capability, availability: e.target.value })}
                placeholder="e.g. 24/7, business hours"
                className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Price</label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={capability.price || ''}
                  onChange={(e) => onUpdate({ ...capability, price: e.target.value })}
                  placeholder="e.g. $0.05 (empty = free)"
                  className="w-full rounded-md border border-border-subtle pl-8 pr-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={capability.isPublic}
                onChange={(e) => onUpdate({ ...capability, isPublic: e.target.checked })}
                className="rounded border-border-subtle accent-accent"
              />
              Publicly visible
            </label>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CapabilityEditor({ capabilities, onChange }: CapabilityEditorProps) {
  const addCapability = () => {
    onChange([...capabilities, emptyCapability()]);
  };

  const updateCapability = (index: number, cap: Capability) => {
    const updated = [...capabilities];
    updated[index] = cap;
    onChange(updated);
  };

  const deleteCapability = (index: number) => {
    onChange(capabilities.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Capabilities ({capabilities.length})
        </h3>
        <button
          onClick={addCapability}
          className="flex items-center gap-1 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Capability
        </button>
      </div>

      {capabilities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong py-8 text-center">
          <p className="text-sm text-text-muted">No capabilities yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {capabilities.map((cap, i) => (
            <CapabilityItem
              key={cap.id}
              capability={cap}
              onUpdate={(updated) => updateCapability(i, updated)}
              onDelete={() => deleteCapability(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
