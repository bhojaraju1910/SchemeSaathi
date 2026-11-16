import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import { EyeIcon, EyeOffIcon, LoaderIcon } from '../components/Icons';

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
    <div className="pb-12 animate-fade-up">
      <PageHero
        compact
        eyebrow="Free Account"
        title={
          <>
            Create an <AccentWord>Account</AccentWord>
          </>
        }
        subtitle={t('auth.registerSubtitle')}
      />

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Form Card */}
          <div className="lg:col-span-7 editorial-card p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="space-y-1">
              <p className="eyebrow text-[var(--accent-ink)]">New Household Account</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)] leading-tight">
                {t('auth.registerTitle')}
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
              <label htmlFor="register-name" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                {t('auth.name')}
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
                className="editorial-input w-full px-4 py-2.5 text-base placeholder:text-[var(--muted)]"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                {t('auth.email')}
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. citizen@example.com"
                required
                className="editorial-input w-full px-4 py-2.5 text-base placeholder:text-[var(--muted)]"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
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

            <div>
              <label htmlFor="register-language" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                Preferred Language for Assistance
              </label>
              <select
                id="register-language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as 'en' | 'kn' | 'hi')}
                className="editorial-input w-full px-4 py-2.5 text-base cursor-pointer"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent-pill w-full mt-2 py-3 px-6 text-base inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <LoaderIcon size={18} />}
              <span>{t('auth.registerBtn')}</span>
            </button>
          </form>

          <p className="text-sm text-[var(--muted)]">
            {t('auth.haveAccount')}{' '}
            <Link
              to="/login"
              className="text-[var(--accent-ink)] font-bold hover:underline underline-offset-4"
            >
              {t('nav.login')}
            </Link>
          </p>
        </div>

        {/* Dark Navy Glow Panel */}
        <aside className="lg:col-span-5 hero-editorial-bg text-[var(--cream)] border border-[var(--line-dark)] rounded-[16px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 shadow-[var(--shadow-float)]">
          <div className="space-y-4">
            <p className="eyebrow text-[var(--accent)]">Free & Private</p>
            <h2 className="font-display text-3xl font-bold text-[var(--cream)] leading-tight">
              Why create a <AccentWord>SchemeSaathi</AccentWord> account?
            </h2>
            <p className="text-sm text-[var(--muted-dark)] leading-relaxed">
              Your account stores basic non-sensitive household details so you can quickly review relevant schemes and document checklists.
            </p>
            <ul className="space-y-3.5 pt-4 border-t border-[var(--line-dark)] text-sm text-[var(--muted-dark)]">
              <li className="flex items-start gap-2.5">
                <span className="font-display font-bold text-[var(--accent)] tabular-nums">01.</span>
                <span>Clear High and Medium indicators with exact matching rules shown.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-display font-bold text-[var(--accent)] tabular-nums">02.</span>
                <span>Personal document readiness checklist saved before visiting GramaOne or Seva Sindhu.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-display font-bold text-[var(--accent)] tabular-nums">03.</span>
                <span>Switch freely between English, Kannada, and Hindi at any time.</span>
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

export default Register;
