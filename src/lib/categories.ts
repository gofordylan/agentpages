import { CategoryId } from '@/types';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

export const CATEGORIES: Category[] = [
  { id: 'scheduling', name: 'Scheduling', description: 'Calendar management, meeting coordination, reminders', icon: 'Calendar' },
  { id: 'freelance', name: 'Freelance', description: 'Task delegation, project management, hiring', icon: 'Briefcase' },
  { id: 'purchasing', name: 'Purchasing', description: 'Price comparison, order placement, inventory', icon: 'ShoppingCart' },
  { id: 'social', name: 'Social', description: 'Social media management, content posting, engagement', icon: 'Users' },
  { id: 'research', name: 'Research', description: 'Web research, data gathering, analysis', icon: 'Search' },
  { id: 'communication', name: 'Communication', description: 'Email drafting, messaging, notifications', icon: 'MessageSquare' },
  { id: 'data', name: 'Data', description: 'Data processing, ETL, analytics, reporting', icon: 'Database' },
  { id: 'development', name: 'Development', description: 'Code generation, debugging, deployment', icon: 'Code' },
  { id: 'finance', name: 'Finance', description: 'Invoicing, expense tracking, payments', icon: 'DollarSign' },
  { id: 'creative', name: 'Creative', description: 'Design, writing, content creation, media', icon: 'Palette' },
  { id: 'other', name: 'Other', description: 'Miscellaneous capabilities', icon: 'Zap' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;
