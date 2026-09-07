import React, { useState, useEffect } from 'react';
import { KBArticle, TicketCategory, Ticket } from '../types';
import { CategoryBadge } from './Badges';
import {
  BookOpen,
  Search,
  Plus,
  ThumbsUp,
  Eye,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  User,
  Clock,
  Trash2,
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  articles: KBArticle[];
  onAddArticle: (article: KBArticle) => void;
  onDeleteArticle?: (id: string) => void;
  onUpvoteArticle: (id: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  articles,
  onAddArticle,
  onDeleteArticle,
  onUpvoteArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<KBArticle | null>(null);
  const [copiedStepIdx, setCopiedStepIdx] = useState<number | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (articleToDelete) setArticleToDelete(null);
        else if (selectedArticle) setSelectedArticle(null);
        else if (showCreateModal) setShowCreateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticle, showCreateModal, articleToDelete]);

  const confirmDelete = () => {
    if (!articleToDelete) return;
    if (onDeleteArticle) {
      onDeleteArticle(articleToDelete.id);
    }
    if (selectedArticle?.id === articleToDelete.id) {
      setSelectedArticle(null);
    }
    setArticleToDelete(null);
  };

  // New Article Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Software');
  const [newSummary, setNewSummary] = useState('');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newSteps, setNewSteps] = useState('');
  const [newPrevention, setNewPrevention] = useState('');

  const filteredArticles = articles.filter(a => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.rootCause.toLowerCase().includes(q) ||
      a.keywords.some(k => k.toLowerCase().includes(q)) ||
      a.symptoms.some(s => s.toLowerCase().includes(q))
    );
  });

  const handleCopyStep = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStepIdx(idx);
    setTimeout(() => setCopiedStepIdx(null), 2000);
  };

  const handleCreateArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const article: KBArticle = {
      id: `kb-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      summary: newSummary.trim(),
      symptoms: newSymptoms
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      rootCause: newRootCause.trim() || 'Configuration or system mismatch.',
      resolutionSteps: newSteps
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      prevention: newPrevention.trim() || undefined,
      keywords: [newCategory.toLowerCase(), 'troubleshooting', 'it-sop'],
      helpfulVotes: 1,
      views: 1,
      createdAt: new Date().toISOString(),
      author: 'IT Knowledge Team',
    };

    onAddArticle(article);
    setShowCreateModal(false);
    // Reset form
    setNewTitle('');
    setNewSummary('');
    setNewSymptoms('');
    setNewRootCause('');
    setNewSteps('');
    setNewPrevention('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Search */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              IT Knowledge Base & Standard Operating Procedures (SOP)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified troubleshooting workflows, self-service guides, and remediation procedures
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New KB Article
          </button>
        </div>

        {/* Search input and category filter chips */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, error codes, symptoms, or remediation steps..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Network & VPN">Network & VPN</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Access & IAM">Access & IAM</option>
            <option value="Email & Cloud">Email & Cloud</option>
            <option value="Security Incident">Security Incident</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map(article => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-white hover:border-blue-300 hover:shadow-md border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer transition-all group space-y-3 relative"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CategoryBadge category={article.category} />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    {article.views}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setArticleToDelete(article);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer transition-all opacity-70 group-hover:opacity-100"
                    title="Delete article"
                    aria-label={`Delete ${article.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                {article.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{article.summary}</p>
            </div>

            {/* Symptoms Tags Preview */}
            <div className="space-y-2 pt-2.5 border-t border-slate-100">
              <div className="flex flex-wrap gap-1">
                {article.symptoms.slice(0, 2).map((sym, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 line-clamp-1"
                  >
                    • {sym}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>By {article.author.split(' ')[0]}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ThumbsUp className="w-3 h-3" />
                  {article.helpfulVotes} helpful
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">No Knowledge Base articles found matching your query.</p>
            <p className="text-xs text-slate-400 mt-1">Try another search term or create a new article.</p>
          </div>
        )}
      </div>

      {/* Article Detail Reader Modal */}
      {selectedArticle && (
        <div
          id="kb-article-reader-backdrop"
          className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedArticle(null);
          }}
        >
          <div
            id="kb-article-reader-modal"
            className="bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto relative z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar - Guaranteed Visible & Sticky */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <CategoryBadge category={selectedArticle.category} />
                <span className="text-xs text-slate-500 font-medium truncate">
                  Authored by <strong className="text-slate-700">{selectedArticle.author}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="delete-kb-article-btn"
                  type="button"
                  onClick={() => setArticleToDelete(selectedArticle)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all shrink-0 flex items-center gap-1.5 shadow-2xs text-xs font-semibold"
                  title="Delete article"
                  aria-label="Delete article"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  id="close-kb-article-btn"
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shrink-0 flex items-center justify-center shadow-2xs"
                  title="Close article (Esc)"
                  aria-label="Close article dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Article Content - Smooth Internal Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs min-h-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">{selectedArticle.title}</h2>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {selectedArticle.summary}
                </p>
              </div>

              {/* Symptoms */}
              {selectedArticle.symptoms && selectedArticle.symptoms.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-red-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    Recognized Symptoms & Indicators
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-red-900 bg-red-50 p-3.5 rounded-xl border border-red-200">
                    {selectedArticle.symptoms.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Root Cause */}
              {selectedArticle.rootCause && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-amber-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Root Cause Analysis
                  </h4>
                  <p className="text-amber-950 bg-amber-50 p-3.5 rounded-xl border border-amber-200 leading-relaxed">
                    {selectedArticle.rootCause}
                  </p>
                </div>
              )}

              {/* Resolution Steps */}
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Step-by-Step Remediation Workflow
                </h4>
                <div className="space-y-2">
                  {selectedArticle.resolutionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-slate-800 leading-relaxed group"
                    >
                      <span>{step}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyStep(step, idx)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer transition-colors shadow-2xs"
                        title="Copy step"
                      >
                        {copiedStepIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention */}
              {selectedArticle.prevention && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-blue-800 uppercase tracking-wider text-[11px]">
                    Prevention & Hardening Tips
                  </h4>
                  <p className="text-slate-700 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 leading-relaxed">
                    {selectedArticle.prevention}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Bottom Footer */}
            <div className="p-3.5 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shrink-0 sticky bottom-0 z-20">
              <span className="text-slate-500 text-center sm:text-left">Was this article helpful to your investigation?</span>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setArticleToDelete(selectedArticle)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent cursor-pointer transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpvoteArticle(selectedArticle.id);
                    setSelectedArticle(prev => (prev ? { ...prev, helpfulVotes: prev.helpfulVotes + 1 } : null));
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes, this resolved my issue ({selectedArticle.helpfulVotes})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div
          id="kb-delete-confirm-backdrop"
          className="fixed inset-0 z-[120] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setArticleToDelete(null)}
        >
          <div
            id="kb-delete-confirm-modal"
            className="bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto relative z-[121]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Knowledge Article</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-slate-900 line-clamp-2">{articleToDelete.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <span>Category: <strong className="text-slate-700">{articleToDelete.category}</strong></span>
                <span>•</span>
                <span>By {articleToDelete.author}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this article? It will no longer appear in the IT Knowledge Base or employee self-service search.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-article-btn"
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Article Modal */}
      {showCreateModal && (
        <div
          id="kb-article-create-backdrop"
          className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div
            id="kb-article-create-modal"
            className="bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto relative z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Publish Standard Operating Procedure / KB Article
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-200 cursor-pointer transition-all shadow-2xs"
                title="Close modal (Esc)"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs min-h-0">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. How to Remediate Expired MDM Certificate in macOS 15"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Network & VPN">Network & VPN</option>
                    <option value="Access & IAM">Access & IAM</option>
                    <option value="Email & Cloud">Email & Cloud</option>
                    <option value="Security Incident">Security Incident</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Summary</label>
                  <input
                    type="text"
                    required
                    value={newSummary}
                    onChange={e => setNewSummary(e.target.value)}
                    placeholder="Brief 1-line overview of the guide"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Symptoms (1 per line)</label>
                <textarea
                  rows={2}
                  value={newSymptoms}
                  onChange={e => setNewSymptoms(e.target.value)}
                  placeholder="Error 403 authorization failed&#10;VPN disconnected immediately"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Root Cause Explanation</label>
                <input
                  type="text"
                  value={newRootCause}
                  onChange={e => setNewRootCause(e.target.value)}
                  placeholder="Keychain certificate authorization invalidated by OS update"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resolution Steps (1 per line)</label>
                <textarea
                  rows={4}
                  required
                  value={newSteps}
                  onChange={e => setNewSteps(e.target.value)}
                  placeholder="1. Open Terminal as admin&#10;2. Run sudo profiles renew -type enrollment&#10;3. Restart GlobalProtect client"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prevention Tips (Optional)</label>
                <input
                  type="text"
                  value={newPrevention}
                  onChange={e => setNewPrevention(e.target.value)}
                  placeholder="Ensure MDM enrollment is verified prior to rolling out major updates."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-all"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
