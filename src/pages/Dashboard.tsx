import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import CategoryIcon from '../components/CategoryIcon';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import FallbackNotice from '../components/FallbackNotice';
import {
  computeNextBestStep,
  computeProfileStrength,
  computeSavedDocumentsReady,
  SavedDocumentSummaryInput,
} from '../utils/schemeTools';
import {
  loadEmergencySchemes,
  readSessionCache,
  withTimeout,
  writeSessionCache,
} from '../utils/clientCache';
import {
  getMirrorCatalog,
  getMirrorDashboardStats,
  getMirrorProfile,
  getMirrorSavedSchemes,
  isMirrorToken,
  setMirrorCatalog,
} from '../services/authMirrorService';
import { ArrowRightIcon } from '../components/Icons';

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
  const { registerSchemes } = useCompare();

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [savedItems, setSavedItems] = useState<SavedDocumentSummaryInput[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const loadStats = useCallback(async () => {
    const uid = user?.id || 'user_demo';

    const ensureCatalog = async (): Promise<{
      catalog: any[];
      usedEmergency: boolean;
    }> => {
      const inMemory = getMirrorCatalog();
      if (inMemory.length > 0) {
        return { catalog: inMemory, usedEmergency: false };
      }
      const cached = readSessionCache<SchemeData[]>('ss_cache_quick_catalog');
      if (cached?.data && cached.data.length > 0) {
        setMirrorCatalog(cached.data as any);
        return { catalog: cached.data, usedEmergency: false };
      }
      try {
        const res = await withTimeout(
          (signal) => api.get('/schemes/quick-catalog', { signal }),
          4000
        );
        if (Array.isArray(res.data?.schemes) && res.data.schemes.length > 0) {
          setMirrorCatalog(res.data.schemes);
          writeSessionCache('ss_cache_quick_catalog', res.data.schemes);
          return { catalog: res.data.schemes, usedEmergency: false };
        }
      } catch {
        // fall through to emergency
      }
      const emergency = await loadEmergencySchemes();
      setMirrorCatalog(emergency);
      return { catalog: emergency, usedEmergency: true };
    };

    const applyMirrorStats = async () => {
      const { catalog, usedEmergency } = await ensureCatalog();
      const mirrorStats = getMirrorDashboardStats(uid, catalog) as unknown as StatsResponse;
      const mirrorSaved = getMirrorSavedSchemes(uid, catalog) as unknown as SavedDocumentSummaryInput[];
      setStats(mirrorStats);
      setProfileData(getMirrorProfile(uid));
      setSavedItems(mirrorSaved);
      setIsFallback(usedEmergency);
      if (mirrorStats.topMatches) {
        registerSchemes(mirrorStats.topMatches.map((m) => m.scheme));
      }
    };

    try {
      setLoading(true);
      if (isMirrorToken(token)) {
        await applyMirrorStats();
        return;
      }

      const [statsRes, profileRes, savedRes] = await withTimeout(
        (signal) =>
          Promise.all([
            api.get('/dashboard/stats', { signal }),
            api.get('/profile', { signal }).catch(() => ({ data: null })),
            api.get('/saved', { signal }).catch(() => ({ data: [] })),
          ]),
        4000
      );

      if (
        statsRes.data &&
        typeof statsRes.data === 'object' &&
        typeof statsRes.data.availableSchemes === 'number' &&
        statsRes.data.availableSchemes > 0
      ) {
        setStats(statsRes.data);
        if (statsRes.data.topMatches) {
          registerSchemes(statsRes.data.topMatches.map((m: any) => m.scheme));
        }
        setProfileData(profileRes.data || getMirrorProfile(uid));
        setSavedItems(Array.isArray(savedRes.data) ? savedRes.data : []);
        setIsFallback(false);
      } else {
        await applyMirrorStats();
      }
    } catch {
      await applyMirrorStats();
    } finally {
      setLoading(false);
    }
  }, [user, token, registerSchemes]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const strength = computeProfileStrength(profileData);
  const docsReady = computeSavedDocumentsReady(savedItems);
  const nextStep = computeNextBestStep({
    profileCompleted: strength.completed,
    profileTotal: strength.total,
    potentialMatchesCount: stats?.potentialMatches ?? 0,
    savedCount: stats?.savedSchemes ?? savedItems.length,
    docsDone: docsReady.done,
    docsTotal: docsReady.total,
    portalClicksCount: stats?.applicationLinks ?? 0,
  });

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Household Overview"
        title={
          <>
            Family Welfare <AccentWord>Dashboard</AccentWord>
          </>
        }
        subtitle={
          <>
            Welcome back, <span className="text-[var(--cream)] font-bold">{user?.name}</span>.
          </>
        }
        actions={
          <Link
            to="/profile"
            className="btn-accent-pill px-6 py-2.5 text-sm inline-flex items-center justify-center"
          >
            {t('dashboard.updateProfile')}
          </Link>
        }
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-10">
        {isFallback && <FallbackNotice onRetry={loadStats} />}

        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="editorial-card p-6 h-32" />
              ))}
            </div>
            <div className="editorial-card p-6 h-28" />
            <div className="editorial-card p-6 h-40" />
          </div>
        ) : (
          <>
            {/* 4 Relevant Actionable Stat Tiles (no raw scheme catalog count) */}
            <section aria-label="Account summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={t('dashboard.statMatches')}
                value={stats?.potentialMatches ?? 0}
              />
              <StatCard
                label={t('dashboard.statSaved')}
                value={stats?.savedSchemes ?? savedItems.length}
              />
              <StatCard
                label={t('dashboard.statDocsReady', 'Documents Ready')}
                value={docsReady.formatted}
                subtext={
                  docsReady.total > 0
                    ? 'Across saved scheme checklists'
                    : 'Save a scheme to track docs'
                }
              />
              <StatCard
                label={t('dashboard.statApplications')}
                value={stats?.applicationLinks ?? 0}
              />
            </section>

            {/* Next Best Step Deterministic Guidance Card */}
            <section
              aria-label={t('dashboard.nextStepTitle', 'Next best step')}
              className="editorial-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 border-l-4 border-l-[var(--accent)]"
            >
              <div className="space-y-1.5 max-w-2xl">
                <p className="eyebrow text-[var(--accent-ink)]">
                  {t('dashboard.nextStepTitle', 'Next best step')}
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--navy)]">
                  {nextStep.title}
                </h2>
                <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                  {nextStep.description}
                </p>
              </div>

              <Link
                to={nextStep.ctaTo}
                className="btn-accent-pill px-6 py-2.5 text-sm inline-flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
              >
                <span>{nextStep.ctaLabel}</span>
                <ArrowRightIcon size={16} />
              </Link>
            </section>

            {/* Profile Strength Bar */}
            <section className="editorial-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-[var(--navy)]">
                    {t('dashboardExtra.profileStrength')}: <AccentWord>{strength.completed} / {strength.total}</AccentWord>
                  </h2>
                  <span className="text-sm font-bold text-[var(--accent-ink)] tabular-nums">
                    {t('dashboardExtra.strengthCount', { done: strength.completed, total: strength.total })}
                  </span>
                </div>

                <div
                  className="w-full h-3 rounded-full bg-[var(--cream)] border border-[var(--line)] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={strength.completed}
                  aria-valuemin={0}
                  aria-valuemax={strength.total}
                  aria-label={t('dashboardExtra.profileStrength')}
                >
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                    style={{ width: `${strength.percentage}%` }}
                  />
                </div>

                <p className="text-sm text-[var(--muted)]">
                  {strength.missingFields.length > 0
                    ? `${t('dashboardExtra.completeNow')}: ${strength.missingFields.join(', ')}.`
                    : 'All 5 core household fields are completed for accurate rule checks.'}
                </p>
              </div>

              <Link
                to="/profile"
                className="btn-outline-pill px-5 py-2.5 text-sm inline-flex items-center justify-center shrink-0"
              >
                {t('dashboard.updateProfile')}
              </Link>
            </section>

            {/* Top Matches */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)]">
                  {t('dashboard.topMatches')}
                </h2>
                <Link
                  to="/recommendations"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent-ink)] hover:underline underline-offset-4"
                >
                  <span>View all matches</span>
                  <ArrowRightIcon size={15} />
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
                <div className="editorial-card p-6 sm:p-8 space-y-4">
                  <p className="text-base text-[var(--muted)]">
                    Complete your profile details to see potentially relevant schemes.
                  </p>
                  <Link
                    to="/profile"
                    className="btn-accent-pill px-6 py-2.5 text-sm inline-flex items-center justify-center"
                  >
                    {t('dashboard.updateProfile')}
                  </Link>
                </div>
              )}
            </section>

            {/* Browse Categories + Quick Actions */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-[var(--line)]">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="font-display text-xl font-bold text-[var(--navy)]">Browse by category</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.key}
                      to={`/schemes?category=${cat.key}`}
                      className="editorial-card editorial-card-lift p-4 flex items-center gap-3.5 hover:border-[var(--navy)] transition-colors"
                    >
                      <CategoryIcon kind={cat.key} size={20} withChip />
                      <span className="text-sm font-bold text-[var(--navy)] truncate">
                        {t(cat.labelKey)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <h2 className="font-display text-xl font-bold text-[var(--navy)]">
                  {t('dashboard.quickActions')}
                </h2>
                <ul className="editorial-card divide-y divide-[var(--line)] overflow-hidden">
                  <li>
                    <Link to="/profile" className="block px-5 py-4 hover:bg-[var(--cream)] transition-colors">
                      <p className="text-base font-bold text-[var(--accent-ink)]">
                        {t('dashboard.updateProfile')}
                      </p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">
                        Update age, income bracket, category, or state.
                      </p>
                    </Link>
                  </li>
                  <li>
                    <Link to="/schemes" className="block px-5 py-4 hover:bg-[var(--cream)] transition-colors">
                      <p className="text-base font-bold text-[var(--accent-ink)]">
                        {t('dashboard.browseCatalog')}
                      </p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">
                        Search all central and state welfare programs.
                      </p>
                    </Link>
                  </li>
                  <li>
                    <Link to="/saved" className="block px-5 py-4 hover:bg-[var(--cream)] transition-colors">
                      <p className="text-base font-bold text-[var(--accent-ink)]">
                        {t('dashboard.viewSaved')}
                      </p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">
                        Review saved schemes, document checklists, and status.
                      </p>
                    </Link>
                  </li>
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
