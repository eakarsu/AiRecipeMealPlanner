import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setError('No verification token provided.');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await api.post('/auth/verify-email', { token });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Verification failed. The link may have expired.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      setResent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <span className="text-5xl mb-4 block">✅</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">Your email has been verified successfully. You can now sign in.</p>
            <Link
              to="/login"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Sign In
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <span className="text-5xl mb-4 block">❌</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>

            {resent ? (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-4">
                A new verification email has been sent. Please check your inbox.
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 mb-4"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}

            <div className="mt-4">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailVerification;
