import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Mail, 
  Send, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Clock,
  Info
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const IssueTicket = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastIssuedTicket, setLastIssuedTicket] = useState(null);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.assignTicket(trimmedEmail);
      
      setLastIssuedTicket(response.data);
      setEmail('');
      
    } catch (error) {
      let errorMessage = 'Failed to issue ticket. Please try again.';
      
      if (error.message.includes('already has a ticket')) {
        errorMessage = 'This email already has a ticket assigned.';
      } else if (error.message.includes('No tickets available')) {
        errorMessage = 'No tickets available. All 65 tickets have been issued.';
      } else if (error.message.includes('Invalid email format')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setLastIssuedTicket(null);
    setError('');
  };

  return (
    <div className="section-padding">
      <div className="container-custom max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Issue Ticket</h1>
          <p className="text-secondary-600">
            Assign a ticket to a student's email address
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Student Information
                  </h2>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Student Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="student@university.ac.za"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    The ticket will be sent to this email address as a PDF attachment
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner" />
                        <span>Issuing Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Issue Ticket</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={clearForm}
                    disabled={isLoading}
                    className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={16} />
                    <span>Clear</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Success Message */}
            {lastIssuedTicket && (
              <div className="card bg-primary-50 border-primary-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-900 mb-3">
                      Ticket Issued Successfully!
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-primary-200 last:border-b-0">
                        <span className="font-medium text-primary-800">Issued At:</span>
                        <span className="text-primary-700">
                          {new Date(lastIssuedTicket.issuedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructions */}
            <div className="card border-l-4 border-l-blue-500">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center space-x-2">
                <Info size={18} />
                <span>Instructions</span>
              </h3>
              <ul className="space-y-3 text-sm text-secondary-600">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Enter the student's email address</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>The system will automatically assign an available ticket</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>A PDF ticket with QR code will be sent to their email</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Students must present the PDF at the entrance</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Each email can only receive one ticket</span>
                </li>
              </ul>
            </div>

            {/* Event Details */}
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Calendar size={18} />
                <span>Event Details</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-primary-200" />
                  <span className="font-medium">04 October 2025</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-primary-200" />
                  <span className="font-medium">Starts at 12:00</span>
                </div>
                <div className="pt-2 border-t border-primary-400">
                  <p className="text-primary-100 text-sm space-y-1">
                    <span className="block">🍾 BOB (Bring your own bottles)</span>
                    <span className="block">🍸 Free food and cocktails provided</span>
                    <span className="block">🚌 Free transport available</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action SA Branding */}
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">AS</span>
              </div>
              <h4 className="font-semibold text-primary-700 mb-1">
                Action SA Students Chapter
              </h4>
              <p className="text-xs text-secondary-600 mb-1">
                Thank you for making your voice heard
              </p>
              <p className="text-xs font-medium text-primary-600">
                #The Future is not a mistake
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueTicket; 