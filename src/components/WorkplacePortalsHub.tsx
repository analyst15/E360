import React, { useState } from 'react';
import { WORKPLACE_PORTALS, WorkplacePortal } from '../data/workplacePortals';
import {
  ExternalLink,
  Search,
  Building2,
  GraduationCap,
  Award,
  HeartHandshake,
  Copy,
  Check,
  LifeBuoy,
  Globe,
  Sparkles,
  FolderSync,
  Headphones,
} from 'lucide-react';

interface WorkplacePortalsHubProps {
  onRequestHelpWithPortal?: (portalName: string, portalUrl: string) => void;
  onOpenPortal?: (portalUrl: string) => void;
  compact?: boolean;
}

export const WorkplacePortalsHub: React.FC<WorkplacePortalsHubProps> = ({
  onRequestHelpWithPortal,
  onOpenPortal,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getPortalIcon = (id: string) => {
    switch (id) {
      case 'it-support-portal':
        return <LifeBuoy className="w-5 h-5 text-blue-600 shrink-0" />;
      case 'sharepoint-portal':
        return <FolderSync className="w-5 h-5 text-teal-600 shrink-0" />;
      case 'sapama-erp':
        return <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'secondary-portal':
        return <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />;
      case 'tertiary-portal':
        return <Award className="w-5 h-5 text-indigo-600 shrink-0" />;
      case 'care-share-portal':
        return <HeartHandshake className="w-5 h-5 text-rose-600 shrink-0" />;
      default:
        return <Globe className="w-5 h-5 text-slate-600 shrink-0" />;
    }
  };

  const handleCopy = (portal: WorkplacePortal) => {
    navigator.clipboard.writeText(portal.url);
    setCopiedId(portal.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPortals = WORKPLACE_PORTALS.filter((portal) => {
    const matchSearch =
      portal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portal.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portal.badge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portal.highlights.some((h) => h.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCat =
      selectedCategory === 'All' || portal.category === selectedCategory;

    return matchSearch && matchCat;
  });

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {WORKPLACE_PORTALS.map((portal) => (
          <div
            key={portal.id}
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${portal.colorScheme.bg} ${portal.colorScheme.border}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white shadow-2xs">
                  {getPortalIcon(portal.id)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {portal.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-[130px]">
                    {portal.url.replace('https://', '')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
              {portal.url.startsWith('/') ? (
                <button
                  type="button"
                  onClick={() => onOpenPortal?.(portal.url)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${portal.colorScheme.btnBg}`}
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${portal.colorScheme.btnBg}`}
                >
                  <span>Launch</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Staff Workplace Portals & Services
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-click access to all enterprise portals, ERP systems, and foundation workspaces.
          </p>
        </div>

        {/* Filter / Search input */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search work portals..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid of Work Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPortals.map((portal) => (
          <div
            key={portal.id}
            id={`portal-card-${portal.id}`}
            className={`p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${portal.colorScheme.bg} ${portal.colorScheme.border}`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    {getPortalIcon(portal.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {portal.name}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border ${portal.colorScheme.badgeBg}`}
                      >
                        {portal.badge}
                      </span>
                    </div>
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-mono mt-0.5"
                    >
                      {portal.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(portal)}
                  title="Copy link to clipboard"
                  className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                >
                  {copiedId === portal.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {portal.description}
              </p>

              {/* Highlights tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {portal.highlights.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200/90 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-3.5 border-t border-slate-200/70 flex items-center justify-between gap-3">
              {onRequestHelpWithPortal ? (
                <button
                  onClick={() => onRequestHelpWithPortal(portal.name, portal.url)}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer py-1.5 transition-colors"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Report Portal Issue</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  Official Staff Workspace
                </span>
              )}

              {portal.url.startsWith('/') ? (
                <button
                  type="button"
                  onClick={() => onOpenPortal?.(portal.url)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${portal.colorScheme.btnBg}`}
                >
                  <span>Launch IT Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${portal.colorScheme.btnBg}`}
                >
                  <span>Launch Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
