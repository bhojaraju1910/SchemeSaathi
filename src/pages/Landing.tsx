import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import CategoryIcon from '../components/CategoryIcon';
import AccentWord from '../components/AccentWord';
import ProgressRing from '../components/ProgressRing';
import SampleBadge from '../components/SampleBadge';
import MatchBadge from '../components/MatchBadge';
import FallbackNotice from '../components/FallbackNotice';
import { runQuickCheck } from '../utils/schemeTools';
import { setMirrorCatalog } from '../services/authMirrorService';
import {
  loadEmergencySchemes,
  readSessionCache,
  withTimeout,
  writeSessionCache,
} from '../utils/clientCache';
import api from '../api/axios';
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  HelpCircleIcon,
  ShieldIcon,
} from '../components/Icons';

const QUICK_CATALOG_CACHE_KEY = 'ss_cache_quick_catalog';

const BROWSE_CATEGORIES = [
  {
    key: 'women_child',
    labelKey: 'categories.women_child',
    summary: 'Monthly family support, maternity care, and child nutrition grants.',
  },
  {
    key: 'senior_citizens',
    labelKey: 'categories.senior_citizens',
    summary: 'Old-age monthly pensions and dignified living assistance for elders.',
  },
  {
    key: 'education',
    labelKey: 'categories.education',
    summary: 'Post-matric scholarships, hostel stipends, and tuition fee relief.',
  },
  {
    key: 'agriculture',
    labelKey: 'categories.agriculture',
    summary: 'Direct farmer income installments, crop insurance, and seed support.',
  },
  {
    key: 'healthcare',
    labelKey: 'categories.healthcare',
    summary: 'Cashless hospital treatment, health cover, and disability aid.',
  },
  {
    key: 'housing',
    labelKey: 'categories.housing',
    summary: 'Free domestic electricity units and rural or urban shelter subsidies.',
  },
  {
    key: 'employment',
    labelKey: 'categories.employment',
    summary: 'Youth skill allowances, artisan toolkits, and micro-enterprise loans.',
  },
];

const QUICK_INCOME_OPTIONS = [
  { value: 'low', label: 'Below ₹1.5L' },
  { value: 'lower_middle', label: '₹1.5L – ₹3L' },
  { value: 'middle', label: '₹3L – ₹8L' },
  { value: 'high', label: 'Above ₹8L' },
] as const;

const QUICK_CATEGORY_OPTIONS = [
  { value: 'senior_citizen', label: 'Senior (60+)' },
  { value: 'student', label: 'Student' },
  { value: 'woman', label: 'Woman' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'disabled', label: 'PwD' },
  { value: 'child', label: 'Child' },
  { value: 'general', label: 'General' },
];

const QUICK_STATES = ['Karnataka', 'All', 'Maharashtra', 'Tamil Nadu', 'Kerala', 'Other'];

