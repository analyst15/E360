import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { PriorityBadge, CategoryBadge } from './Badges';
import { formatTimeAgo } from '../utils/time';
import {
  Plus,
  MessageSquare,
  Clock,
  User,
  Laptop,
  MoreHorizontal,
  ArrowRight,
  Flame,
  AlertTriangle,
} from 'lucide-react';

interface TicketKanbanViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onOpenCreateTicket: () => void;
}

const COLUMNS: { status: TicketStatus; label: string; color: string; border: string }[] = [
  { status: 'Open', label: 'Open / Triage', color: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
  { status: 'In Progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800', border: 'border-amber-200' },
  { status: 'Waiting on User', label: 'Waiting on User', color: 'bg-purple-100 text-purple-800', border: 'border-purple-200' },
  { status: 'Escalated', label: 'Escalated (Tier 2/3)', color: 'bg-rose-100 text-rose-800', border: 'border-rose-200' },
  { status: 'Resolved', label: 'Resolved / Closed', color: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' },
];

export const TicketKanbanView: React.FC<TicketKanbanViewProps> = ({
  tickets,
  onSelectTicket,
  onUpdateTicketStatus,
  onOpenCreateTicket,
}) => {
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTicketId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedTicketId;
    if (id) {
      onUpdateTicketStatus(id, targetStatus);
    }
    setDraggedTicketId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start min-h-[600px] overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colTickets = tickets.filter(t => {
            if (col.status === 'Resolved') {
              return t.status === 'Resolved' || t.status === 'Closed';
            }
            return t.status === col.status;
          });

          const isOver = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.status)}
              className={`bg-slate-50 border rounded-xl flex flex-col max-h-[82vh] transition-all shadow-xs ${
                isOver ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50' : 'border-slate-200'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 bg-white/70 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${col.color} ${col.border}`}>
                    {colTickets.length}
                  </span>
                  <h3 className="font-semibold text-xs text-slate-800">{col.label}</h3>
                </div>

                {col.status === 'Open' && (
                  <button
                    onClick={onOpenCreateTicket}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                    title="Add Ticket"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cards Container */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                {colTickets.map(ticket => {
                  return (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={e => handleDragStart(e, ticket.id)}
                      onClick={() => onSelectTicket(ticket)}
                      className="p-3.5 bg-white hover:shadow-md border border-slate-200/90 hover:border-blue-300 rounded-lg shadow-xs cursor-grab active:cursor-grabbing transition-all select-none group"
                    >
                      {/* Card Header: Ticket Number & Priority */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {ticket.ticketNumber}
                        </span>
                        <PriorityBadge priority={ticket.priority} showIcon={false} />
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                        {ticket.title}
                      </h4>

                      {/* Category & Asset Tag */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                        <CategoryBadge category={ticket.category} showIcon={false} />
                        {ticket.assetId && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                            {ticket.assetId}
                          </span>
                        )}
                      </div>

                      {/* Footer: Assignee, Reporter, Comments */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[90px]" title={ticket.assignedAgent}>
                            {ticket.assignedAgent === 'Unassigned' ? 'Unassigned' : ticket.assignedAgent.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>{ticket.comments.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colTickets.length === 0 && (
                  <div className="h-28 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 italic">
                    Drag tickets here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
