import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'kn' | 'hi'>('en');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(name, email, password, preferredLanguage);
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check inputs.');
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
              {t('auth.registerTitle')}
            </h1>
            <p className="text-base text-[var(--text-muted)]">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[6px] text-sm font-medium text-[var(--error)]" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                {t('auth.name')}
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                {t('auth.email')}
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. citizen@example.com"
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            <div>
              <label htmlFor="register-language" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                Preferred Language for Assistance
              </label>
              <select
                id="register-language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as any)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] cursor-pointer"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] mt-2 py-2.5 px-4 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-base rounded-[6px] transition-colors duration-150 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t('auth.registerBtn')}</span>
            </button>
          </form>

          <p className="text-sm text-[var(--text-muted)]">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-semibold underline underline-offset-2">
              {t('nav.login')}
            </Link>
          </p>
        </div>

        {/* Deep Band Benefits Panel */}
        <aside className="lg:col-span-5 hero-band-bg text-[var(--deep-text)] border border-[var(--deep-border)] rounded-[6px] p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-[6px] text-xs font-semibold bg-[var(--saffron)] text-[var(--saffron-text)]">
              Free & Private
            </span>
            <h2 className="text-[22px] font-bold text-[var(--deep-text)] leading-snug">
              Why create a SchemeSaathi account?
            </h2>
            <p className="text-sm text-[var(--deep-muted)] leading-relaxed">
              Your account saves your basic household details so you can quickly view updated matches and track schemes you plan to apply for.
            </p>
            <ul className="space-y-3 pt-2 text-sm text-[var(--deep-muted)]">
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-[var(--saffron)]">1.</span>
                <span>Transparent High and Medium alignment indicators for every scheme.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-[var(--saffron)]">2.</span>
                <span>Checklist of required documents before you visit a GramaOne or Seva Sindhu centre.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-[var(--saffron)]">3.</span>
                <span>Switch freely between English, Kannada, and Hindi at any time.</span>
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

export default Register;
