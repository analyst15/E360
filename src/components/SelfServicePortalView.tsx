import React, { useState } from 'react';
import { Ticket, TicketCategory, TicketStatus } from '../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badges';
import { formatTimeAgo } from '../utils/time';
import { WorkplacePortalsHub } from './WorkplacePortalsHub';
import {
  Search,
  KeyRound,
  Network,
  Laptop,
  Package,
  Mail,
  ShieldAlert,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react';

interface SelfServicePortalViewProps {
  tickets: Ticket[];
  onOpenCreateWithCategory: (category: TicketCategory, initialTitle?: string) => void;
  onSelectTicket: (ticket: Ticket) => void;
  onSwitchToEmployeePortal?: () => void;
}

export const SelfServicePortalView: React.FC<SelfServicePortalViewProps> = ({
  tickets,
  onOpenCreateWithCategory,
  onSelectTicket,
  onSwitchToEmployeePortal,
}) => {
  const [portalSearch, setPortalSearch] = useState('');

  // Service Catalog Categories
  const catalogItems = [
    {
      title: 'Password & MFA Access',
      category: 'Access & IAM' as TicketCategory,
      desc: 'Okta login issues, YubiKey setup, temporary admin access permissions',
      icon: <KeyRound className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50/60 border-amber-200 hover:border-amber-400 hover:bg-amber-50',
      prefill: 'Assistance required with corporate SSO / MFA token',
    },
    {
      title: 'VPN & Remote Connectivity',
      category: 'Network & VPN' as TicketCategory,
      desc: 'GlobalProtect VPN connection drops, corporate WiFi authentication, DNS errors',
      icon: <Network className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50/60 border-blue-200 hover:border-blue-400 hover:bg-blue-50',
      prefill: 'VPN authentication or connectivity error',
    },
    {
      title: 'Hardware & Workstations',
      category: 'Hardware' as TicketCategory,
      desc: 'Laptop battery degradation, screen flickering, docks, thermal throttling',
      icon: <Laptop className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50',
      prefill: 'Hardware performance or peripheral malfunction',
    },
    {
      title: 'Software & Cloud Licenses',
      category: 'Software' as TicketCategory,
      desc: 'Developer tools, IDEs, Docker licenses, SaaS workspace subscriptions',
      icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50',
      prefill: 'Request for software installation or license allocation',
    },
    {
      title: 'Outlook, Teams & Email',
      category: 'Email & Cloud' as TicketCategory,
      desc: 'Calendar synchronization delays, mailbox quota, distribution lists',
      icon: <Mail className="w-6 h-6 text-sky-600" />,
      bg: 'bg-sky-50/60 border-sky-200 hover:border-sky-400 hover:bg-sky-50',
      prefill: 'Microsoft 365 calendar or mailbox synchronization error',
    },
    {
      title: 'Report Security Incident',
      category: 'Security Incident' as TicketCategory,
      desc: 'Suspicious email links, unexpected popups, stolen or lost company devices',
      icon: <ShieldAlert className="w-6 h-6 text-red-600" />,
      bg: 'bg-red-50/60 border-red-200 hover:border-red-400 hover:bg-red-50',
      prefill: 'URGENT: Suspicious link clicked or potential security breach',
    },
  ];

  // Filter requests submitted by current user
  const myRequests = tickets.filter(t => {
    if (!portalSearch) return true;
    const q = portalSearch.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.ticketNumber.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Enterprise IT Service Catalog
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          How can IT Support help you today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Submit new incident requests, track your existing tickets in real-time, or request equipment & software approvals.
        </p>

        {/* Global Search */}
        <div className="max-w-xl mx-auto relative pt-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={portalSearch}
            onChange={e => setPortalSearch(e.target.value)}
            placeholder="Search your tickets or enter issue description..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Service Catalog Tiles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Request IT Services & Support
          </h2>
          <span className="text-xs text-slate-500">Select a category to submit</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogItems.map(item => (
            <div
              key={item.title}
              onClick={() => onOpenCreateWithCategory(item.category, item.prefill)}
              className={`p-5 rounded-xl border ${item.bg} cursor-pointer transition-all shadow-xs hover:shadow-md hover:scale-[1.01] flex flex-col justify-between space-y-3 group`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 flex items-center gap-1">
                    Request <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Workplace Portals & Services Hub */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <WorkplacePortalsHub
          onOpenPortal={(url) => {
            if (url === '/' || url === '/admin') {
              // IT Staff Portal
              window.location.href = '/';
            }
          }}
          onRequestHelpWithPortal={(portalName, portalUrl) => {
            onOpenCreateWithCategory(
              'Software (App errors, Activation Keys)',
              `Issue accessing ${portalName} (${portalUrl})`
            );
          }}
        />
      </div>

      {/* My Submitted Requests Tracking Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            My Active & Past Support Requests ({myRequests.length})
          </h2>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {myRequests.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-600">{ticket.ticketNumber}</span>
                    <CategoryBadge category={ticket.category} showIcon={false} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                    {ticket.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{ticket.description}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-slate-600 shrink-0">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Assigned Specialist</span>
                    <strong className="text-slate-800">{ticket.assignedAgent}</strong>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Last Update</span>
                    <strong className="text-slate-800">{formatTimeAgo(ticket.updatedAt)}</strong>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-all">
                    View Updates ({ticket.comments.length})
                  </button>
                </div>
              </div>
            ))}

            {myRequests.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active requests found. Click any service tile above to submit a ticket.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
