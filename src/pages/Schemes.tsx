import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import EmptyState from '../components/EmptyState';
import CategoryIcon from '../components/CategoryIcon';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import FallbackNotice from '../components/FallbackNotice';
import { useCompare } from '../context/CompareContext';
import { queryHardcodedSchemes } from '../services/schemeMirrorService';
import {
  loadEmergencySchemes,
  readSessionCache,
  withTimeout,
  writeSessionCache,
} from '../utils/clientCache';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  SlidersIcon,
} from '../components/Icons';

const PAGE_LIMIT = 12;

const CATEGORIES = [
  { value: '', kind: 'all', labelKey: 'categories.all' },
  { value: 'education', kind: 'education', labelKey: 'categories.education' },
  { value: 'healthcare', kind: 'healthcare', labelKey: 'categories.healthcare' },
  { value: 'housing', kind: 'housing', labelKey: 'categories.housing' },
  { value: 'employment', kind: 'employment', labelKey: 'categories.employment' },
  { value: 'women_child', kind: 'women_child', labelKey: 'categories.women_child' },
  { value: 'senior_citizens', kind: 'senior_citizens', labelKey: 'categories.senior_citizens' },
  { value: 'agriculture', kind: 'agriculture', labelKey: 'categories.agriculture' },
];

const STATES = [
  'All',
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Delhi',
  'Uttar Pradesh',
  'Andhra Pradesh',
  'Kerala',
];

interface CachedPagePayload {
  schemes: SchemeData[];
  total: number;
  page: number;
  totalPages: number;
}

