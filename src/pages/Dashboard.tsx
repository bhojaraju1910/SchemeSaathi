import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import CategoryIcon, { getCategoryPalette } from '../components/CategoryIcon';
import { HARDCODED_SCHEMES } from '../data/schemes';
import {
  getMirrorDashboardStats,
  isMirrorToken,
} from '../services/authMirrorService';
import { Compass, Sparkles, Bookmark, ExternalLink, Loader2 } from 'lucide-react';

interface StatsResponse {
  availableSchemes: number;
  potentialMatches: number;
  savedSchemes: number;
  applicationLinks: number;
  topMatches?: {
    scheme: SchemeData;
    match: 'High' | 'Medium';
    reasons: string[];
    missing: string[];
  }[];
}

const CATEGORIES = [
  { key: 'education', labelKey: 'categories.education' },
  { key: 'healthcare', labelKey: 'categories.healthcare' },
  { key: 'housing', labelKey: 'categories.housing' },
  { key: 'employment', labelKey: 'categories.employment' },
  { key: 'women_child', labelKey: 'categories.women_child' },
  { key: 'senior_citizens', labelKey: 'categories.senior_citizens' },
  { key: 'agriculture', labelKey: 'categories.agriculture' },
];

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      const applyMirrorStats = () => {
        setStats(getMirrorDashboardStats(user?.id || 'user_demo'));
      };

      try {
        setLoading(true);
        if (isMirrorToken(token)) {
          applyMirrorStats();
          return;
        }
        const res = await api.get('/dashboard/stats');
        if (res.data && typeof res.data === 'object' && typeof res.data.availableSchemes === 'number') {
          setStats(res.data);
        } else {
          applyMirrorStats();
        }
      } catch (err) {
        console.error('Failed to load dashboard stats, mirroring locally:', err);
        applyMirrorStats();
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-[var(--teal)] animate-spin" />
        <p className="text-base text-[var(--text-muted)]">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-base text-[var(--text-muted)] mt-1">
            Welcome, <span className="text-[var(--text-primary)] font-semibold">{user?.name}</span>.
          </p>
        </div>

        <Link
          to="/profile"
          className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-[6px] text-sm font-semibold text-[var(--deep-text)] bg-[var(--teal)] hover:bg-[var(--teal-hover)] transition-colors duration-150 self-start sm:self-auto"
        >
          {t('dashboard.updateProfile')}
        </Link>
      </div>

      {/* Four Tinted Summary Tiles */}
      <section aria-label="Account summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t('dashboard.statAvailable')}
            value={stats?.availableSchemes ?? HARDCODED_SCHEMES.length}
            icon={Compass}
          />
          <StatCard
            label={t('dashboard.statMatches')}
            value={stats?.potentialMatches ?? 0}
            icon={Sparkles}
          />
          <StatCard
            label={t('dashboard.statSaved')}
            value={stats?.savedSchemes ?? 0}
            icon={Bookmark}
          />
          <StatCard
            label={t('dashboard.statApplications')}
            value={stats?.applicationLinks ?? 0}
            icon={ExternalLink}
          />
        </div>
      </section>

      {/* Top Potential Matches List */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[22px] font-bold text-[var(--text-primary)]">
            {t('dashboard.topMatches')}
          </h2>
          <Link
            to="/recommendations"
            className="text-base font-semibold text-[var(--teal)] hover:text-[var(--teal-hover)] underline underline-offset-4 transition-colors duration-150"
          >
            View all matches
          </Link>
        </div>

        {stats?.topMatches && stats.topMatches.length > 0 ? (
          <div className="space-y-4">
            {stats.topMatches.map((item) => (
              <SchemeCard
                key={item.scheme._id}
                scheme={item.scheme}
                match={item.match}
                reasons={item.reasons}
                missing={item.missing}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] space-y-3">
            <p className="text-base text-[var(--text-muted)]">
              Complete your profile details to see potentially relevant schemes.
            </p>
            <Link
              to="/profile"
              className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-sm rounded-[6px] transition-colors duration-150"
            >
              {t('dashboard.updateProfile')}
            </Link>
          </div>
        )}
      </section>

      {/* Browse by Category & Quick Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-[var(--border)]">
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            Browse by category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const palette = getCategoryPalette(cat.key);
              return (
                <Link
                  key={cat.key}
                  to={`/schemes?category=${cat.key}`}
                  className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] rounded-[6px] p-3.5 flex items-center gap-3 transition-colors duration-150"
                >
                  <span
                    className="w-10 h-10 rounded-[6px] inline-flex items-center justify-center shrink-0"
                    style={{ backgroundColor: palette.bg, color: palette.fg }}
                  >
                    <CategoryIcon kind={cat.key} size={20} />
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {t(cat.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            {t('dashboard.quickActions')}
          </h2>
          <ul className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-[6px] bg-[var(--surface)] overflow-hidden">
            <li>
              <Link
                to="/profile"
                className="block px-4 py-3.5 hover:bg-[var(--bg-page)] transition-colors duration-150"
              >
                <p className="text-base font-semibold text-[var(--teal)]">{t('dashboard.updateProfile')}</p>
                <p className="text-sm text-[var(--text-muted)]">Update age, income bracket, category, or state.</p>
              </Link>
            </li>
            <li>
              <Link
                to="/schemes"
                className="block px-4 py-3.5 hover:bg-[var(--bg-page)] transition-colors duration-150"
              >
                <p className="text-base font-semibold text-[var(--teal)]">{t('dashboard.browseCatalog')}</p>
                <p className="text-sm text-[var(--text-muted)]">Search all central and state welfare programs.</p>
              </Link>
            </li>
            <li>
              <Link
                to="/saved"
                className="block px-4 py-3.5 hover:bg-[var(--bg-page)] transition-colors duration-150"
              >
                <p className="text-base font-semibold text-[var(--teal)]">{t('dashboard.viewSaved')}</p>
                <p className="text-sm text-[var(--text-muted)]">Review bookmarked schemes and application status.</p>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
