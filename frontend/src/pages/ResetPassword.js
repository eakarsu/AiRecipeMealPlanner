import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [strength, setStrength] = useState(null);
  const { resetPassword, checkPasswordStrength } = useAuth();

  const handlePasswordChange = async (value) => {
    setPassword(value);
    if (value.length >= 4) {
      try {
        const result = await checkPasswordStrength(value);
        setStrength(result);
      } catch {
        // Ignore strength check errors
      }
    } else {
      setStrength(null);
    }
  };

  const getStrengthColor = () => {
    if (!strength) return 'bg-gray-200';
    const score = strength.score || 0;
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-yellow-500';
    if (score === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (!strength) return '';
    const score = strength.score || 0;
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">🔒</span>
            <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-gray-600">Enter your new password</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                Password reset successfully! Redirecting to login...
              </div>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter new password"
                    minLength={8}
                  />
                  {strength && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getStrengthColor()}`}
                            style={{ width: `${((strength.score || 0) + 1) * 20}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{getStrengthLabel()}</span>
                      </div>
                      {strength.feedback && strength.feedback.length > 0 && (
                        <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
                          {strength.feedback.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (confirmPassword && password !== confirmPassword)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
