export type TicketCategory =
  | 'Keyboard or mouse not working'
  | 'Laptop not charging or turning on'
  | 'Email Password'
  | 'Microsoft Office( Word, Powerpoint & Excel)'
  | 'Software (App errors, Activation Keys)'
  | 'Network Connectivity'
  | 'Equipment Request'
  | 'Printer Toner depleted'
  | 'Other'
  | 'Hardware'
  | 'Software'
  | 'Network & VPN'
  | 'Access & IAM'
  | 'Email & Cloud'
  | 'Security Incident';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus =
  | 'Open'
  | 'In Progress'
  | 'Waiting on User'
  | 'Escalated'
  | 'Resolved'
  | 'Closed';

export type TicketTier =
  | 'Tier 1 (Helpdesk)'
  | 'Tier 2 (SysAdmin)'
  | 'Tier 3 (DevOps / SecOps)'
  | 'Field Support';

export type CommentType = 'Public Reply' | 'Internal Note' | 'System Audit' | 'AI Triage';

export interface TicketComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole: 'Agent' | 'User' | 'System' | 'AI Copilot';
  type: CommentType;
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string; type: string }[];
}

export interface AITriageData {
  detectedCategory: TicketCategory;
  recommendedPriority: TicketPriority;
  urgencyReasoning: string;
  estimatedMinutes: number;
  suggestedTags: string[];
  autoDeflectionHint?: string;
  rootCauseHypothesis?: string;
  isAiGenerated?: boolean;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. INC-8042
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  tier: TicketTier;
  assignedAgent: string; // e.g. "Alex Mercer" or "Unassigned"
  assignedTeam: string; // e.g. "Workplace Tech", "SecOps", "Cloud Infra"
  reporterName: string;
  reporterEmail: string;
  reporterDepartment: string;
  assetId?: string; // e.g. "LAPTOP-MBP-9021"
  operatingSystem?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  aiTriage?: AITriageData;
  resolutionNotes?: string;
  satisfactionRating?: number; // 1-5
}

export interface KBArticle {
  id: string;
  title: string;
  category: TicketCategory;
  summary: string;
  symptoms: string[];
  rootCause: string;
  resolutionSteps: string[];
  prevention?: string;
  keywords: string[];
  helpfulVotes: number;
  views: number;
  createdAt: string;
  author: string;
}

export interface ITAsset {
  id: string;
  employeeName: string;
  laptopModel: string;
  laptopPrice: string;
  laptopSerialNumber: string;
  laptopConditionComments: string;
  issuedWithMouse: 'Yes' | 'No';
  issuedWithTripod: 'Yes' | 'No';
  issuedWithMic: 'Yes' | 'No';
  phoneModel: string;
  phonePrice: string;
  safaricomPhoneNumber: string;
  airtelPhoneNumber: string;
  phoneConditionComments: string;
  dateAdded?: string;
  department?: string;
}

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  category: string;
  assignedAgent: string;
  tier: string;
  sortBy: 'newest' | 'oldest' | 'priority' | 'updated';
}

export type AppViewMode = 'dashboard' | 'tickets' | 'users' | 'reports' | 'kanban' | 'portal' | 'kb' | 'assets' | 'portals';

export const ORGANIZATIONAL_DEPARTMENTS = [
  'Secondary',
  'Tertiary',
  'Front Office',
  'Finance',
  'Human Resource',
  'Communications & Media',
  'IT',
  'Administration',
  'Care & Share',
  'Property',
] as const;

export type OrganizationalDepartment = (typeof ORGANIZATIONAL_DEPARTMENTS)[number];

export type UserRole = 'Employee' | 'IT Staff' | 'Admin';
export type UserStatus = 'Active' | 'Inactive';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  dateAdded: string;
}

export interface EmployeeNotification {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'created' | 'status_changed' | 'assigned' | 'comment_added' | 'info';
}
