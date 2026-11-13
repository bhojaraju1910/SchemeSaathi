import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#14213B] border border-[#243A63] rounded-3xl p-8 sm:p-10 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#5AA9FF]/10 text-[#5AA9FF] border border-[#5AA9FF]/20 mx-auto flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#EAF1FB] font-heading">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-xs text-[#9FB0C8] mt-1.5">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. citizen@example.com"
              required
              className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] placeholder:text-[#9FB0C8]/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 pr-10 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] placeholder:text-[#9FB0C8]/50 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9FB0C8] hover:text-[#EAF1FB] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 text-[#0B1426] font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#5AA9FF]/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t('auth.loginBtn')}</span>}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 pt-6 border-t border-[#243A63]/60 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9FB0C8] text-center mb-2">
            Instant Demo Review Access
          </p>
          <button
            type="button"
            onClick={handleDemoUserLogin}
            disabled={loading}
            className="w-full py-2 px-3 bg-[#0B1426] hover:bg-[#14213B] border border-[#5AA9FF]/40 text-[#5AA9FF] text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t('auth.demoLoginUser')}</span>
          </button>
          <button
            type="button"
            onClick={handleDemoAdminLogin}
            disabled={loading}
            className="w-full py-2 px-3 bg-[#0B1426] hover:bg-[#14213B] border border-[#FF7BA5]/40 text-[#FF7BA5] text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('auth.demoLoginAdmin')}</span>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[#9FB0C8]">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-[#5AA9FF] font-semibold hover:underline inline-flex items-center gap-0.5">
            <span>{t('nav.register')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
