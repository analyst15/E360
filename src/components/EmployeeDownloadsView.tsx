import React from 'react';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { DOWNLOAD_DOCUMENTS } from '../data/downloadDocuments';

interface EmployeeDownloadsViewProps {
  employeeName?: string;
  employeeDepartment?: string;
  onRequestAssistanceWithForm?: (docTitle: string) => void;
}

export const EmployeeDownloadsView: React.FC<EmployeeDownloadsViewProps> = () => {
  return (
    <div className="space-y-4">
      {/* Forms & Downloads List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {DOWNLOAD_DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
          >
            {/* Title of the Form */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                {doc.title}
              </h3>
            </div>

            {/* Actions: Download Button & Open */}
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={doc.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.fileName || 'document.pdf'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>

              <a
                href={doc.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
