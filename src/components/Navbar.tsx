import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import {
  ShieldCheck,
  Compass,
  Sparkles,
  Bookmark,
  LayoutDashboard,
  Settings,
  User as UserIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/schemes', label: t('nav.schemes'), icon: Compass },
    ...(user
      ? [
          { to: '/recommendations', label: t('nav.recommendations'), icon: Sparkles },
          { to: '/saved', label: t('nav.saved'), icon: Bookmark },
          { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        ]
      : []),
    ...(user && user.role === 'admin'
      ? [{ to: '/admin', label: t('nav.admin'), icon: Settings }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B1426]/90 backdrop-blur-md border-b border-[#243A63]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5AA9FF] to-[#F7B6CE] p-0.5 flex items-center justify-center shadow-lg shadow-[#5AA9FF]/10">
                <div className="w-full h-full bg-[#0B1426] rounded-[10px] flex items-center justify-center group-hover:bg-[#14213B] transition-colors">
                  <ShieldCheck className="w-5 h-5 text-[#5AA9FF]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-[#EAF1FB] font-heading flex items-center gap-1.5">
                  Scheme<span className="text-[#5AA9FF]">Saathi</span>
                </span>
                <span className="text-[10px] text-[#9FB0C8] -mt-1 hidden sm:inline">
                  Social Protection Guide
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#14213B] text-[#5AA9FF] border border-[#243A63] shadow-sm'
                        : 'text-[#9FB0C8] hover:text-[#EAF1FB] hover:bg-[#14213B]/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#243A63]">
                <Link
                  to="/profile"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive('/profile')
                      ? 'bg-[#5AA9FF]/15 text-[#5AA9FF] border border-[#5AA9FF]/30'
                      : 'text-[#EAF1FB] bg-[#14213B] border border-[#243A63] hover:border-[#5AA9FF]/50'
                  }`}
                  title="Manage Family Profile"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#5AA9FF]" />
                  <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                  {user.role === 'admin' && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#FF7BA5]/20 text-[#FF7BA5] border border-[#FF7BA5]/30 rounded font-semibold uppercase">
                      Admin
                    </span>
                  )}
                </Link>

                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="p-1.5 text-[#9FB0C8] hover:text-[#FF7BA5] hover:bg-[#14213B] border border-transparent hover:border-[#243A63] rounded-lg transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-[#EAF1FB] hover:text-[#5AA9FF] transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-sm font-medium bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 text-[#0B1426] rounded-lg shadow-sm transition-all font-semibold"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 text-[#9FB0C8] hover:text-[#EAF1FB] rounded-lg bg-[#14213B] border border-[#243A63]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1426] border-b border-[#243A63] px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-[#9FB0C8] hover:text-[#EAF1FB] hover:bg-[#14213B]"
          >
            {t('nav.home')}
          </Link>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium ${
                  isActive(link.to)
                    ? 'bg-[#14213B] text-[#5AA9FF]'
                    : 'text-[#9FB0C8] hover:text-[#EAF1FB] hover:bg-[#14213B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#243A63] flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#EAF1FB] bg-[#14213B]"
                >
                  <UserIcon className="w-4 h-4 text-[#5AA9FF]" />
                  <span>{user.name} ({user.email})</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#FF7BA5] hover:bg-[#14213B] text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg border border-[#243A63] text-sm font-medium text-[#EAF1FB]"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-[#5AA9FF] text-[#0B1426] text-sm font-semibold"
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
