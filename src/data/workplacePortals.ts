export interface WorkplacePortal {
  id: string;
  name: string;
  shortName: string;
  url: string;
  description: string;
  category: 'ERP & Operations' | 'Education & Foundation' | 'Community & Outreach' | 'Cloud & Collaboration';
  badge: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    btnBg: string;
  };
  highlights: string[];
}

export const WORKPLACE_PORTALS: WorkplacePortal[] = [
  {
    id: 'sharepoint-portal',
    name: 'SharePoint',
    shortName: 'SharePoint',
    url: 'https://elimishawatotofoundation241.sharepoint.com/',
    description: 'Elimisha Watoto Foundation official SharePoint platform for staff document libraries, team shared drives, organizational policies, and cloud collaboration.',
    category: 'Cloud & Collaboration',
    badge: 'Microsoft 365',
    colorScheme: {
      bg: 'bg-teal-50/50 hover:bg-teal-50/80',
      border: 'border-teal-200 hover:border-teal-400',
      text: 'text-teal-900',
      badgeBg: 'bg-teal-100/90 text-teal-800 border-teal-300',
      badgeText: 'text-teal-700',
      btnBg: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
    highlights: ['Document Libraries', 'Cloud File Storage', 'Staff Shared Drives'],
  },
  {
    id: 'sapama-erp',
    name: 'Sapama ERP',
    shortName: 'Sapama',
    url: 'https://sapamaerp.com/',
    description: 'Enterprise Resource Planning platform for financial management, payroll, requisitions, and daily staff operations.',
    category: 'ERP & Operations',
    badge: 'Enterprise ERP',
    colorScheme: {
      bg: 'bg-emerald-50/50 hover:bg-emerald-50/80',
      border: 'border-emerald-200 hover:border-emerald-400',
      text: 'text-emerald-900',
      badgeBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
      badgeText: 'text-emerald-700',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    highlights: ['Financial Accounting', 'Staff Requisitions', 'Operations & Payroll'],
  },
  {
    id: 'secondary-portal',
    name: 'Secondary Portal',
    shortName: 'Elimisha Secondary',
    url: 'https://elimishafoundation.org/',
    description: 'Elimisha Foundation official portal for secondary school student tracking, foundation programs, and educational records.',
    category: 'Education & Foundation',
    badge: 'Secondary Education',
    colorScheme: {
      bg: 'bg-blue-50/50 hover:bg-blue-50/80',
      border: 'border-blue-200 hover:border-blue-400',
      text: 'text-blue-900',
      badgeBg: 'bg-blue-100/90 text-blue-800 border-blue-300',
      badgeText: 'text-blue-700',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    highlights: ['Student Records', 'Secondary Curriculum', 'Foundation Programs'],
  },
  {
    id: 'tertiary-portal',
    name: 'Tertiary Portal',
    shortName: 'Elimisha Tertiary',
    url: 'https://elimishawatototertiary.org/',
    description: 'Elimisha Watoto Tertiary portal for higher education programs, college sponsorships, and vocational training.',
    category: 'Education & Foundation',
    badge: 'Higher Education',
    colorScheme: {
      bg: 'bg-indigo-50/50 hover:bg-indigo-50/80',
      border: 'border-indigo-200 hover:border-indigo-400',
      text: 'text-indigo-900',
      badgeBg: 'bg-indigo-100/90 text-indigo-800 border-indigo-300',
      badgeText: 'text-indigo-700',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    highlights: ['Higher Ed Grants', 'Vocational Training', 'Tertiary Scholars'],
  },
  {
    id: 'care-share-portal',
    name: 'Care & Share Portal',
    shortName: 'Care & Share',
    url: 'https://care-share.org/',
    description: 'Care & Share platform managing community support, donor engagements, family outreach, and welfare initiatives.',
    category: 'Community & Outreach',
    badge: 'Care & Community',
    colorScheme: {
      bg: 'bg-rose-50/50 hover:bg-rose-50/80',
      border: 'border-rose-200 hover:border-rose-400',
      text: 'text-rose-900',
      badgeBg: 'bg-rose-100/90 text-rose-800 border-rose-300',
      badgeText: 'text-rose-700',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    highlights: ['Outreach & Sponsorship', 'Welfare Management', 'Community Programs'],
  },
];
