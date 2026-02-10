import { CATEGORY_MAP } from '@/lib/categories';
import { CategoryId } from '@/types';
import {
  Calendar, Briefcase, ShoppingCart, Users, Search,
  MessageSquare, Database, Code, DollarSign, Palette, Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Briefcase, ShoppingCart, Users, Search,
  MessageSquare, Database, Code, DollarSign, Palette, Zap,
};

export function CapabilityBadge({ category }: { category: CategoryId }) {
  const cat = CATEGORY_MAP[category];
  if (!cat) return null;

  const Icon = ICON_MAP[cat.icon] || Zap;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/8 px-2.5 py-1 text-xs font-medium text-accent">
      <Icon className="h-3 w-3" />
      {cat.name}
    </span>
  );
}
