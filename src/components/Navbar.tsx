import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login', { replace: true, state: null });
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/schemes', label: t('nav.schemes') },
    ...(user
      ? [
          { to: '/recommendations', label: t('nav.recommendations') },
          { to: '/saved', label: t('nav.saved') },
          { to: '/dashboard', label: t('nav.dashboard') },
        ]
      : []),
    ...(user && user.role === 'admin'
      ? [{ to: '/admin', label: t('nav.admin') }]
      : []),
  ];

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Left: Brand text with small teal mark */}
          <div className="flex items-center gap-8 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-[20px] sm:text-[22px] font-bold tracking-tight text-[var(--text-primary)] hover:text-[var(--teal)] transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--teal)" />
                <path
                  d="M7.5 12.2l3 3 6-6.2"
                  stroke="var(--surface)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                Scheme<span className="text-[var(--teal)]">Saathi</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {navLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`py-1 text-base font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 ${
                      active
                        ? 'text-[var(--teal)] border-[var(--teal)]'
                        : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Compact auth links + Language selector (Desktop) */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {user ? (
              <div className="flex items-center gap-4 text-sm">
                <Link
                  to="/profile"
                  className={`font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive('/profile')
                      ? 'text-[var(--teal)] underline underline-offset-4'
                      : 'text-[var(--text-primary)] hover:text-[var(--teal)]'
                  }`}
                  title="Manage Family Profile"
                >
                  {user.name.split(' ')[0]}
                  {user.role === 'admin' ? ' (Admin)' : ''}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--error)] transition-colors duration-150 cursor-pointer whitespace-nowrap"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <Link
                  to="/login"
                  className={`font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive('/login')
                      ? 'text-[var(--teal)] underline underline-offset-4'
                      : 'text-[var(--text-primary)] hover:text-[var(--teal)]'
                  }`}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className={`font-semibold whitespace-nowrap transition-colors duration-150 ${
                    isActive('/register')
                      ? 'text-[var(--teal-hover)] underline underline-offset-4'
                      : 'text-[var(--teal)] hover:text-[var(--teal-hover)]'
                  }`}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            <div className="h-5 w-px bg-[var(--border)]" aria-hidden="true" />
            <LanguageSelector />
          </div>

          {/* Mobile: Language selector + Menu toggle */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--teal)] transition-colors duration-150 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface)] border-t border-[var(--border)] px-4 py-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 rounded-[6px] text-base font-medium transition-colors duration-150 ${
              isActive('/')
                ? 'bg-[var(--bg-page)] text-[var(--teal)]'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-page)]'
            }`}
          >
            {t('nav.home')}
          </Link>

          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-[6px] text-base font-medium transition-colors duration-150 ${
                isActive(link.to)
                  ? 'bg-[var(--bg-page)] text-[var(--teal)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-page)]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 mt-2 border-t border-[var(--border)] space-y-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-[6px] text-base font-medium text-[var(--text-primary)] bg-[var(--bg-page)]"
                >
                  {user.name} ({t('nav.profile')})
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-[6px] text-base font-medium text-[var(--error)] hover:bg-[var(--bg-page)] transition-colors duration-150 cursor-pointer"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-base font-medium text-[var(--text-primary)] hover:border-[var(--teal)] transition-colors duration-150"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-[6px] bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--surface)] text-base font-semibold transition-colors duration-150"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
