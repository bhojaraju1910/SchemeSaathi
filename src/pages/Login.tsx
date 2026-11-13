import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    let wasExplicitLogout = false;
    try {
      wasExplicitLogout = sessionStorage.getItem('schemesaathi_explicit_logout') === '1';
    } catch {
      wasExplicitLogout = false;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(wasExplicitLogout ? '/dashboard' : from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoUserLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login('demo@schemesaathi.test', 'Demo@123');
      navigate('/recommendations', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Demo user login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login('admin@schemesaathi.test', 'Admin@123');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Admin demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Form Card */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-base text-[var(--text-muted)]">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[6px] text-sm font-medium text-[var(--error)]" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                {t('auth.email')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. citizen@example.com"
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2.5 pr-12 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] mt-2 py-2.5 px-4 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-base rounded-[6px] transition-colors duration-150 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t('auth.loginBtn')}</span>
            </button>
          </form>

          {/* Demo Fast Login Buttons */}
          <div className="pt-5 border-t border-[var(--border)] space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Demo Review Access
            </p>
            <button
              type="button"
              onClick={handleDemoUserLogin}
              disabled={loading}
              className="w-full min-h-[44px] py-2 px-4 bg-[var(--surface)] hover:border-[var(--teal)] border border-[var(--border)] text-[var(--text-primary)] hover:text-[var(--teal)] text-sm font-semibold rounded-[6px] transition-colors duration-150 cursor-pointer"
            >
              {t('auth.demoLoginUser')}
            </button>
            <button
              type="button"
              onClick={handleDemoAdminLogin}
              disabled={loading}
              className="w-full min-h-[44px] py-2 px-4 bg-[var(--surface)] hover:border-[var(--teal)] border border-[var(--border)] text-[var(--text-primary)] hover:text-[var(--teal)] text-sm font-semibold rounded-[6px] transition-colors duration-150 cursor-pointer"
            >
              {t('auth.demoLoginAdmin')}
            </button>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-semibold underline underline-offset-2">
              {t('nav.register')}
            </Link>
          </p>
        </div>

        {/* Deep Band Benefits Panel */}
        <aside className="lg:col-span-5 hero-band-bg text-[var(--deep-text)] border border-[var(--deep-border)] rounded-[6px] p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-[6px] text-xs font-semibold bg-[var(--saffron)] text-[var(--saffron-text)]">
              Family-First Public Guide
            </span>
            <h2 className="text-[22px] font-bold text-[var(--deep-text)] leading-snug">
              Find schemes built for your household
            </h2>
            <p className="text-sm text-[var(--deep-muted)] leading-relaxed">
              Sign in to save your family profile, see clearly explained eligibility reasons, and bookmark official department application links.
            </p>
            <ul className="space-y-3 pt-2 text-sm text-[var(--deep-muted)]">
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-[var(--saffron)]">1.</span>
                <span>Zero Aadhaar numbers, phone numbers, or bank details required.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-[var(--saffron)]">2.</span>
                <span>Plain-language guidance in English, ಕನ್ನಡ (Kannada), and हिन्दी (Hindi).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-[var(--saffron)]">3.</span>
                <span>Direct links to official State and Central government portals.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-[var(--deep-muted)] pt-4 border-t border-[var(--deep-border)]">
            Information is for guidance only. Please confirm eligibility on the official website.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default Login;
