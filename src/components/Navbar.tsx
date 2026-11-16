import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import LanguageSelector from './LanguageSelector';
import { CloseIcon, MenuIcon } from './Icons';
import {
  applyTextSizeToRoot,
  readTextSize,
  TextSizeOption,
  writeTextSize,
} from '../utils/schemeTools';

const TEXT_SIZES: { value: TextSizeOption; label: string; ariaKey: string }[] = [
  { value: '100', label: 'A-', ariaKey: 'textSize.small' },
  { value: '112', label: 'A', ariaKey: 'textSize.medium' },
  { value: '125', label: 'A+', ariaKey: 'textSize.large' },
];

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { compareIds } = useCompare();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [textSize, setTextSize] = useState<TextSizeOption>(() => readTextSize());

  useEffect(() => {
    applyTextSizeToRoot(textSize);
    writeTextSize(textSize);
  }, [textSize]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login', { replace: true, state: null });
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/schemes', label: t('nav.schemes') },
    {
      to: '/compare',
      label: t('nav.compare'),
      badge: compareIds.length > 0 ? compareIds.length : undefined,
    },
    { to: '/faq', label: t('nav.faq') },
    { to: '/suggest', label: t('nav.suggest') },
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

  const renderTextSizeToggle = (compact = false) => (
    <div
      role="group"
      aria-label={t('textSize.label')}
      className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--paper)] p-0.5"
    >
      {TEXT_SIZES.map((item) => {
        const active = textSize === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setTextSize(item.value)}
            aria-label={t(item.ariaKey)}
            aria-pressed={active}
            title={t(item.ariaKey)}
            className={`${
              compact ? 'min-h-[40px] min-w-[40px]' : 'min-h-[36px] min-w-[34px]'
            } px-2 rounded-full text-xs font-bold transition-colors duration-150 cursor-pointer ${
              active
                ? 'bg-[var(--navy)] text-[var(--cream)]'
                : 'text-[var(--navy)] hover:bg-[var(--cream)]'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Static Guidance Announcement Bar above Sticky Header */}
      <div className="announcement-bar no-print bg-[var(--navy)] text-[var(--cream)] border-b border-[var(--line-dark)] px-4 py-1.5 text-center text-xs font-medium tracking-wide">
        <p className="max-w-[1200px] mx-auto truncate sm:whitespace-normal">
          {t('announcement')}
        </p>
      </div>

      <header className="no-print sticky top-0 z-40 bg-[var(--cream)] border-b border-[var(--line)]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Editorial Geometric Logo + Wordmark */}
            <Link
              to="/"
              className="font-display inline-flex items-center gap-2.5 text-[20px] sm:text-[21px] font-bold text-[var(--navy)] whitespace-nowrap shrink-0"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--navy)" />
                <path
                  d="M7.5 14.5L14 8.5L20.5 14.5"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 17.8l2 2 4.5-4.5"
                  stroke="var(--cream)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>SchemeSaathi</span>
            </Link>

            {/* Center: Navigation Links (Desktop xl+) */}
            <nav
              className="hidden xl:flex items-center gap-3 2xl:gap-4"
              aria-label="Main navigation"
            >
              {navLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative py-2 text-[13px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors duration-150 ${
                      active
                        ? 'text-[var(--navy)] font-bold'
                        : 'text-[var(--muted)] font-medium hover:text-[var(--navy)]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-[var(--accent)] text-[var(--navy)] tabular-nums leading-none">
                        {link.badge}
                      </span>
                    )}
                    {active && (
                      <span
                        className="absolute inset-x-0 -bottom-[1px] h-[2.5px] bg-[var(--accent)] rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Language Toggle, Text Size Toggle (F7), Auth Controls (Desktop xl+) */}
            <div className="hidden xl:flex items-center gap-2 shrink-0">
              <LanguageSelector />
              {renderTextSizeToggle()}

              <div className="h-5 w-px bg-[var(--line)] mx-0.5" aria-hidden="true" />

              {user ? (
                <div className="flex items-center gap-2 text-sm">
                  <Link
                    to="/profile"
                    className={`min-h-[38px] inline-flex items-center px-3 rounded-full border text-xs font-bold whitespace-nowrap transition-colors ${
                      isActive('/profile')
                        ? 'border-[var(--navy)] bg-[var(--navy)] text-[var(--cream)]'
                        : 'border-[var(--line)] bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)]'
                    }`}
                    title="Manage Family Profile"
                  >
                    <span className="max-w-[78px] truncate">{user.name.split(' ')[0]}</span>
                    {user.role === 'admin' && <span className="ml-1 opacity-75">· Admin</span>}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Log out"
                    className="min-h-[38px] px-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--error)] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Link
                    to="/login"
                    className={`min-h-[38px] inline-flex items-center px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      isActive('/login')
                        ? 'bg-[var(--navy)] text-[var(--cream)]'
                        : 'border border-[var(--line)] bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)]'
                    }`}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="btn-accent-pill min-h-[38px] px-4 inline-flex items-center justify-center text-xs whitespace-nowrap"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Controls */}
            <div className="flex xl:hidden items-center gap-2 shrink-0">
              <LanguageSelector />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)] transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[var(--paper)] border-t border-[var(--line)] px-4 py-4 space-y-2 shadow-[var(--shadow-paper)] max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-[var(--line)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                {t('textSize.label')}
              </span>
              {renderTextSizeToggle(true)}
            </div>

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-[12px] text-base font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-[var(--navy)] text-[var(--cream)]'
                  : 'text-[var(--navy)] hover:bg-[var(--cream)]'
              }`}
            >
              {t('nav.home')}
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-[12px] text-base font-semibold transition-colors ${
                  isActive(link.to)
                    ? 'bg-[var(--navy)] text-[var(--cream)]'
                    : 'text-[var(--navy)] hover:bg-[var(--cream)]'
                }`}
              >
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--accent)] text-[var(--navy)] tabular-nums">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-[var(--line)] space-y-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-[12px] text-base font-semibold text-[var(--navy)] bg-[var(--cream)] border border-[var(--line)]"
                  >
                    {user.name} ({t('nav.profile')})
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-[12px] text-base font-semibold text-[var(--error)] hover:bg-[var(--cream)] transition-colors cursor-pointer"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-outline-pill min-h-[48px] inline-flex items-center justify-center text-sm"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-accent-pill min-h-[48px] inline-flex items-center justify-center text-sm"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
