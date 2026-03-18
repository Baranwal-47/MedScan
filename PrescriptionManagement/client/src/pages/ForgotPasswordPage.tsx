import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await forgotPassword(email);
      setEmailSent(true);
      setMessage('Password reset link sent to your email!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Don't worry, we'll send you reset instructions
          </p>
        </div>

        {!emailSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send reset instructions
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>We sent a password reset link to</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {setEmailSent(false); setMessage(''); setEmail('');}}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
