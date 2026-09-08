import React, { useState } from 'react';
import { api } from '../services/api';
import { Mail, Send, RotateCcw, CheckCircle, AlertCircle, Calendar, Clock, MapPin, Info } from 'lucide-react';

const IssueTicket = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastIssuedTicket, setLastIssuedTicket] = useState(null);
  const [error, setError] = useState('');

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setError('Please enter an email address'); return; }
    if (!validateEmail(trimmedEmail)) { setError('Please enter a valid email address'); return; }

    setIsLoading(true);
    try {
      const response = await api.assignTicket(trimmedEmail);
      setLastIssuedTicket(response.data);
      setEmail('');
    } catch (err) {
      let message = 'Failed to issue ticket. Please try again.';
      if (err.message.includes('already has a ticket')) message = 'This email already has a ticket.';
      else if (err.message.includes('No tickets available')) message = 'There are no tickets left to issue.';
      else if (err.message.includes('Invalid email')) message = 'Please enter a valid email address.';
      else if (err.message) message = err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => { setEmail(''); setLastIssuedTicket(null); setError(''); };

  return (
    <div className="section-padding">
      <div className="container-custom max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Issue Ticket</h1>
          <p className="text-secondary-600">Give a Pool Party ticket to a student who has voted</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-secondary-900">Student Information</h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">Student Email Address *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="student@tut4life.ac.za" disabled={isLoading} autoComplete="email" />
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">The Pool Party ticket (PDF + QR code) will be emailed to this address</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button type="submit" disabled={isLoading} className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1">
                    {isLoading ? (<><div className="loading-spinner" /><span>Issuing Ticket...</span></>) : (<><Send size={16} /><span>Issue Ticket</span></>)}
                  </button>
                  <button type="button" onClick={clearForm} disabled={isLoading} className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <RotateCcw size={16} /><span>Clear</span>
                  </button>
                </div>
              </form>
            </div>

            {lastIssuedTicket && (
              <div className="card bg-primary-50 border-primary-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-900 mb-3">Ticket Issued Successfully!</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-primary-200">
                        <span className="font-medium text-primary-800">Sent to:</span>
                        <span className="text-primary-700">{lastIssuedTicket.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-primary-800">Issued At:</span>
                        <span className="text-primary-700">{new Date(lastIssuedTicket.issuedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card border-l-4 border-l-blue-500">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center space-x-2"><Info size={18} /><span>Instructions</span></h3>
              <ul className="space-y-3 text-sm text-secondary-600">
                <li className="flex items-start space-x-2"><span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span><span>Confirm the student has voted</span></li>
                <li className="flex items-start space-x-2"><span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span><span>Enter their email address</span></li>
                <li className="flex items-start space-x-2"><span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span><span>A Pool Party ticket with QR code is emailed to them</span></li>
                <li className="flex items-start space-x-2"><span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span><span>Each email can only receive one ticket</span></li>
              </ul>
            </div>

            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2"><Calendar size={18} /><span>Event Details</span></h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2"><Calendar size={16} className="text-primary-200" /><span className="font-medium">19 September 2026</span></div>
                <div className="flex items-center space-x-2"><Clock size={16} className="text-primary-200" /><span className="font-medium">12:00 till late</span></div>
                <div className="flex items-center space-x-2"><MapPin size={16} className="text-primary-200" /><span className="font-medium">Ramawela Guest House</span></div>
                <div className="pt-2 border-t border-primary-400">
                  <p className="text-primary-100 text-sm">
                    <span className="block">🎵 Music · 🍔 Food · 🏊 Swimming</span>
                    <span className="block">Bring your towel · Snacks &amp; refreshments provided</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">AS</span>
              </div>
              <h4 className="font-semibold text-primary-700 mb-1">ActionSA Students Chapter</h4>
              <p className="text-xs text-secondary-600 mb-1">Thank you for making your voice heard</p>
              <p className="text-xs font-medium text-primary-600">#The Future is not a mistake</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueTicket;