export const Landing: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { registerSchemes } = useCompare();

  const initialCached = readSessionCache<SchemeData[]>(QUICK_CATALOG_CACHE_KEY);
  const [catalog, setCatalog] = useState<SchemeData[]>(() => initialCached?.data || []);
  const [loading, setLoading] = useState<boolean>(() => !initialCached?.data?.length);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  // Quick Check state
  const [qcAge, setQcAge] = useState<string>('64');
  const [qcState, setQcState] = useState<string>('Karnataka');
  const [qcIncome, setQcIncome] = useState<string>('low');
  const [qcCategories, setQcCategories] = useState<string[]>(['senior_citizen']);

  // Stats strip count-up animation (deferred past first paint, respects prefers-reduced-motion)
  const statsRef = useRef<HTMLElement | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [animatedCats, setAnimatedCats] = useState<number>(7);
  const [animatedLangs, setAnimatedLangs] = useState<number>(3);

  const quickAgeRef = useRef<HTMLInputElement | null>(null);

  const loadCatalog = useCallback(async () => {
    const cached = readSessionCache<SchemeData[]>(QUICK_CATALOG_CACHE_KEY);
    if (cached && cached.data.length > 0) {
      setCatalog(cached.data);
      setMirrorCatalog(cached.data as any);
      registerSchemes(cached.data);
      setLoading(false);
    }

    try {
      const res = await withTimeout(
        (signal) => api.get('/schemes/quick-catalog', { signal }),
        4000
      );
      if (Array.isArray(res.data?.schemes)) {
        const liveSchemes = res.data.schemes as SchemeData[];
        setCatalog(liveSchemes);
        setMirrorCatalog(liveSchemes as any);
        registerSchemes(liveSchemes);
        writeSessionCache(QUICK_CATALOG_CACHE_KEY, liveSchemes);
        setIsFallback(false);
        return;
      }
      const emergency = (await loadEmergencySchemes()) as unknown as SchemeData[];
      setCatalog(emergency);
      setMirrorCatalog(emergency as any);
      registerSchemes(emergency);
      setIsFallback(true);
    } catch {
      const emergency = (await loadEmergencySchemes()) as unknown as SchemeData[];
      setCatalog(emergency);
      setMirrorCatalog(emergency as any);
      registerSchemes(emergency);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, [registerSchemes]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setAnimatedCats(7);
      setAnimatedLangs(3);
      return;
    }

    let observer: IntersectionObserver | null = null;
    const deferTimer = window.setTimeout(() => {
      const node = statsRef.current;
      if (!node || typeof IntersectionObserver === 'undefined') return;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setStatsVisible(true);
            observer?.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      observer.observe(node);
    }, 120);

    return () => {
      window.clearTimeout(deferTimer);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!statsVisible) return;
    const start = performance.now();
    const duration = 480;
    let rafId = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedCats(Math.max(1, Math.round(eased * 7)));
      setAnimatedLangs(Math.max(1, Math.round(eased * 3)));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [statsVisible]);

  const scrollToQuickCheck = () => {
    const el = document.getElementById('quick-check');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        quickAgeRef.current?.focus();
      }, 360);
    }
  };

  const toggleQuickCategory = (cat: string) => {
    setQcCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const quickResult = useMemo(
    () =>
      runQuickCheck(
        {
          age: qcAge,
          state: qcState,
          incomeRange: qcIncome,
          categories: qcCategories,
        },
        catalog as any
      ),
    [qcAge, qcState, qcIncome, qcCategories, catalog]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of catalog) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [catalog]);

  const featuredSchemes = useMemo(() => catalog.slice(0, 3), [catalog]);
  const marqueeSchemes = useMemo(() => catalog.slice(0, 10), [catalog]);

  const targetGroups = [
    { label: 'Senior Citizens (60+)', cat: 'senior_citizens' },
    { label: 'School & College Students', cat: 'education' },
    { label: 'Women & Mothers', cat: 'women_child' },
    { label: 'Small & Marginal Farmers', cat: 'agriculture' },
    { label: 'Artisans & Weavers', cat: 'employment' },
    { label: 'Rural & Urban Households', cat: 'housing' },
  ];

  const steps = [
    {
      num: '01',
      title: t('howItWorks.step1Title').replace(/^[0-9೧-೯]+\.\s*/, ''),
      desc: t('howItWorks.step1Desc'),
    },
    {
      num: '02',
      title: t('howItWorks.step2Title').replace(/^[0-9೧-೯]+\.\s*/, ''),
      desc: t('howItWorks.step2Desc'),
    },
    {
      num: '03',
      title: t('howItWorks.step3Title').replace(/^[0-9೧-೯]+\.\s*/, ''),
      desc: t('howItWorks.step3Desc'),
    },
  ];

  return (
    <div>
      {/* 1. Dark Navy Hero with Warm Coral Glow + Layered Floating UI Cards */}
      <section className="hero-editorial-bg text-[var(--cream)] border-b border-[var(--line-dark)] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-6 animate-fade-up">
            <p className="eyebrow text-[var(--accent)]">
              Karnataka & Central Welfare Directory · EN · ಕನ್ನಡ · हिन्दी
            </p>

            <h1 className="font-display text-balance text-[clamp(2.4rem,6vw,4.25rem)] font-bold text-[var(--cream)] leading-[1.04]">
              Welfare schemes your family <AccentWord>can</AccentWord> actually claim
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted-dark)] leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={scrollToQuickCheck}
                className="btn-accent-pill px-7 py-3 inline-flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                <span>Check in 1 minute</span>
                <ArrowRightIcon size={18} />
              </button>

              <Link
                to="/schemes"
                className="btn-outline-dark-pill px-6 py-3 inline-flex items-center justify-center text-base"
              >
                {t('hero.ctaBrowse')}
              </Link>
            </div>

            <div className="pt-2 flex items-start gap-2.5 text-sm text-[var(--muted-dark)] max-w-lg">
              <ShieldIcon size={18} className="text-[var(--accent)] mt-0.5" />
              <p>No Aadhaar. No bank details. Clear rules in plain language.</p>
            </div>
          </div>

          {/* Floating Layered UI Cards (Desktop: 3 cards; Mobile: Card (a) compact only) */}
          <div className="lg:col-span-6 relative flex flex-col items-center lg:items-end animate-fade-up">
            <div className="relative w-full max-w-[490px] lg:min-h-[410px] flex flex-col justify-center">
              {/* Card (a): Potential matches */}
              <div className="editorial-card hero-float-a p-5 sm:p-6 text-[var(--navy)] relative z-20 lg:w-[88%]">
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--line)]">
                  <span className="font-display text-base font-bold text-[var(--navy)]">
                    Potential matches
                  </span>
                  <SampleBadge />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[12px] bg-[var(--cream)] border border-[var(--line)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon kind="women_child" size={18} withChip />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">Gruha Lakshmi</p>
                        <p className="text-xs text-[var(--muted)]">Karnataka · ₹2,000 / mo</p>
                      </div>
                    </div>
                    <MatchBadge match="High" />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[12px] bg-[var(--cream)] border border-[var(--line)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon kind="senior_citizens" size={18} withChip />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">Sandhya Suraksha</p>
                        <p className="text-xs text-[var(--muted)]">Age 65+ pension support</p>
                      </div>
                    </div>
                    <MatchBadge match="High" />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[12px] bg-[var(--paper)] border border-[var(--line)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon kind="healthcare" size={18} withChip />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">Ayushman Bharat Cover</p>
                        <p className="text-xs text-[var(--muted)]">Confirm household card</p>
                      </div>
                    </div>
                    <MatchBadge match="Medium" />
                  </div>
                </div>
              </div>

              {/* Card (b): Why this matched */}
              <div
                className="hidden lg:block editorial-card-dark hero-float-b p-4 text-[var(--cream)] w-[66%] self-end -mt-2 relative z-30"
                aria-hidden="true"
              >
                <p className="eyebrow text-[var(--accent)] mb-2">Why this matched</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--success)]/20 text-[var(--cream)] inline-flex items-center justify-center">
                      <CheckIcon size={12} />
                    </span>
                    <span>Age 60+ rule satisfied</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--success)]/20 text-[var(--cream)] inline-flex items-center justify-center">
                      <CheckIcon size={12} />
                    </span>
                    <span>State: Karnataka matched</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--muted-dark)]">
                    <span className="w-5 h-5 rounded-full bg-[var(--accent)]/25 text-[var(--accent)] inline-flex items-center justify-center">
                      <HelpCircleIcon size={12} />
                    </span>
                    <span>Income bracket: please confirm</span>
                  </li>
                </ul>
              </div>

              {/* Card (c): Saved Bookmark Pill */}
              <div
                className="hidden lg:inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--accent)] text-[var(--navy)] font-bold text-xs shadow-[var(--shadow-float)] hero-float-c self-start -mt-3 ml-6 relative z-30"
                aria-hidden="true"
              >
                <BookmarkIcon size={14} filled />
                <span>Saved for family review</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Strip on Paper Band (no raw scheme count) */}
      <section
        ref={statsRef}
        className="bg-[var(--paper)] border-b border-[var(--line)]"
        aria-label="Platform highlights"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 lg:divide-x divide-[var(--line)]">
            <div className="flex flex-col justify-between">
              <p className="font-display text-xl sm:text-2xl lg:whitespace-nowrap font-bold text-[var(--navy)] leading-tight">
                Central + Karnataka
              </p>
              <p className="text-sm font-medium text-[var(--muted)] mt-2">
                Unified Welfare Catalog
              </p>
            </div>
            <div className="lg:pl-8 flex flex-col justify-between">
              <p className="font-display text-3xl sm:text-4xl font-bold text-[var(--navy)] tabular-nums leading-none">
                {animatedCats}
              </p>
              <p className="text-sm font-medium text-[var(--muted)] mt-2">
                Household Categories
              </p>
            </div>
            <div className="lg:pl-8 flex flex-col justify-between">
              <p className="font-display text-3xl sm:text-4xl font-bold text-[var(--navy)] tabular-nums leading-none">
                {animatedLangs}
              </p>
              <p className="text-sm font-medium text-[var(--muted)] mt-2">
                Languages (EN · ಕನ್ನಡ · हिन्दी)
              </p>
            </div>
            <div className="lg:pl-8 flex flex-col justify-between">
              <p className="font-display text-3xl sm:text-4xl font-bold text-[var(--accent-ink)] tabular-nums leading-none">
                0
              </p>
              <p className="text-sm font-medium text-[var(--muted)] mt-2">
                Aadhaar or Bank IDs Asked
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Interactive Quick Check */}
      <section id="quick-check" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20 space-y-4">
        {isFallback && <FallbackNotice onRetry={loadCatalog} />}

        <div className="editorial-card p-6 sm:p-8 lg:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
            <div className="space-y-2 max-w-2xl">
              <p className="eyebrow text-[var(--accent-ink)]">{t('quickCheck.eyebrow')}</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--navy)]">
                {t('quickCheck.title')}
              </h2>
              <p className="text-base text-[var(--muted)]">
                {t('quickCheck.subtitle')}
              </p>
            </div>
            <SampleBadge />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="qc-age" className="block text-sm font-bold text-[var(--navy)]">
                    {t('quickCheck.ageLabel')}
                  </label>
                  <input
                    ref={quickAgeRef}
                    id="qc-age"
                    type="number"
                    min={0}
                    max={120}
                    value={qcAge}
                    onChange={(e) => setQcAge(e.target.value)}
                    placeholder={t('quickCheck.agePlaceholder')}
                    className="editorial-input w-full px-4 text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="qc-state" className="block text-sm font-bold text-[var(--navy)]">
                    {t('quickCheck.stateLabel')}
                  </label>
                  <select
                    id="qc-state"
                    value={qcState}
                    onChange={(e) => setQcState(e.target.value)}
                    className="editorial-input w-full px-4 text-base cursor-pointer"
                  >
                    {QUICK_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st === 'All' ? 'All India (Central only)' : st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[var(--navy)]">{t('quickCheck.incomeLabel')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {QUICK_INCOME_OPTIONS.map((opt) => {
                    const active = qcIncome === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQcIncome(opt.value)}
                        aria-pressed={active}
                        className={`min-h-[44px] px-3 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                            : 'bg-[var(--cream)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[var(--navy)]">{t('quickCheck.categoryLabel')}</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CATEGORY_OPTIONS.map((opt) => {
                    const active = qcCategories.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleQuickCategory(opt.value)}
                        aria-pressed={active}
                        className={`min-h-[42px] px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--accent)] text-[var(--navy)] border-[var(--accent)]'
                            : 'bg-[var(--cream)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Live Results Panel */}
            <div className="lg:col-span-5 bg-[var(--navy)] text-[var(--cream)] rounded-[16px] p-5 sm:p-6 border border-[var(--line-dark)] space-y-5">
              <div className="flex items-baseline justify-between gap-3 border-b border-[var(--line-dark)] pb-4">
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--cream)] tabular-nums">
                    {loading
                      ? 'Checking catalog...'
                      : t('quickCheck.resultCount', { count: quickResult.totalMatches })}
                  </p>
                  <p className="text-xs font-medium text-[var(--muted-dark)] mt-1">
                    {loading
                      ? 'Fetching rules from server'
                      : t('quickCheck.highBreakdown', {
                          high: quickResult.highCount,
                          medium: quickResult.mediumCount,
                        })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-[12px] bg-[var(--navy-2)] border border-[var(--line-dark)]"
                    />
                  ))
                ) : quickResult.topThree.length === 0 ? (
                  <p className="text-sm text-[var(--muted-dark)] py-4">
                    Adjust age, state, or household groups on the left to preview relevant schemes.
                  </p>
                ) : (
                  quickResult.topThree.map((item) => (
                    <div
                      key={item.scheme._id}
                      className="p-3.5 rounded-[12px] bg-[var(--navy-2)] border border-[var(--line-dark)] flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <MatchBadge match={item.match} />
                          <span className="text-xs text-[var(--muted-dark)]">{item.scheme.state}</span>
                        </div>
                        <p className="font-display text-base font-bold text-[var(--cream)] leading-snug">
                          {item.scheme.title.split('(')[0].trim()}
                        </p>
                        {item.reasons[0] && (
                          <p className="text-xs text-[var(--muted-dark)] truncate">
                            {item.reasons[0]}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/schemes/${item.scheme._id}`}
                        className="shrink-0 min-h-[36px] px-3 rounded-full border border-[var(--line-dark)] text-xs font-semibold text-[var(--cream)] hover:border-[var(--accent)] hover:text-[var(--accent)] inline-flex items-center"
                      >
                        {t('quickCheck.viewScheme')}
                      </Link>
                    </div>
                  ))
                )}
              </div>

              <Link
                to={user ? '/recommendations' : '/register'}
                className="btn-accent-pill w-full px-5 py-3 inline-flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <span>{user ? t('profile.seeSchemes') : t('quickCheck.ctaSave')}</span>
                <ArrowRightIcon size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works — 3 Columns with Outlined Numerals 01, 02, 03 */}
      <section className="bg-[var(--paper)] border-y border-[var(--line)] py-14 sm:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="eyebrow text-[var(--accent-ink)]">Three Calm Steps</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--navy)]">
              {t('howItWorks.title')}
            </h2>
          </div>

          <div className="relative">
            <div
              className="hidden md:block absolute top-10 left-[8%] right-[8%] border-t-2 border-dashed border-[var(--line)]"
              aria-hidden="true"
            />
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative">
              {steps.map((step) => (
                <li
                  key={step.num}
                  className="bg-[var(--cream)] border border-[var(--line)] rounded-[16px] p-6 sm:p-7 space-y-3"
                >
                  <span className="step-outline-num text-5xl sm:text-6xl leading-none block tabular-nums">
                    {step.num}
                  </span>
                  <h3 className="font-display text-xl font-bold text-[var(--navy)]">
                    {step.title}
                  </h3>
                  <p className="text-base text-[var(--muted)] leading-relaxed">
                    {step.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 5. Scheme Marquee Strip */}
      <section className="py-10 sm:py-12 overflow-hidden border-b border-[var(--line)] cream-fluted-subtle" aria-label="Featured schemes ticker">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mb-5 flex items-center justify-between gap-4">
          <p className="eyebrow text-[var(--muted)]">Browse Catalog Preview</p>
          <Link
            to="/schemes"
            className="text-sm font-bold text-[var(--accent-ink)] hover:underline underline-offset-4 inline-flex items-center gap-1"
          >
            <span>Explore full catalog</span>
            <ArrowRightIcon size={15} />
          </Link>
        </div>

        {marqueeSchemes.length > 0 ? (
          <div className="marquee-wrapper overflow-hidden">
            <div className="marquee-track gap-4 px-4">
              {[...marqueeSchemes, ...marqueeSchemes].map((s, idx) => (
                <Link
                  key={`${s._id}-${idx}`}
                  to={`/schemes/${s._id}`}
                  tabIndex={idx >= marqueeSchemes.length ? -1 : undefined}
                  aria-hidden={idx >= marqueeSchemes.length ? true : undefined}
                  className="editorial-card editorial-card-lift px-5 py-4 min-w-[270px] max-w-[290px] flex items-center gap-3.5 hover:border-[var(--navy)] transition-colors shrink-0"
                >
                  <CategoryIcon kind={s.category} size={20} withChip />
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-[var(--navy)] truncate">
                      {s.title.split('(')[0].trim()}
                    </p>
                    <p className="text-xs text-[var(--muted)] truncate">
                      {s.level === 'central' ? 'Central' : s.state} · {String(t(`categories.${s.category}`, s.category))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="editorial-card h-[74px]" />
            ))}
          </div>
        )}
      </section>

      {/* 6. Categories Bento Grid */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow text-[var(--accent-ink)]">Organized by Household Need</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--navy)]">
              Browse by <AccentWord>category</AccentWord>
            </h2>
          </div>
          <Link
            to="/schemes"
            className="btn-outline-pill min-h-[44px] px-5 inline-flex items-center gap-2 text-sm"
          >
            <span>View all schemes</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {BROWSE_CATEGORIES.map((cat, idx) => {
            const spanClass = idx < 2 ? 'md:col-span-3' : idx < 5 ? 'md:col-span-2' : 'md:col-span-3';
            const count = categoryCounts[cat.key] || 0;
            return (
              <Link
                key={cat.key}
                to={`/schemes?category=${cat.key}`}
                className={`group editorial-card editorial-card-lift p-6 flex flex-col justify-between gap-4 hover:border-[var(--navy)] transition-colors duration-200 ${spanClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <CategoryIcon kind={cat.key} size={22} withChip />
                  <span className="text-xs font-bold text-[var(--muted)] tabular-nums px-2.5 py-1 rounded-full bg-[var(--cream)] border border-[var(--line)]">
                    {catalog.length > 0
                      ? `${count} ${count === 1 ? 'scheme' : 'schemes'}`
                      : 'Browse'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-bold text-[var(--navy)] group-hover:text-[var(--accent-ink)] transition-colors">
                      {t(cat.labelKey)}
                    </h3>
                    <ArrowRightIcon
                      size={18}
                      className="text-[var(--muted)] group-hover:text-[var(--navy)] group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {cat.summary}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 7. Trust & Plain-Language Rule Transparency Band */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
        <div className="editorial-card p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="eyebrow text-[var(--accent-ink)]">Built for Clarity</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--navy)] leading-tight">
              Plain answers, <AccentWord>not</AccentWord> dense guesswork
            </h2>
            <p className="text-base text-[var(--muted)] leading-relaxed">
              Every recommendation shows which household conditions line up and highlights any details you still need to confirm directly on the official portal.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/faq"
                className="btn-accent-pill px-6 py-3 inline-flex items-center justify-center text-sm"
              >
                Ask Help & FAQ
              </Link>
              <Link
                to="/suggest"
                className="btn-outline-pill px-6 py-3 inline-flex items-center justify-center text-sm"
              >
                Suggest a Scheme
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-[var(--cream)] border border-[var(--line)] rounded-[16px] p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
                <div>
                  <p className="font-display text-lg font-bold text-[var(--navy)]">
                    Rule Check Breakdown
                  </p>
                  <p className="text-xs text-[var(--muted)]">Example: Gruha Lakshmi (Karnataka)</p>
                </div>
                <ProgressRing passed={3} total={4} label="checks passed" />
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success)] inline-flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon size={12} />
                  </span>
                  <span>Resident of Karnataka</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success)] inline-flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon size={12} />
                  </span>
                  <span>Adult applicant (Age 18+)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success)] inline-flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon size={12} />
                  </span>
                  <span>Designated woman head of household</span>
                </li>
                <li className="flex items-start gap-2.5 text-[var(--badge-high-text)] font-medium">
                  <span className="w-5 h-5 rounded-full bg-[var(--badge-high-bg)] border border-[var(--line)] text-[var(--badge-high-text)] inline-flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircleIcon size={12} />
                  </span>
                  <span>Ration card family head listing — please confirm on Seva Sindhu</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Popular Welfare Schemes */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-14 sm:pb-20 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--line)] pt-10">
          <div className="space-y-2">
            <p className="eyebrow text-[var(--accent-ink)]">Flagship Support</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--navy)]">
              Popular Welfare Schemes
            </h2>
          </div>
          <Link
            to="/schemes"
            className="text-sm font-bold text-[var(--accent-ink)] hover:underline underline-offset-4 inline-flex items-center gap-1.5"
          >
            <span>View all schemes</span>
            <ArrowRightIcon size={15} />
          </Link>
        </div>

        {loading && featuredSchemes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="editorial-card h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme._id} scheme={scheme} />
            ))}
          </div>
        )}
      </section>

      {/* 9. Who Is It For + UN SDG Flat Blocks */}
      <section className="bg-[var(--paper)] border-t border-[var(--line)] py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-4">
            <p className="eyebrow text-[var(--muted)]">Who SchemeSaathi Serves</p>
            <div className="flex flex-wrap items-center gap-2.5">
              {targetGroups.map((group) => (
                <Link
                  key={group.cat}
                  to={`/schemes?category=${group.cat}`}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[var(--cream)] text-[var(--navy)] border border-[var(--line)] hover:border-[var(--navy)] transition-colors"
                >
                  <CategoryIcon kind={group.cat} size={16} />
                  <span>{group.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--line)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--cream)]"
                style={{ backgroundColor: 'var(--sdg-1)' }}
              >
                SDG 1 · No Poverty
              </span>
              <span
                className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--cream)]"
                style={{ backgroundColor: 'var(--sdg-10)' }}
              >
                SDG 10 · Reduced Inequalities
              </span>
              <span
                className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--cream)]"
                style={{ backgroundColor: 'var(--sdg-16)' }}
              >
                SDG 16 · Strong Institutions
              </span>
            </div>

            <a
              href="https://www.myscheme.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-[var(--accent-ink)] hover:underline underline-offset-4"
            >
              Visit official myScheme.gov.in
            </a>
          </div>
        </div>
      </section>

      {/* 10. Closing Dark Navy CTA with Coral Glow */}
      <section className="cta-editorial-bg text-[var(--cream)] border-t border-[var(--line-dark)] py-16 sm:py-20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="eyebrow text-[var(--accent)]">Free · Private · Clear</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[var(--cream)] leading-tight text-balance">
            Start finding schemes for your <AccentWord>family</AccentWord> today
          </h2>
          <p className="text-base sm:text-lg text-[var(--muted-dark)] max-w-xl mx-auto">
            Answer a few non-sensitive questions and keep track of required documents cleanly in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to={user ? '/recommendations' : '/profile'}
              className="btn-accent-pill px-8 py-3 inline-flex items-center gap-2 text-base"
            >
              <span>{user ? t('recommendations.title') : t('hero.ctaFind')}</span>
              <ArrowRightIcon size={18} />
            </Link>
            <Link
              to="/schemes"
              className="btn-outline-dark-pill px-7 py-3 inline-flex items-center text-base"
            >
              {t('hero.ctaBrowse')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
