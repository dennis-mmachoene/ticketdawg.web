import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, RefreshCw, Send, RotateCcw, CheckCircle, XCircle, AlertCircle, ScanLine } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const statusMeta = {
  unused: { label: 'Available', cls: 'bg-secondary-100 text-secondary-700' },
  sent: { label: 'Sent', cls: 'bg-blue-100 text-blue-700' },
  used: { label: 'Checked in', cls: 'bg-green-100 text-green-700' },
};

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState('');

  const [checkinId, setCheckinId] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTickets = async () => {
    setIsLoading(true); setError(''); setMsg('');
    try {
      let resp;
      if (query.trim()) resp = await api.searchTickets(query.trim());
      else resp = await api.getAllTickets({ status: statusFilter, limit: 500 });
      setTickets(resp.data.tickets || []);
    } catch (e) {
      setError(e.message || 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const onSearch = (e) => { e.preventDefault(); loadTickets(); };

  const doResend = async (t) => {
    setActingId(t._id); setMsg(''); setError('');
    try { const r = await api.resendTicket(t._id); setMsg(r.message || 'Ticket re-sent'); }
    catch (e) { setError(e.message || 'Could not resend'); }
    finally { setActingId(''); }
  };

  const doRevoke = async (t) => {
    if (!window.confirm(`Revoke ticket ${t.ticketID}? It frees the ticket and the current QR stops working.`)) return;
    setActingId(t._id); setMsg(''); setError('');
    try { await api.revokeTicket(t._id); setMsg(`Ticket ${t.ticketID} revoked and freed.`); await loadTickets(); }
    catch (e) { setError(e.message || 'Could not revoke'); }
    finally { setActingId(''); }
  };

  const doCheckin = async (e) => {
    e.preventDefault();
    if (!checkinId.trim()) return;
    setCheckingIn(true); setCheckinResult(null);
    try {
      const r = await api.checkInByTicketId(checkinId.trim());
      setCheckinResult({ type: 'success', text: `Checked in: ${r.data?.email || r.data?.ticketID}` });
      setCheckinId('');
      loadTickets();
    } catch (err) {
      let text = err.message || 'Check-in failed';
      if (err.data?.usedBy) text = `Already used${err.data.usedAt ? ' at ' + new Date(err.data.usedAt).toLocaleString() : ''} by ${err.data.usedBy}`;
      setCheckinResult({ type: 'error', text });
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="section-padding">
      <div className="container-custom space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Tickets</h1>
          <p className="text-secondary-600 mt-1">Look up a ticket, resend it, revoke it, or check someone in by ID</p>
        </div>

        {/* Manual check-in */}
        <div className="card border-l-4 border-l-primary-500">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center space-x-2"><ScanLine size={18} /><span>Manual check-in by Ticket ID</span></h2>
          <form onSubmit={doCheckin} className="flex flex-col sm:flex-row gap-3">
            <input value={checkinId} onChange={(e) => setCheckinId(e.target.value)} className="input flex-1" placeholder="e.g. ASAMTT3M3TREAXU0" />
            <button type="submit" disabled={checkingIn} className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50">
              <CheckCircle size={16} /><span>{checkingIn ? 'Checking...' : 'Check in'}</span>
            </button>
          </form>
          {checkinResult && (
            <div className={`mt-4 rounded-lg p-3 flex items-center space-x-2 text-sm ${checkinResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {checkinResult.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>{checkinResult.text}</span>
            </div>
          )}
          <p className="text-xs text-secondary-500 mt-3">Use this when a camera or phone can't scan. The Ticket ID is printed on the PDF and shown in the ticket email.</p>
        </div>

        {/* Search / filter */}
        <div className="card">
          <form onSubmit={onSearch} className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Search by email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-secondary-400" /></div>
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-10" placeholder="student@tut4life.ac.za (leave blank to list all)" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input" disabled={!!query.trim()}>
                <option value="">All</option>
                <option value="unused">Available</option>
                <option value="sent">Sent</option>
                <option value="used">Checked in</option>
              </select>
            </div>
            <button type="submit" className="btn-primary flex items-center justify-center space-x-2"><RefreshCw size={16} /><span>Load</span></button>
          </form>
        </div>

        {msg && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{msg}</div>}
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center space-x-2"><AlertCircle size={16} /><span>{error}</span></div>}

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Results</h3>
              <span className="text-sm text-secondary-500">{tickets.length} ticket(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Issued by</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Checked in by</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {tickets.map((t) => {
                    const meta = statusMeta[t.status] || statusMeta.unused;
                    return (
                      <tr key={t._id} className="hover:bg-secondary-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-secondary-900">{t.ticketID}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">{t.email || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>{meta.label}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{t.issuedBy?.username || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{t.usedBy?.username || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            {t.email && t.status !== 'unused' && (
                              <button onClick={() => doResend(t)} disabled={actingId === t._id} className="btn-secondary text-xs flex items-center space-x-1 disabled:opacity-50"><Send size={12} /><span>Resend</span></button>
                            )}
                            {t.status !== 'unused' && (
                              <button onClick={() => doRevoke(t)} disabled={actingId === t._id} className="text-xs flex items-center space-x-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-50"><RotateCcw size={12} /><span>Revoke</span></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {tickets.length === 0 && <p className="text-center text-secondary-500 py-8">No tickets found.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
