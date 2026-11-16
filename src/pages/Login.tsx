import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import { EyeIcon, EyeOffIcon, LoaderIcon } from '../components/Icons';

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
    <div className="pb-12 animate-fade-up">
      <PageHero
        compact
        eyebrow="Account Access"
        title={
          <>
            Welcome <AccentWord>Back</AccentWord>
          </>
        }
        subtitle={t('auth.loginSubtitle')}
      />

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Form Card */}
          <div className="lg:col-span-7 editorial-card p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="space-y-1">
              <p className="eyebrow text-[var(--accent-ink)]">Member Sign-In</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)] leading-tight">
                {t('auth.loginTitle')}
              </h2>
            </div>

          {error && (
            <div
              className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[12px] text-sm font-semibold text-[var(--error)]"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                {t('auth.email')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. citizen@example.com"
                required
                className="editorial-input w-full px-4 py-2.5 text-base placeholder:text-[var(--muted)]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
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
                  className="editorial-input w-full px-4 py-2.5 pr-12 text-base placeholder:text-[var(--muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="min-h-[42px] min-w-[42px] inline-flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--navy)] cursor-pointer rounded-full"
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent-pill w-full mt-2 py-3 px-6 text-base inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <LoaderIcon size={18} />}
              <span>{t('auth.loginBtn')}</span>
            </button>
          </form>

          {/* Demo Fast Login Buttons */}
          <div className="pt-5 border-t border-[var(--line)] space-y-3">
            <p className="eyebrow text-[var(--muted)]">Demo Review Access</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDemoUserLogin}
                disabled={loading}
                className="btn-outline-pill w-full min-h-[46px] py-2 px-4 text-xs sm:text-sm cursor-pointer"
              >
                {t('auth.demoLoginUser')}
              </button>
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                disabled={loading}
                className="btn-outline-pill w-full min-h-[46px] py-2 px-4 text-xs sm:text-sm cursor-pointer"
              >
                {t('auth.demoLoginAdmin')}
              </button>
            </div>
          </div>

          <p className="text-sm text-[var(--muted)]">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="text-[var(--accent-ink)] font-bold hover:underline underline-offset-4"
            >
              {t('nav.register')}
            </Link>
          </p>
        </div>

        {/* Dark Navy Glow Panel */}
        <aside className="lg:col-span-5 hero-editorial-bg text-[var(--cream)] border border-[var(--line-dark)] rounded-[16px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 shadow-[var(--shadow-float)]">
          <div className="space-y-4">
            <p className="eyebrow text-[var(--accent)]">Family-First Public Guide</p>
            <h2 className="font-display text-3xl font-bold text-[var(--cream)] leading-tight">
              Find schemes built for your <AccentWord>household</AccentWord>
            </h2>
            <p className="text-sm text-[var(--muted-dark)] leading-relaxed">
              Sign in to save your family profile, inspect plain-language eligibility checks, and prepare required document checklists.
            </p>
            <ul className="space-y-3.5 pt-4 border-t border-[var(--line-dark)] text-sm text-[var(--muted-dark)]">
              <li className="flex items-start gap-2.5">
                <span className="font-display font-bold text-[var(--accent)] tabular-nums">01.</span>
                <span>Zero Aadhaar numbers, phone numbers, or bank details required.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-display font-bold text-[var(--accent)] tabular-nums">02.</span>
                <span>Clear guidance in English, ಕನ್ನಡ (Kannada), and हिन्दी (Hindi).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-display font-bold text-[var(--accent)] tabular-nums">03.</span>
                <span>Direct links to official State and Central government portals.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-[var(--muted-dark)] pt-4 border-t border-[var(--line-dark)]">
            {t('disclaimer')}
          </p>
        </aside>
        </div>
      </div>
    </div>
  );
};

export default Login;
