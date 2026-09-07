import React from 'react';
import { TicketPriority, TicketStatus, TicketCategory, TicketTier } from '../types';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  Laptop,
  Layers,
  Lock,
  Mail,
  Network,
  Package,
  ShieldAlert,
  Terminal,
  UserCheck,
  Mouse,
  BatteryCharging,
  KeyRound,
  FileText,
  Wifi,
  Printer,
} from 'lucide-react';

export const PriorityBadge: React.FC<{ priority: TicketPriority; showIcon?: boolean }> = ({
  priority,
  showIcon = true,
}) => {
  const configs: Record<TicketPriority, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    Critical: {
      bg: 'bg-red-50',
      text: 'text-red-600 font-normal',
      border: 'border-red-200',
      icon: <Flame className="w-3.5 h-3.5 text-red-600" />,
    },
    High: {
      bg: 'bg-amber-50',
      text: 'text-amber-600 font-normal',
      border: 'border-amber-200',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    },
    Medium: {
      bg: 'bg-blue-50',
      text: 'text-blue-600 font-normal',
      border: 'border-blue-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-blue-600" />,
    },
    Low: {
      bg: 'bg-slate-50',
      text: 'text-slate-600 font-normal',
      border: 'border-slate-200',
      icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
    },
  };

  const c = configs[priority] || configs.Medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${c.bg} ${c.text} ${c.border} whitespace-nowrap shadow-2xs`}
    >
      {showIcon && c.icon}
      {priority}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const configs: Record<TicketStatus, { bg: string; text: string; border: string; dot: string }> = {
    Open: {
      bg: 'bg-amber-50',
      text: 'text-amber-800 font-medium',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    'In Progress': {
      bg: 'bg-blue-50',
      text: 'text-blue-700 font-medium',
      border: 'border-blue-200',
      dot: 'bg-blue-600',
    },
    'Waiting on User': {
      bg: 'bg-purple-50',
      text: 'text-purple-700 font-medium',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
    },
    Escalated: {
      bg: 'bg-rose-50',
      text: 'text-rose-700 font-medium',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
    Resolved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700 font-medium',
      border: 'border-emerald-200',
      dot: 'bg-emerald-600',
    },
    Closed: {
      bg: 'bg-slate-100',
      text: 'text-slate-600 font-medium',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
    },
  };

  const c = configs[status] || configs.Open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${c.bg} ${c.text} ${c.border} whitespace-nowrap shadow-2xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: TicketCategory; showIcon?: boolean }> = ({
  category,
  showIcon = true,
}) => {
  const getIcon = (cat: TicketCategory) => {
    switch (cat) {
      case 'Keyboard or mouse not working':
        return <Mouse className="w-3.5 h-3.5" />;
      case 'Laptop not charging or turning on':
        return <BatteryCharging className="w-3.5 h-3.5" />;
      case 'Email Password':
        return <KeyRound className="w-3.5 h-3.5" />;
      case 'Microsoft Office( Word, Powerpoint & Excel)':
        return <FileText className="w-3.5 h-3.5" />;
      case 'Software (App errors, Activation Keys)':
      case 'Software':
        return <Terminal className="w-3.5 h-3.5" />;
      case 'Network Connectivity':
      case 'Network & VPN':
        return <Wifi className="w-3.5 h-3.5" />;
      case 'Equipment Request':
        return <Package className="w-3.5 h-3.5" />;
      case 'Printer Toner depleted':
        return <Printer className="w-3.5 h-3.5" />;
      case 'Hardware':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'Access & IAM':
        return <Lock className="w-3.5 h-3.5" />;
      case 'Email & Cloud':
        return <Mail className="w-3.5 h-3.5" />;
      case 'Security Incident':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
      {showIcon && getIcon(category)}
      {category}
    </span>
  );
};
