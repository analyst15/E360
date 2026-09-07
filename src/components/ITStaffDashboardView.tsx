import React, { useState, useMemo } from 'react';
import { Ticket, TicketPriority, TicketStatus, UserAccount } from '../types';
import {
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  X,
  UserPlus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { IT_AGENTS } from '../data/mockData';

interface ITStaffDashboardViewProps {
  tickets: Ticket[];
  currentUser?: UserAccount | null;
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onOpenCreateTicket?: () => void;
}

export const ITStaffDashboardView: React.FC<ITStaffDashboardViewProps> = ({
  tickets,
  currentUser,
  onSelectTicket,
  onUpdateTicket,
  onDeleteTicket,
  onOpenCreateTicket,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'assigned_to_me' | 'unassigned' | 'high_priority'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active'); // Active = Open + In Progress + Waiting
  const [reassigningTicketId, setReassigningTicketId] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

  // Stats calculation
  const openCount = useMemo(() => {
    return tickets.filter(t => t.status === 'Open').length;
  }, [tickets]);

  const inProgressCount = useMemo(() => {
    return tickets.filter(t => t.status === 'In Progress').length;
  }, [tickets]);

  const resolvedCount = useMemo(() => {
    return tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  }, [tickets]);

  const highPriorityCount = useMemo(() => {
    return tickets.filter(
      t => (t.priority === 'Critical' || t.priority === 'High') && t.status !== 'Resolved' && t.status !== 'Closed'
    ).length;
  }, [tickets]);

  // Priority weight for sorting by priority (Critical > High > Medium > Low)
  const priorityWeight: Record<TicketPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Status weight (Open/In Progress first, then Resolved/Closed)
  const statusWeight: Record<TicketStatus, number> = {
    Open: 4,
    'In Progress': 3,
    Escalated: 3,
    'Waiting on User': 2,
    Resolved: 1,
    Closed: 0,
  };

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    return tickets
      .filter(ticket => {
        // Quick tab filter
        if (filterMode === 'assigned_to_me') {
          if (currentUser) {
            const isAssigned =
              ticket.assignedAgent.toLowerCase().includes(currentUser.name.toLowerCase()) ||
              ticket.assignedAgent.toLowerCase().includes(currentUser.email.toLowerCase());
            if (!isAssigned) return false;
          }
        } else if (filterMode === 'unassigned') {
          if (ticket.assignedAgent !== 'Unassigned' && ticket.assignedAgent.trim() !== '') {
            return false;
          }
        } else if (filterMode === 'high_priority') {
          if (ticket.priority !== 'Critical' && ticket.priority !== 'High') {
            return false;
          }
        }

        // Active Status Filter
        if (statusFilter === 'Active') {
          if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
            return false;
          }
        } else if (statusFilter !== 'All') {
          if (ticket.status !== statusFilter) {
            return false;
          }
        }

        // Category Filter
        if (categoryFilter !== 'All') {
          if (!ticket.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
            return false;
          }
        }

        // Search Term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matches =
            ticket.ticketNumber.toLowerCase().includes(q) ||
            ticket.title.toLowerCase().includes(q) ||
            ticket.reporterName.toLowerCase().includes(q) ||
            ticket.category.toLowerCase().includes(q) ||
            ticket.assignedAgent.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Primary sort: Priority (Critical -> High -> Medium -> Low)
        const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (pDiff !== 0) return pDiff;

        // Secondary sort: Status active over closed
        const sDiff = statusWeight[b.status] - statusWeight[a.status];
        if (sDiff !== 0) return sDiff;

        // Tertiary: Date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tickets, filterMode, searchTerm, categoryFilter, statusFilter, currentUser]);

  // Quick Action: Claim / Assign Ticket to current user
  const handleClaimTicket = (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation();
    const assigneeName = currentUser ? currentUser.name : 'IT Staff Tech';
    const assigneeEmail = currentUser ? currentUser.email : 'tech@elimishafoundation.org';

    const updated: Ticket = {
      ...ticket,
      assignedAgent: assigneeName,
      status: ticket.status === 'Open' ? 'In Progress' : ticket.status,
      updatedAt: new Date().toISOString(),
      comments: [
        ...ticket.comments,
        {
          id: `c-${Date.now()}`,
          authorName: assigneeName,
          authorEmail: assigneeEmail,
          authorRole: 'Agent',
          type: 'Internal Note',
          content: `Assigned ticket to ${assigneeName} for resolution.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    onUpdateTicket(updated);
  };

  // Quick Action: Reassign Agent
  const handleAssignAgent = (e: React.MouseEvent, ticket: Ticket, agentName: string) => {
    e.stopPropagation();
    const updated: Ticket = {
      ...ticket,
      assignedAgent: agentName,
      status: ticket.status === 'Open' && agentName !== 'Unassigned' ? 'In Progress' : ticket.status,
      updatedAt: new Date().toISOString(),
      comments: [
        ...ticket.comments,
        {
          id: `c-${Date.now()}`,
          authorName: currentUser?.name || 'IT Staff',
          authorEmail: currentUser?.email || 'it@company.com',
          authorRole: 'Agent',
          type: 'Internal Note',
          content: `Reassigned ticket to ${agentName}.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    onUpdateTicket(updated);
    setReassigningTicketId(null);
  };

  // Format Category
  const formatCategory = (category: string) => {
    if (category.includes('Network')) return 'Network';
    if (category.includes('Access')) return 'Access & Security';
    if (category.includes('Email')) return 'Email & Communication';
    if (category.includes('Software')) return 'Software';
    if (category.includes('Hardware')) return 'Hardware';
    return category;
  };

  // Priority Visual Renderer matching Inspo screenshot
  const renderPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-2 text-red-600 font-normal text-sm sm:text-base">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Critical</span>
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-2 text-[#ea580c] font-normal text-sm sm:text-base">
            <AlertCircle className="w-5 h-5 text-[#ea580c] shrink-0" />
            <span>High</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="text-[#2563eb] font-normal text-sm sm:text-base">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="text-slate-600 font-normal text-sm sm:text-base">
            Low
          </span>
        );
      default:
        return <span className="text-slate-600 text-sm">{priority}</span>;
    }
  };

  // Status Pill Renderer matching Inspo screenshot
  const renderStatusPill = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-normal bg-[#fef3c7] text-[#b45309] min-w-[90px] shadow-2xs">
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center justify-center px-4.5 py-1.5 rounded-full text-sm font-normal bg-[#dbeafe] text-[#1d4ed8] min-w-[110px] shadow-2xs">
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center justify-center px-4.5 py-1.5 rounded-full text-sm font-normal bg-[#dcfce7] text-[#15803d] min-w-[100px] shadow-2xs">
            Resolved
          </span>
        );
      case 'Waiting on User':
        return (
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-normal bg-purple-100 text-purple-700 min-w-[90px]">
            Waiting
          </span>
        );
      case 'Escalated':
        return (
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-normal bg-rose-100 text-rose-700 min-w-[96px]">
            Escalated
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-normal bg-slate-100 text-slate-600 min-w-[85px]">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-normal bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Top Header: Title & Subtitle matching Inspo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
            IT Staff Dashboard
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-1 font-normal">
            Manage and resolve support tickets
          </p>
        </div>

        {currentUser && (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-normal self-start sm:self-auto shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Technician Queue: <span className="font-normal">{currentUser.name}</span> ({currentUser.role})</span>
          </div>
        )}
      </div>

      {/* 4 Metric Cards with Rich, Distinct Background Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Open - Vibrant Amber Theme */}
        <div
          onClick={() => {
            setStatusFilter('Open');
            setFilterMode('all');
          }}
          className={`rounded-2xl p-4 sm:p-6 shadow-md transition-all cursor-pointer group relative overflow-hidden text-white ${
            statusFilter === 'Open' && filterMode === 'all'
              ? 'bg-amber-600 ring-4 ring-amber-300 ring-offset-2 shadow-lg scale-[1.02]'
              : 'bg-amber-500 hover:bg-amber-600 hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base font-bold text-amber-50 mb-1">
              Open
            </p>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-4xl font-black text-white mt-1">{openCount}</div>
          <div className="text-[11px] sm:text-xs text-amber-100 font-medium mt-1">Awaiting triage & claim</div>
        </div>

        {/* In Progress - Vibrant Blue Theme */}
        <div
          onClick={() => {
            setStatusFilter('In Progress');
            setFilterMode('all');
          }}
          className={`rounded-2xl p-4 sm:p-6 shadow-md transition-all cursor-pointer group relative overflow-hidden text-white ${
            statusFilter === 'In Progress' && filterMode === 'all'
              ? 'bg-blue-700 ring-4 ring-blue-300 ring-offset-2 shadow-lg scale-[1.02]'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base font-bold text-blue-50 mb-1">
              In Progress
            </p>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-4xl font-black text-white mt-1">{inProgressCount}</div>
          <div className="text-[11px] sm:text-xs text-blue-100 font-medium mt-1">Actively being worked on</div>
        </div>

        {/* Resolved - Vibrant Emerald Theme */}
        <div
          onClick={() => {
            setStatusFilter('Resolved');
            setFilterMode('all');
          }}
          className={`rounded-2xl p-4 sm:p-6 shadow-md transition-all cursor-pointer group relative overflow-hidden text-white ${
            statusFilter === 'Resolved' && filterMode === 'all'
              ? 'bg-emerald-700 ring-4 ring-emerald-300 ring-offset-2 shadow-lg scale-[1.02]'
              : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base font-bold text-emerald-50 mb-1">
              Resolved
            </p>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-4xl font-black text-white mt-1">{resolvedCount}</div>
          <div className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-1">Successfully resolved</div>
        </div>

        {/* High Priority - Vibrant Rose / Red Theme */}
        <div
          onClick={() => {
            setFilterMode('high_priority');
            setStatusFilter('Active');
          }}
          className={`rounded-2xl p-4 sm:p-6 shadow-md transition-all cursor-pointer group relative overflow-hidden text-white ${
            filterMode === 'high_priority'
              ? 'bg-rose-700 ring-4 ring-rose-300 ring-offset-2 shadow-lg scale-[1.02]'
              : 'bg-rose-600 hover:bg-rose-700 hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base font-bold text-rose-50 mb-1">
              High Priority
            </p>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-4xl font-black text-white mt-1">{highPriorityCount}</div>
          <div className="text-[11px] sm:text-xs text-rose-100 font-medium mt-1">Critical & High incidents</div>
        </div>
      </div>

      {/* Main Container Card: Active Tickets (Sorted by Priority) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header matching Inspo */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-2xl font-normal text-slate-900 tracking-tight">
              Active Tickets (Sorted by Priority)
            </h2>
            <span className="text-xs sm:text-sm font-normal px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-700">
              {filteredAndSortedTickets.length}
            </span>
          </div>

          {/* Quick Sub-Filter Tabs for IT Staff */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => {
                setFilterMode('all');
                setStatusFilter('Active');
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-normal transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'all' && statusFilter === 'Active'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Active
            </button>
            <button
              onClick={() => {
                setFilterMode('assigned_to_me');
                setStatusFilter('Active');
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-normal transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'assigned_to_me'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => {
                setFilterMode('unassigned');
                setStatusFilter('Active');
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-normal transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Unassigned Queue
            </button>
            <button
              onClick={() => {
                setFilterMode('high_priority');
                setStatusFilter('Active');
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-normal transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'high_priority'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              High & Critical
            </button>
            <button
              onClick={() => {
                setFilterMode('all');
                setStatusFilter('All');
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-normal transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'All'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All (inc. Resolved)
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-sm">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search ticket #, title, reporter, or category..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-normal"
            />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Email">Email & Communication</option>
              <option value="Network">Network & VPN</option>
              <option value="Access">Access & Security</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
            </select>
          </div>

          {(searchTerm || categoryFilter !== 'All' || filterMode !== 'all' || statusFilter !== 'Active') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('All');
                setFilterMode('all');
                setStatusFilter('Active');
              }}
              className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 font-bold cursor-pointer px-2.5 py-1.5 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" /> Reset Filters
            </button>
          )}
        </div>

        {/* Table layout matching the Inspo Screenshot */}
        <div className="overflow-x-auto">
          {filteredAndSortedTickets.length === 0 ? (
            <div className="p-10 sm:p-16 text-center">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 sm:w-7 h-6 sm:h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No tickets found in this queue</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                All tickets matching the current criteria have been handled or none exist.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[640px]">
              <tbody>
                {filteredAndSortedTickets.map((ticket, index) => {
                  const isUnassigned = ticket.assignedAgent === 'Unassigned' || !ticket.assignedAgent;
                  const isAssignedToMe = currentUser && ticket.assignedAgent.toLowerCase().includes(currentUser.name.toLowerCase());

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Column 1: Ticket ID + Title & Submitter */}
                      <td className="py-4 sm:py-5 px-4 sm:px-6 min-w-[260px] max-w-[380px]">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0 font-mono">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-sm sm:text-base font-normal text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {ticket.title}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 mt-1 pl-0.5 truncate font-normal">
                          Submitted by {ticket.reporterName}
                        </div>
                      </td>

                      {/* Column 2: Category */}
                      <td className="py-4 sm:py-5 px-3 sm:px-6 text-xs sm:text-base font-normal text-slate-700 whitespace-nowrap">
                        {formatCategory(ticket.category)}
                      </td>

                      {/* Column 3: Priority */}
                      <td className="py-4 sm:py-5 px-3 sm:px-6 whitespace-nowrap">
                        {renderPriorityBadge(ticket.priority)}
                      </td>

                      {/* Column 4: Assignee */}
                      <td className="py-4 sm:py-5 px-3 sm:px-6 text-xs sm:text-base whitespace-nowrap">
                        <div className="relative flex items-center gap-2">
                          {isUnassigned ? (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-normal text-xs sm:text-base">Unassigned</span>
                              <button
                                onClick={(e) => handleClaimTicket(e, ticket)}
                                title="Claim ticket and assign to me"
                                className="opacity-90 hover:opacity-100 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 sm:px-3 py-1 rounded-lg border border-blue-200 transition-all cursor-pointer shadow-2xs"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Claim</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className={`font-normal text-xs sm:text-base ${isAssignedToMe ? 'text-blue-700 font-semibold' : 'text-slate-800'}`}>
                                {ticket.assignedAgent}
                              </span>
                              
                              {/* Quick Reassign Trigger */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReassigningTicketId(reassigningTicketId === ticket.id ? null : ticket.id);
                                  }}
                                  title="Reassign to another staff"
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>

                                {reassigningTicketId === ticket.id && (
                                  <div
                                    onClick={e => e.stopPropagation()}
                                    className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95"
                                  >
                                    <div className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                      Assign Technician
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {IT_AGENTS.map(agent => (
                                        <button
                                          key={agent.name}
                                          onClick={(e) => handleAssignAgent(e, ticket, agent.name)}
                                          className={`w-full text-left px-3.5 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${
                                            ticket.assignedAgent === agent.name ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-800 font-medium'
                                          }`}
                                        >
                                          <span>{agent.name}</span>
                                          <span className="text-xs text-slate-400">{agent.role.split(' ')[0]}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Status Pill & Delete action */}
                      <td className="py-4 sm:py-5 px-4 sm:px-6 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2.5">
                          {renderStatusPill(ticket.status)}
                          {onDeleteTicket && (
                            <button
                              onClick={() => setTicketToDelete(ticket)}
                              title="Delete ticket"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-600 font-medium">
          <span>Click any row to open the complete ticket resolution workspace</span>
          <span className="font-bold text-slate-700">Priority Queue Active</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Ticket {ticketToDelete.ticketNumber}?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete ticket <span className="font-semibold text-slate-800">"{ticketToDelete.title}"</span>? All associated notes and diagnostic logs will be removed.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTicket?.(ticketToDelete.id);
                  setTicketToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
