import React, { useState } from 'react';
import { Ticket, TicketComment, ITAsset } from '../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badges';
import { formatTimeAgo } from '../utils/time';
import {
  X,
  Send,
  User,
  Headphones,
  Laptop,
  CheckCircle2,
  Clock,
  Sparkles,
  Star,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Mail,
} from 'lucide-react';

interface EmployeeTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onAddComment: (ticketId: string, comment: Omit<TicketComment, 'id' | 'timestamp'>) => void;
  onRateTicket?: (ticketId: string, rating: number) => void;
  assets?: ITAsset[];
}

export const EmployeeTicketModal: React.FC<EmployeeTicketModalProps> = ({
  ticket,
  onClose,
  onAddComment,
  onRateTicket,
  assets = [],
}) => {
  const [replyText, setReplyText] = useState('');
  const [rating, setRating] = useState<number>(ticket.satisfactionRating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(Boolean(ticket.satisfactionRating));

  // Only show public messages to the employee (filter out internal technician notes)
  const publicComments = ticket.comments.filter(
    (c) => c.type === 'Public Reply' || c.type === 'AI Triage' || c.authorRole === 'User' || c.authorRole === 'Agent'
  );

  // Find asset match if any
  const matchedAsset = assets.find(
    (a) =>
      (ticket.assetId && (a.laptopSerialNumber === ticket.assetId || a.id === ticket.assetId)) ||
      a.employeeName.toLowerCase() === ticket.reporterName.toLowerCase()
  );

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    onAddComment(ticket.id, {
      authorName: ticket.reporterName || 'You (Employee)',
      authorEmail: ticket.reporterEmail || 'employee@enterprise.io',
      authorRole: 'User',
      type: 'Public Reply',
      content: replyText.trim(),
    });

    setReplyText('');
  };

  const handleSetRating = (stars: number) => {
    setRating(stars);
    setRatingSubmitted(true);
    if (onRateTicket) {
      onRateTicket(ticket.id, stars);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                {ticket.ticketNumber}
              </span>
              <CategoryBadge category={ticket.category} />
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">{ticket.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Status & Assignment Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Specialist</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Headphones className="w-3.5 h-3.5 text-blue-600" />
                {ticket.assignedAgent || 'IT Helpdesk Queue'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Date Submitted</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(ticket.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Associated Device</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5 truncate">
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
                {ticket.assetId
                  ? ticket.assetId
                  : matchedAsset
                  ? `${matchedAsset.laptopModel} (${matchedAsset.laptopSerialNumber})`
                  : 'General Workplace Tech'}
              </div>
            </div>
          </div>

          {/* Email Notification Dispatch Status */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Automated alert delivered to IT Admin (<strong>it@elimishawatoto.org</strong>) and IT Staff team.
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              Dispatched
            </span>
          </div>

          {/* Initial Problem Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial Issue Description</h3>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Resolution Notes Banner (if resolved) */}
          {ticket.status === 'Resolved' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                IT Support Resolution Complete
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {ticket.resolutionNotes || 'This issue has been marked as resolved by the IT specialist.'}
              </p>

              {/* Star Rating for Employee */}
              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-emerald-900">How was your support experience?</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={ratingSubmitted}
                      onClick={() => handleSetRating(star)}
                      onMouseEnter={() => !ratingSubmitted && setHoverRating(star)}
                      onMouseLeave={() => !ratingSubmitted && setHoverRating(0)}
                      className={`p-1 rounded-md transition-all ${
                        ratingSubmitted ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  {ratingSubmitted && (
                    <span className="text-[11px] font-semibold text-emerald-700 ml-1">
                      Thanks for rating ({rating}/5)!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Conversation & Updates Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Conversation History ({publicComments.length})
            </h3>

            <div className="space-y-3">
              {publicComments.map((comment) => {
                const isUser = comment.authorRole === 'User';
                const isAgent = comment.authorRole === 'Agent';

                return (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl border text-xs sm:text-sm space-y-2 ${
                      isUser
                        ? 'bg-blue-50/60 border-blue-200 ml-4'
                        : isAgent
                        ? 'bg-white border-slate-200 mr-4 shadow-2xs'
                        : 'bg-indigo-50/50 border-indigo-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isUser ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                          }`}
                        >
                          {isUser ? 'You' : 'IT'}
                        </div>
                        <strong className="text-slate-900">{comment.authorName}</strong>
                        <span className="text-[11px] text-slate-400">
                          {isUser ? '(Employee)' : '(IT Support Specialist)'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatTimeAgo(comment.timestamp)}</span>
                    </div>

                    <div className="text-slate-800 leading-relaxed whitespace-pre-wrap pl-8">
                      {comment.content}
                    </div>
                  </div>
                );
              })}

              {publicComments.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  No replies yet. An IT support agent will respond to your request shortly.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <form onSubmit={handleSendReply} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type a reply or additional information for the IT specialist..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Reply</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
