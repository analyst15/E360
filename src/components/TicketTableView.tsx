import React, { useState, useMemo } from 'react';
import { Ticket, FilterState, TicketStatus, TicketPriority, TicketCategory, TicketTier } from '../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from './Badges';
import { formatTimeAgo } from '../utils/time';
import { IT_AGENTS } from '../data/mockData';
import {
  Filter,
  ArrowUpDown,
  User,
  Clock,
  Laptop,
  CheckSquare,
  Square,
  Trash2,
  UserCheck,
  CheckCircle2,
  Layers,
  ChevronDown,
  AlertTriangle,
  Flame,
  Search,
} from 'lucide-react';

interface TicketTableViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateTicket: (updated: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onBulkUpdateStatus: (ticketIds: string[], newStatus: TicketStatus) => void;
  onBulkAssign: (ticketIds: string[], newAgent: string) => void;
  onBulkDelete: (ticketIds: string[]) => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

export const TicketTableView: React.FC<TicketTableViewProps> = ({
  tickets,
  onSelectTicket,
  onUpdateTicket,
  onDeleteTicket,
  onBulkUpdateStatus,
  onBulkAssign,
  onBulkDelete,
  filters,
  onFilterChange,
}) => {
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Filter and Sort Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Global Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = t.description.toLowerCase().includes(query);
        const matchNumber = t.ticketNumber.toLowerCase().includes(query);
        const matchReporter = t.reporterName.toLowerCase().includes(query);
        const matchAsset = t.assetId?.toLowerCase().includes(query);
        const matchTag = t.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchNumber && !matchReporter && !matchAsset && !matchTag) {
          return false;
        }
      }

      // Status
      if (filters.status && filters.status !== 'All' && t.status !== filters.status) {
        return false;
      }

      // Priority
      if (filters.priority && filters.priority !== 'All' && t.priority !== filters.priority) {
        return false;
      }

      // Category
      if (filters.category && filters.category !== 'All' && t.category !== filters.category) {
        return false;
      }

      // Assignee
      if (filters.assignedAgent && filters.assignedAgent !== 'All') {
        if (filters.assignedAgent === 'Unassigned' && t.assignedAgent !== 'Unassigned') return false;
        if (filters.assignedAgent !== 'Unassigned' && t.assignedAgent !== filters.assignedAgent) return false;
      }

      // Tier
      if (filters.tier && filters.tier !== 'All' && t.tier !== filters.tier) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filters.sortBy === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (filters.sortBy === 'priority') {
        const pOrder: Record<TicketPriority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      return 0;
    });
  }, [tickets, filters]);

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map(t => t.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicketIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Filter Bar & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs flex-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Filters:
            </span>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={e => onFilterChange({ ...filters, status: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on User">Waiting on User</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={e => onFilterChange({ ...filters, priority: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical (P1)</option>
              <option value="High">High (P2)</option>
              <option value="Medium">Medium (P3)</option>
              <option value="Low">Low (P4)</option>
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={e => onFilterChange({ ...filters, category: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Keyboard or mouse not working">Keyboard or mouse not working</option>
              <option value="Laptop not charging or turning on">Laptop not charging or turning on</option>
              <option value="Email Password">Email Password</option>
              <option value="Microsoft Office( Word, Powerpoint & Excel)">Microsoft Office( Word, Powerpoint & Excel)</option>
              <option value="Software (App errors, Activation Keys)">Software (App errors, Activation Keys)</option>
              <option value="Network Connectivity">Network Connectivity</option>
              <option value="Equipment Request">Equipment Request</option>
              <option value="Printer Toner depleted">Printer Toner depleted</option>
              <option value="Other">Other</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={filters.assignedAgent}
              onChange={e => onFilterChange({ ...filters, assignedAgent: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Agents</option>
              <option value="Unassigned">Unassigned</option>
              {IT_AGENTS.map(agent => (
                <option key={agent.name} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>

            {/* Reset Filters button if any active */}
            {(filters.status !== 'All' ||
              filters.priority !== 'All' ||
              filters.category !== 'All' ||
              filters.assignedAgent !== 'All') && (
              <button
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    status: 'All',
                    priority: 'All',
                    category: 'All',
                    assignedAgent: 'All',
                    tier: 'All',
                  })
                }
                className="text-xs text-blue-600 hover:text-blue-800 underline font-medium ml-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Sort Controller */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Sort:
            </span>
            <select
              value={filters.sortBy}
              onChange={e => onFilterChange({ ...filters, sortBy: e.target.value as any })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority (P1 → P4)</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Toolbar (appears when items are selected) */}
        {selectedTicketIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between bg-blue-50/70 p-3 rounded-lg border border-blue-100 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-800">
                {selectedTicketIds.length} ticket{selectedTicketIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedTicketIds([])}
                className="text-slate-500 hover:text-slate-800 underline text-[11px] cursor-pointer"
              >
                Deselect all
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk Status */}
              <select
                defaultValue=""
                onChange={e => {
                  if (e.target.value) {
                    onBulkUpdateStatus(selectedTicketIds, e.target.value as TicketStatus);
                    e.target.value = '';
                    setSelectedTicketIds([]);
                  }
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 cursor-pointer"
              >
                <option value="" disabled>Set Status...</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting on User">Waiting on User</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              {/* Bulk Assign */}
              <select
                defaultValue=""
                onChange={e => {
                  if (e.target.value) {
                    onBulkAssign(selectedTicketIds, e.target.value);
                    e.target.value = '';
                    setSelectedTicketIds([]);
                  }
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 cursor-pointer"
              >
                <option value="" disabled>Assign To...</option>
                <option value="Unassigned">Unassign</option>
                {IT_AGENTS.map(agent => (
                  <option key={agent.name} value={agent.name}>
                    {agent.name}
                  </option>
                ))}
              </select>

              {/* Bulk Delete */}
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold select-none">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    {selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5 w-24">Ticket ID</th>
                <th className="p-3.5 min-w-[260px]">Subject & Description</th>
                <th className="p-3.5 w-32">Category</th>
                <th className="p-3.5 w-24">Priority</th>
                <th className="p-3.5 w-28">Status</th>
                <th className="p-3.5 w-36">Assignee</th>
                <th className="p-3.5 w-28">Reporter</th>
                <th className="p-3.5 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map(ticket => {
                const isSelected = selectedTicketIds.includes(ticket.id);

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                      isSelected ? 'bg-blue-50/80' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center" onClick={e => handleToggleSelectOne(ticket.id, e)}>
                      <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Ticket Number */}
                    <td className="p-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {ticket.ticketNumber}
                    </td>

                    {/* Subject & Snippet */}
                    <td className="p-3.5">
                      <div className="font-normal text-slate-900 text-xs line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {ticket.title}
                      </div>
                      <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5 font-normal">
                        {ticket.description}
                      </div>
                      {ticket.assetId && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-normal">
                          <Laptop className="w-3 h-3 text-slate-400" />
                          {ticket.assetId}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <CategoryBadge category={ticket.category} />
                    </td>

                    {/* Priority */}
                    <td className="p-3.5">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <StatusBadge status={ticket.status} />
                    </td>

                    {/* Assignee */}
                    <td className="p-3.5">
                      <span className="font-normal text-slate-800">
                        {ticket.assignedAgent === 'Unassigned' ? (
                          <span className="text-slate-400 italic font-normal">Unassigned</span>
                        ) : (
                          ticket.assignedAgent
                        )}
                      </span>
                      <div className="text-[10px] text-slate-500">{ticket.tier}</div>
                    </td>

                    {/* Reporter */}
                    <td className="p-3.5">
                      <div className="text-slate-800 font-medium">{ticket.reporterName}</div>
                      <div className="text-[10px] text-slate-500">{ticket.reporterDepartment}</div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setTicketToDelete(ticket)}
                        title="Delete ticket"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Layers className="w-8 h-8 text-slate-400" />
                      <p className="font-medium text-sm text-slate-700">No tickets found matching your filters.</p>
                      <p className="text-xs text-slate-500">Try adjusting your search criteria or resetting filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-slate-800">{filteredTickets.length}</strong> of{' '}
            <strong className="text-slate-800">{tickets.length}</strong> total tickets
          </span>
          <span className="text-[11px] text-slate-400">Real-time ticket telemetry</span>
        </div>
      </div>

      {/* Single Ticket Delete Confirmation Dialog */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Ticket {ticketToDelete.ticketNumber}?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete ticket <span className="font-semibold text-slate-800">"{ticketToDelete.title}"</span>? This action cannot be undone.
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
                  onDeleteTicket(ticketToDelete.id);
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

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete {selectedTicketIds.length} Selected Tickets?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-slate-800">{selectedTicketIds.length} tickets</span>? All associated notes, audit history, and records will be removed.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onBulkDelete(selectedTicketIds);
                  setSelectedTicketIds([]);
                  setShowBulkDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete {selectedTicketIds.length} Tickets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