export const Schemes: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { registerSchemes } = useCompare();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const stateParam = searchParams.get('state') || 'All';
  const levelParam = searchParams.get('level') || 'All';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const cacheKey = `ss_cache_schemes_${queryParam}_${categoryParam}_${stateParam}_${levelParam}_${pageParam}`;
  const initialCache = readSessionCache<CachedPagePayload>(cacheKey);

  const [schemes, setSchemes] = useState<SchemeData[]>(() => initialCache?.data?.schemes || []);
  const [total, setTotal] = useState<number>(() => initialCache?.data?.total || 0);
  const [page, setPage] = useState<number>(() => initialCache?.data?.page || pageParam);
  const [totalPages, setTotalPages] = useState<number>(() => initialCache?.data?.totalPages || 1);
  const [loading, setLoading] = useState<boolean>(() => !initialCache?.data);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);
  const [state, setState] = useState(stateParam);
  const [level, setLevel] = useState(levelParam);

  useEffect(() => {
    setSearchTerm(queryParam);
    setCategory(categoryParam);
    setState(stateParam);
    setLevel(levelParam);
  }, [queryParam, categoryParam, stateParam, levelParam]);

  const fetchSchemes = useCallback(async () => {
    const mirrorFilters = {
      q: queryParam,
      category: categoryParam,
      state: stateParam,
      level: levelParam,
      page: pageParam,
      limit: PAGE_LIMIT,
    };

    const cached = readSessionCache<CachedPagePayload>(cacheKey);
    if (cached?.data) {
      setSchemes(cached.data.schemes);
      setTotal(cached.data.total);
      setPage(cached.data.page);
      setTotalPages(cached.data.totalPages);
      registerSchemes(cached.data.schemes);
      setLoading(false);
      if (!cached.isStale) {
        setIsFallback(false);
        return;
      }
    } else {
      setLoading(true);
    }

    const applyEmergencyFallback = async () => {
      const emergencyCatalog = await loadEmergencySchemes();
      const mirrored = queryHardcodedSchemes(mirrorFilters, emergencyCatalog);
      const list = mirrored.schemes as unknown as SchemeData[];
      setSchemes(list);
      registerSchemes(list);
      setTotal(mirrored.total);
      setPage(mirrored.page);
      setTotalPages(mirrored.totalPages);
      setIsFallback(true);
    };

    try {
      const params = new URLSearchParams();
      if (queryParam) params.set('q', queryParam);
      if (categoryParam) params.set('category', categoryParam);
      if (stateParam && stateParam !== 'All') params.set('state', stateParam);
      if (levelParam && levelParam !== 'All') params.set('level', levelParam);
      params.set('page', String(pageParam));
      params.set('limit', String(PAGE_LIMIT));

      const res = await withTimeout(
        (signal) => api.get(`/schemes?${params.toString()}`, { signal }),
        4000
      );

      const hasFilters = Boolean(
        queryParam ||
          categoryParam ||
          (stateParam && stateParam !== 'All') ||
          (levelParam && levelParam !== 'All')
      );

      if (Array.isArray(res.data?.schemes) && (res.data.total > 0 || hasFilters)) {
        const payload: CachedPagePayload = {
          schemes: res.data.schemes,
          total: res.data.total || 0,
          page: res.data.page || 1,
          totalPages: res.data.totalPages || 1,
        };
        setSchemes(payload.schemes);
        registerSchemes(payload.schemes);
        setTotal(payload.total);
        setPage(payload.page);
        setTotalPages(payload.totalPages);
        writeSessionCache(cacheKey, payload);
        setIsFallback(false);
      } else {
        await applyEmergencyFallback();
      }
    } catch {
      await applyEmergencyFallback();
    } finally {
      setLoading(false);
    }
  }, [queryParam, categoryParam, stateParam, levelParam, pageParam, cacheKey, registerSchemes]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const applyFilters = (newFilters: {
    q?: string;
    category?: string;
    state?: string;
    level?: string;
    page?: number;
  }) => {
    const next = new URLSearchParams(searchParams);

    const merged = {
      q: newFilters.q !== undefined ? newFilters.q : queryParam,
      category: newFilters.category !== undefined ? newFilters.category : categoryParam,
      state: newFilters.state !== undefined ? newFilters.state : stateParam,
      level: newFilters.level !== undefined ? newFilters.level : levelParam,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    };

    if (merged.q) next.set('q', merged.q);
    else next.delete('q');

    if (merged.category) next.set('category', merged.category);
    else next.delete('category');

    if (merged.state && merged.state !== 'All') next.set('state', merged.state);
    else next.delete('state');

    if (merged.level && merged.level !== 'All') next.set('level', merged.level);
    else next.delete('level');

    next.set('page', String(merged.page));

    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm, page: 1 });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategory('');
    setState('All');
    setLevel('All');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    queryParam || categoryParam || stateParam !== 'All' || levelParam !== 'All'
  );

  const filterFormContent = (
    <div className="space-y-6">
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <label htmlFor="schemes-search" className="block text-sm font-bold text-[var(--navy)]">
          Search
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
            <SearchIcon size={17} />
          </span>
          <input
            id="schemes-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('schemesPage.searchPlaceholder')}
            className="editorial-input w-full pl-10 pr-3 py-2 text-base placeholder:text-[var(--muted)]"
          />
        </div>
        <button
          type="submit"
          className="btn-accent-pill w-full min-h-[44px] px-4 py-2 text-sm cursor-pointer"
        >
          Search
        </button>
      </form>

      <div className="pt-5 border-t border-[var(--line)] space-y-5">
        <div>
          <p className="block text-sm font-bold text-[var(--navy)] mb-2.5">
            {t('schemesPage.filterCategory')}
          </p>
          <div className="flex flex-col gap-1.5" role="group" aria-label={t('schemesPage.filterCategory')}>
            {CATEGORIES.map((c) => {
              const isSelected = category === c.value;
              return (
                <button
                  key={c.value || 'all'}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setCategory(c.value);
                    applyFilters({ category: c.value, page: 1 });
                  }}
                  className={`w-full min-h-[42px] px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2.5 text-left transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                      : 'bg-[var(--cream)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-[var(--paper)] inline-flex items-center justify-center shrink-0">
                    <CategoryIcon kind={c.kind} size={15} />
                  </span>
                  <span className="leading-snug truncate">{t(c.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="filter-level" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
            {t('schemesPage.filterLevel')}
          </label>
          <select
            id="filter-level"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              applyFilters({ level: e.target.value, page: 1 });
            }}
            className="editorial-input w-full px-3.5 py-2 text-base cursor-pointer"
          >
            <option value="All">{t('schemesPage.allLevels')}</option>
            <option value="central">{t('schemesPage.levelCentral')}</option>
            <option value="state">{t('schemesPage.levelState')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-state" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
            {t('schemesPage.filterState')}
          </label>
          <select
            id="filter-state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              applyFilters({ state: e.target.value, page: 1 });
            }}
            className="editorial-input w-full px-3.5 py-2 text-base cursor-pointer"
          >
            {STATES.map((st) => (
              <option key={st} value={st}>
                {st === 'All' ? t('schemesPage.allStates') : st}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="w-full min-h-[44px] px-4 py-2 rounded-full text-sm font-bold text-[var(--error)] bg-[var(--error-bg)] border border-[var(--error-border)] hover:border-[var(--error)] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );

  const heroTitle =
    i18n.language === 'en' ? (
      <>
        Government Protection <AccentWord>Directory</AccentWord>
      </>
    ) : (
      t('schemesPage.title')
    );

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Central & State Directory"
        title={heroTitle}
        subtitle={
          loading
            ? 'Loading welfare directory...'
            : t('schemesPage.foundCount', { count: total })
        }
        actions={
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            aria-expanded={mobileFiltersOpen}
            className="lg:hidden btn-outline-dark-pill min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2 text-sm cursor-pointer"
          >
            <SlidersIcon size={16} />
            <span>{mobileFiltersOpen ? 'Hide Filters' : 'Filter Schemes'}</span>
          </button>
        }
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {isFallback && <FallbackNotice onRetry={fetchSchemes} />}

        {mobileFiltersOpen && (
          <aside className="lg:hidden editorial-card p-5">{filterFormContent}</aside>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
          <aside className="hidden lg:block lg:sticky lg:top-24 editorial-card p-5">
            {filterFormContent}
          </aside>

          <div className="space-y-6 min-w-0">
            {loading && schemes.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="editorial-card p-6 h-44 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="h-4 w-36 rounded-full bg-[var(--line)]/70" />
                      <div className="h-6 w-3/4 rounded-[10px] bg-[var(--line)]/60" />
                      <div className="h-4 w-full rounded-[8px] bg-[var(--line)]/45" />
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-[var(--line)]">
                      <div className="h-10 w-32 rounded-full bg-[var(--line)]/60" />
                      <div className="h-10 w-32 rounded-full bg-[var(--line)]/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : schemes.length === 0 ? (
              <EmptyState
                title={t('schemesPage.noSchemesFound')}
                description="Try broadening your search term or resetting the category and state filters."
                actionText="Reset All Filters"
                onActionClick={clearAllFilters}
              />
            ) : (
              <div className="space-y-4">
                {schemes.map((scheme) => (
                  <SchemeCard key={scheme._id} scheme={scheme} />
                ))}
              </div>
            )}

            <div className="editorial-card p-5 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)]">
              <span>Missing a scheme or need an update?</span>
              <Link
                to="/suggest"
                className="text-[var(--accent-ink)] font-bold hover:underline underline-offset-4"
              >
                Suggest a scheme
              </Link>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => applyFilters({ page: Math.max(1, page - 1) })}
                  disabled={page <= 1}
                  className="btn-outline-pill min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Previous Page"
                >
                  <ChevronLeftIcon size={16} />
                  <span>Previous</span>
                </button>

                <span className="text-sm font-bold text-[var(--navy)] tabular-nums">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => applyFilters({ page: Math.min(totalPages, page + 1) })}
                  disabled={page >= totalPages}
                  className="btn-outline-pill min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Next Page"
                >
                  <span>Next</span>
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schemes;
