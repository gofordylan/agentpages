export type ContactMethod = 'api' | 'webhook' | 'email' | 'mcp';
export type ApprovalMode = 'autonomous' | 'human_approval' | 'conditional';

export type CategoryId =
  | 'scheduling'
  | 'freelance'
  | 'purchasing'
  | 'social'
  | 'research'
  | 'communication'
  | 'data'
  | 'development'
  | 'finance'
  | 'creative'
  | 'other';

export interface Capability {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  contactMethod: ContactMethod;
  contactEndpoint: string;
  approvalMode: ApprovalMode;
  scope: string;
  availability: string;
  isPublic: boolean;
  price?: string;
}

export interface AgentProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  website: string;
  githubId: string;
  email: string;
  walletAddress?: string;
  capabilities: Capability[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  agentUsername: string;
  reviewerGithubId: string;
  reviewerDisplayName: string;
  reviewerAvatarUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRatingSummary {
  averageRating: number;
  totalReviews: number;
}
