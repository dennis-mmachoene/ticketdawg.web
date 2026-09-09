import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setDone(false);
    if (!current || !next) { setError('Fill in all fields'); return; }
    if (next.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (next !== confirm) { setError('New password and confirmation do not match'); return; }
    setBusy(true);
    const res = await changePassword(current, next);
    setBusy(false);
    if (res.success) { setDone(true); setCurrent(''); setNext(''); setConfirm(''); }
    else setError(res.error || 'Could not change password');
  };

  return (
    <div className="section-padding">
      <div className="container-custom max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Change password</h1>
        <p className="text-secondary-600 mb-6">Update the password for your account.</p>

        <div className="card">
          {done && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 text-green-700 mb-6">
              <CheckCircle size={16} /><span className="text-sm">Password changed successfully.</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700 mb-6">
              <AlertCircle size={16} /><span className="text-sm">{error}</span>
            </div>
          )}
          <form onSubmit={submit} className="space-y-5">
            {[['Current password', current, setCurrent, 'current-password'], ['New password', next, setNext, 'new-password'], ['Confirm new password', confirm, setConfirm, 'new-password']].map(([label, val, setter, ac]) => (
              <div key={label}>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{label}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-secondary-400" /></div>
                  <input type="password" value={val} onChange={(e) => setter(e.target.value)} className="input pl-10" autoComplete={ac} disabled={busy} />
                </div>
              </div>
            ))}
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? 'Saving...' : 'Change password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
