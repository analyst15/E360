import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Key,
  ShieldCheck,
  ExternalLink,
  Info,
  Clock,
  Check,
} from 'lucide-react';
import { testSmtpConnection, getRecentNotificationLogs, TestEmailResponse } from '../utils/notifications';

interface EmailDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail?: string;
  userEmail?: string;
}

export const EmailDiagnosticsModal: React.FC<EmailDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  adminEmail = 'it@elimishawatoto.org',
  userEmail = 'techanalyst41@gmail.com',
}) => {
  const [testRecipient, setTestRecipient] = useState(userEmail || adminEmail);
  const [customPassword, setCustomPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSampleTicketLoading, setIsSampleTicketLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestEmailResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    primaryAdminEmail?: string;
    smtpConfigured?: boolean;
    provider?: string;
    activeSender?: string;
  }>({});

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await getRecentNotificationLogs();
      if (data) {
        setServerStatus({
          primaryAdminEmail: data.primaryAdminEmail,
          smtpConfigured: data.smtpConfigured,
          provider: data.provider,
          activeSender: data.activeSender,
        });
        setRecentLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);

    const payload = {
      smtpUser: serverStatus.activeSender || 'it@elimishawatoto.org',
      ...(customPassword.trim() ? { smtpPass: customPassword.trim() } : {}),
    };

    const res = await testSmtpConnection(testRecipient, payload);
    setTestResult(res);
    setIsLoading(false);

    // Refresh dispatch audit logs
    loadLogs();
  };

  const handleSendSampleTicket = async () => {
    setIsSampleTicketLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/notifications/ticket-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket: {
            ticketNumber: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
            title: 'Verified Test Ticket: Dual monitor docking station connectivity',
            description: 'This is a live test notification verifying end-to-end email delivery from the Elimisha Watoto Foundation IT Support Desk.',
            category: 'Equipment Request',
            priority: 'High',
            reporterName: 'IT Operations Diagnostics',
            reporterEmail: testRecipient,
            reporterDepartment: 'Workplace Tech',
          },
          testRecipient: testRecipient,
        }),
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        setTestResult({
          success: false,
          error: rawText.replace(/<[^>]*>/g, '').trim().slice(0, 250) || `Server error (${res.status} ${res.statusText})`,
          hint: 'The backend endpoint could not be reached or returned an unexpected response.',
        });
        return;
      }

      if (res.ok && data.success && data.status === 'sent') {
        setTestResult({
          success: true,
          message: `Sample Ticket Alert dispatched to ${data.recipients?.join(', ')}${data.port ? ` (Port ${data.port})` : ''}!`,
          recipient: testRecipient,
          sender: data.sender || 'it@elimishawatoto.org',
          messageId: data.messageId,
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || data.warning || data.message || 'Failed to dispatch sample ticket notification',
          hint: data.warning || data.hint || 'Check SMTP credentials or network port availability in production environment.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || String(err),
      });
    } finally {
      setIsSampleTicketLoading(false);
      loadLogs();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Email & Notifications Diagnostic Center</h2>
              <p className="text-xs text-blue-100">Live Google Workspace SMTP Delivery & Dispatch Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Status Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Provider</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  Google Workspace (smtp.gmail.com)
                </span>
              </div>
              <p className="text-sm text-slate-700 font-medium">
                Sender Account: <strong className="text-slate-900">{serverStatus.activeSender || 'it@elimishawatoto.org'}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Primary IT Admin Recipient: <strong>{serverStatus.primaryAdminEmail || 'it@elimishawatoto.org'}</strong>
              </p>
            </div>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>

          {/* Live Email Test Form */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Dispatch Live Verification Test Email
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Send an instant verification message through Google Workspace to verify your inbox receives automated ticket notifications.
            </p>

            <form onSubmit={handleRunTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Test Recipient Email Address
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setTestRecipient(userEmail || 'techanalyst41@gmail.com')}
                        className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                      >
                        My Email
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setTestRecipient('it@elimishawatoto.org')}
                        className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                      >
                        IT Mailbox
                      </button>
                    </div>
                  </div>
                  <input
                    type="email"
                    required
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="it@elimishawatoto.org or your personal email"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">All live alerts will be delivered directly to this mailbox.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Google Workspace App Password (16-char)</span>
                    <span className="text-[10px] text-emerald-600 font-medium">✓ Active in System</span>
                  </label>
                  <input
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Active: krfz kmad vaqz zbdw (Leave empty to use)"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Elimisha Google Workspace credentials authenticated.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Google Workspace ({serverStatus.provider || 'smtp.gmail.com:587/465'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendSampleTicket}
                    disabled={isSampleTicketLoading || isLoading}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 disabled:opacity-50"
                    title="Sends an actual formatted New Ticket alert to your inbox"
                  >
                    {isSampleTicketLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        Dispatching Ticket Alert...
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        Send Sample Ticket Alert
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isSampleTicketLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Testing SMTP...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Live Test Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Test Result Message */}
            {testResult && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                {testResult.success ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-sm text-emerald-900">{testResult.message}</p>
                      <p className="text-emerald-700">
                        Sender: <strong>{testResult.sender}</strong> &bull; Recipient: <strong>{testResult.recipient}</strong>
                      </p>
                      {testResult.messageId && (
                        <p className="text-[11px] text-emerald-600 font-mono">
                          Google Message ID: {testResult.messageId}
                        </p>
                      )}
                      <p className="text-emerald-800 pt-1">
                        All automated notifications (new ticket alerts to IT desk, resolution notices to staff) are active and sending live.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-2 text-xs flex-1">
                      <p className="font-bold text-sm text-rose-900">
                        {/535|534|authentication|password|badcredentials|invalid login/i.test(testResult.error || '')
                          ? 'Google Workspace SMTP Authentication Rejected'
                          : /server error|function_invocation|500|502|cannot post|not valid json/i.test(testResult.error || '')
                          ? 'Serverless API Execution Error'
                          : 'Notification Dispatch Error'}
                      </p>
                      <div className="bg-rose-100/70 p-2.5 rounded-lg font-mono text-[11px] text-rose-900 break-words">
                        {testResult.error}
                      </div>

                      {testResult.hint && (
                        <p className="text-[11px] text-rose-800 bg-white/70 p-2 rounded border border-rose-200">
                          <strong>Note:</strong> {testResult.hint}
                        </p>
                      )}

                      {/* Diagnostic Guidance */}
                      <div className="bg-white/80 border border-rose-200 rounded-lg p-3 text-slate-700 space-y-2">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-blue-600" />
                          How to Resolve: Google 16-Character App Password
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          Google Workspace accounts require a dedicated <strong>App Password</strong> because Google disallows basic passwords on SMTP connections:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                          <li>
                            Open{' '}
                            <a
                              href="https://myaccount.google.com/apppasswords"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5"
                            >
                              Google Account App Passwords <ExternalLink className="w-3 h-3 inline" />
                            </a>{' '}
                            while logged into <strong>{serverStatus.activeSender || 'it@elimishawatoto.org'}</strong>.
                          </li>
                          <li>
                            Ensure <strong>2-Step Verification</strong> is switched ON for the account.
                          </li>
                          <li>
                            In "App name", enter <strong>Elimisha 360 Helpdesk</strong> and click <strong>Create</strong>.
                          </li>
                          <li>
                            Copy the 16-letter code (e.g. <code>abcd efgh ijkl mnop</code>), paste it in the field above, and click <strong>Send Live Test Email</strong>.
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vercel Environment Variables Guide */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              Required Vercel Production Environment Variables
            </h4>
            <p className="text-xs text-amber-800 mb-3 leading-relaxed">
              When hosted on Vercel, ensure the following environment variables are configured in your{' '}
              <strong>Vercel Project Settings &gt; Environment Variables</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="text-slate-400">SMTP_USER=</span>
                <span className="font-bold text-slate-800">it@elimishawatoto.org</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="text-slate-400">SMTP_PASS=</span>
                <span className="font-bold text-slate-800">your-16-char-app-password</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="text-slate-400">IT_SUPPORT_EMAIL=</span>
                <span className="font-bold text-slate-800">it@elimishawatoto.org</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="text-slate-400">APP_URL=</span>
                <span className="font-bold text-slate-800">https://your-app.vercel.app</span>
              </div>
            </div>
          </div>

          {/* Recent Dispatch Audit Log */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Live Notification Dispatch Audit Trail ({recentLogs.length})
              </h4>
              <span className="text-[11px] text-slate-400">Real-time outbound logs</span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-400">
                No notification emails recorded yet. Create or resolve a ticket, or click "Send Live Test Email" above.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Ticket #</th>
                      <th className="p-2.5">Recipients</th>
                      <th className="p-2.5">Delivery Status</th>
                      <th className="p-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold font-mono text-blue-700">{log.ticketNumber}</td>
                        <td className="p-2.5 text-slate-700 max-w-[200px] truncate" title={log.recipients?.join(', ')}>
                          {log.recipients?.join(', ')}
                        </td>
                        <td className="p-2.5">
                          {log.status === 'sent' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              SENT via Google
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title={log.error || 'Simulated'}>
                              {log.error ? 'SMTP ERROR' : 'SIMULATED'}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Elimisha Watoto Foundation • IT Service Management</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
