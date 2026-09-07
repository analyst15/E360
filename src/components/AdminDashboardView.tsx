import React, { useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { Filter, ChevronDown, Check, UserCheck, X, Clock, RefreshCw, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { IT_AGENTS } from '../data/mockData';

interface AdminDashboardViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  tickets,
  onSelectTicket,
  onUpdateTicket,
  onDeleteTicket,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

  // Quick reassign dropdown state
  const [reassignTicketId, setReassignTicketId] = useState<string | null>(null);

  // Compute metrics matching the dashboard layout
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const criticalCount = tickets.filter(
    t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;

  // Filter tickets for the table
  const filteredTickets = tickets.filter(ticket => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const match =
        ticket.ticketNumber.toLowerCase().includes(q) ||
        ticket.reporterName.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q) ||
        ticket.assignedAgent.toLowerCase().includes(q) ||
        ticket.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (categoryFilter !== 'All' && !ticket.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
      return false;
    }
    if (priorityFilter !== 'All' && ticket.priority !== priorityFilter) {
      return false;
    }
    if (statusFilter !== 'All' && ticket.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Handle reassigning agent
  const handleAssignAgent = (ticket: Ticket, agentName: string) => {
    const updated: Ticket = {
      ...ticket,
      assignedAgent: agentName,
      status: ticket.status === 'Open' && agentName !== 'Unassigned' ? 'In Progress' : ticket.status,
      updatedAt: new Date().toISOString(),
      comments: [
        ...ticket.comments,
        {
          id: `c-${Date.now()}`,
          authorName: 'Admin User',
          authorEmail: 'admin@enterprise.io',
          authorRole: 'Agent',
          type: 'Internal Note',
          content: `Assigned ticket to ${agentName}.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    onUpdateTicket(updated);
    setReassignTicketId(null);
  };

  // Helper for priority font color
  const renderPriority = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical':
        return <span className="text-red-600 font-bold text-xs">Critical</span>;
      case 'High':
        return <span className="text-amber-600 font-semibold text-xs">High</span>;
      case 'Medium':
        return <span className="text-blue-600 font-semibold text-xs">Medium</span>;
      case 'Low':
        return <span className="text-slate-600 font-medium text-xs">Low</span>;
      default:
        return <span className="text-slate-600 text-xs">{priority}</span>;
    }
  };

  // Helper for category display name
  const renderCategory = (category: string) => {
    if (category.includes('Network')) return 'Network';
    if (category.includes('Access')) return 'Access & Security';
    if (category.includes('Email')) return 'Email & Communication';
    return category;
  };

  // Helper for status pill
  const renderStatusPill = (status: TicketStatus) => {
    switch (status) {
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-[#e0edff] text-[#2563eb]">
            In Progress
          </span>
        );
      case 'Open':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-[#fef3c7] text-[#d97706]">
            Open
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-[#dcfce7] text-[#16a34a]">
            Resolved
          </span>
        );
      case 'Waiting on User':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            Waiting on User
          </span>
        );
      case 'Escalated':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
            Escalated
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of all support tickets and system analytics</p>
      </div>

      {/* 4 Stat Cards Row with Vibrant Background Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tickets */}
        <div className="bg-amber-500 rounded-xl p-5 shadow-sm text-white hover:bg-amber-600 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-amber-50 font-bold uppercase tracking-wider">Open Tickets</p>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{openCount}</div>
        </div>

        {/* In Progress */}
        <div className="bg-blue-600 rounded-xl p-5 shadow-sm text-white hover:bg-blue-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-50 font-bold uppercase tracking-wider">In Progress</p>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{inProgressCount}</div>
        </div>

        {/* Resolved */}
        <div className="bg-emerald-600 rounded-xl p-5 shadow-sm text-white hover:bg-emerald-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-emerald-50 font-bold uppercase tracking-wider">Resolved</p>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{resolvedCount}</div>
        </div>

        {/* Critical (P1) */}
        <div className="bg-rose-600 rounded-xl p-5 shadow-sm text-white hover:bg-rose-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-rose-50 font-bold uppercase tracking-wider">Critical (P1)</p>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{criticalCount}</div>
        </div>
      </div>

      {/* All Tickets Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        {/* Card Header with Filter button */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">All Tickets</h2>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showFilter || searchFilter || categoryFilter !== 'All' || priorityFilter !== 'All' || statusFilter !== 'All'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Filter
          </button>
        </div>

        {/* Expandable Filter Toolbar */}
        {showFilter && (
          <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-1 text-xs">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search ticket ID, submitter, title..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="w-36">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Network">Network</option>
                <option value="Access">Access & Security</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Email">Email & Cloud</option>
              </select>
            </div>

            <div className="w-32">
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="w-32">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {(searchFilter || categoryFilter !== 'All' || priorityFilter !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchFilter('');
                  setCategoryFilter('All');
                  setPriorityFilter('All');
                  setStatusFilter('All');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        )}

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-white">
                <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  TICKET ID
                </th>
                <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  SUBMITTED BY
                </th>
                <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  PRIORITY
                </th>
                <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  ASSIGNED TO
                </th>
                <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="py-3 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map(ticket => {
                const isAssigned = ticket.assignedAgent && ticket.assignedAgent !== 'Unassigned';

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Ticket ID */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-xs font-semibold text-[#2563eb] group-hover:underline">
                        {ticket.ticketNumber}
                      </span>
                    </td>

                    {/* Submitted By */}
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-700 font-normal">
                      {ticket.reporterName}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
                      {renderCategory(ticket.category)}
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderPriority(ticket.priority)}
                    </td>

                    {/* Assigned To */}
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-700">
                      {isAssigned ? ticket.assignedAgent : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderStatusPill(ticket.status)}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-4 px-6 whitespace-nowrap text-xs relative"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setReassignTicketId(reassignTicketId === ticket.id ? null : ticket.id)}
                          className="text-[#2563eb] hover:text-blue-800 font-medium text-xs cursor-pointer hover:underline inline-flex items-center gap-1"
                        >
                          {isAssigned ? 'Reassign' : 'Assign'}
                        </button>

                        {onDeleteTicket && (
                          <button
                            onClick={() => setTicketToDelete(ticket)}
                            title="Delete ticket"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Quick Assign Dropdown Popover */}
                      {reassignTicketId === ticket.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setReassignTicketId(null)}
                          />
                          <div className="absolute right-6 top-10 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                              Assign Specialist:
                            </div>
                            {IT_AGENTS.map(agent => (
                              <button
                                key={agent.name}
                                onClick={() => handleAssignAgent(ticket, agent.name)}
                                className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>{agent.name}</span>
                                {ticket.assignedAgent === agent.name && (
                                  <Check className="w-3.5 h-3.5 text-blue-600" />
                                )}
                              </button>
                            ))}
                            <div className="border-t border-slate-100 mt-1 pt-1">
                              <button
                                onClick={() => handleAssignAgent(ticket, 'Unassigned')}
                                className="w-full text-left px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                Mark Unassigned
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No tickets found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              Are you sure you want to delete ticket <span className="font-semibold text-slate-800">"{ticketToDelete.title}"</span>? This will permanently remove the ticket from Firestore and all related logs.
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
