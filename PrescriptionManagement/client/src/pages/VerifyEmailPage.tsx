import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { MailCheck, Loader } from 'lucide-react';

// Email from ?email=... — set by SignUpPage / LoginPage redirects
const emailFromQuery = () =>
  new URLSearchParams(window.location.search).get('email') || '';

const VerifyEmailPage: React.FC = () => {
  const { verifyEmail, loading } = useAuth();
  const [, navigate] = useLocation();
  const [email] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    try {
      await verifyEmail(email, code.trim());
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-600 mb-6">
          We sent a 6-digit code to <span className="font-medium text-gray-900">{email || 'your email'}</span>.
          Enter it below to activate your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full text-center text-3xl tracking-[0.5em] font-mono px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (<><Loader className="w-4 h-4 animate-spin" /> Verifying...</>) : 'Verify & continue'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6">
          Didn't get it? Check spam, or sign in with your email and password — we'll send a fresh code.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
