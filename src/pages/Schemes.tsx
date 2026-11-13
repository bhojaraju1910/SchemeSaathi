import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import EmptyState from '../components/EmptyState';
import CategoryIcon, { getCategoryPalette } from '../components/CategoryIcon';
import { queryHardcodedSchemes } from '../services/schemeMirrorService';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

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

export const Schemes: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const stateParam = searchParams.get('state') || 'All';
  const levelParam = searchParams.get('level') || 'All';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const initialMirror = queryHardcodedSchemes({
    q: queryParam,
    category: categoryParam,
    state: stateParam,
    level: levelParam,
    page: pageParam || 1,
    limit: 9,
  });

  const [schemes, setSchemes] = useState<SchemeData[]>(initialMirror.schemes);
  const [total, setTotal] = useState<number>(initialMirror.total);
  const [page, setPage] = useState<number>(initialMirror.page);
  const [totalPages, setTotalPages] = useState<number>(initialMirror.totalPages);
  const [loading, setLoading] = useState<boolean>(false);
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

  useEffect(() => {
    const mirrorFilters = {
      q: queryParam,
      category: categoryParam,
      state: stateParam,
      level: levelParam,
      page: pageParam || 1,
      limit: 9,
    };

    const mirrored = queryHardcodedSchemes(mirrorFilters);
    setSchemes(mirrored.schemes);
    setTotal(mirrored.total);
    setPage(mirrored.page);
    setTotalPages(mirrored.totalPages);

    async function fetchSchemes() {
      try {
        const params = new URLSearchParams();
        if (queryParam) params.set('q', queryParam);
        if (categoryParam) params.set('category', categoryParam);
        if (stateParam && stateParam !== 'All') params.set('state', stateParam);
        if (levelParam && levelParam !== 'All') params.set('level', levelParam);
        params.set('page', String(pageParam || 1));
        params.set('limit', '9');

        const res = await api.get(`/schemes?${params.toString()}`);
        const hasFilters = Boolean(
          queryParam || categoryParam || (stateParam && stateParam !== 'All') || (levelParam && levelParam !== 'All')
        );

        if (Array.isArray(res.data?.schemes) && (res.data.total > 0 || hasFilters)) {
          setSchemes(res.data.schemes);
          setTotal(res.data.total || 0);
          setPage(res.data.page || 1);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load schemes from API, using hardcoded frontend catalog:', err);
        setSchemes(mirrored.schemes);
        setTotal(mirrored.total);
        setPage(mirrored.page);
        setTotalPages(mirrored.totalPages);
      } finally {
        setLoading(false);
      }
    }

    fetchSchemes();
  }, [queryParam, categoryParam, stateParam, levelParam, pageParam]);

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
    <div className="space-y-5">
      <form onSubmit={handleSearchSubmit} className="space-y-2">
        <label htmlFor="schemes-search" className="block text-sm font-semibold text-[var(--text-primary)]">
          Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="schemes-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('schemesPage.searchPlaceholder')}
            className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <button
          type="submit"
          className="w-full min-h-[44px] px-4 py-2 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-sm rounded-[6px] transition-colors duration-150 cursor-pointer"
        >
          Search
        </button>
      </form>

      <div className="pt-4 border-t border-[var(--border)] space-y-4">
        {/* Coloured category chips */}
        <div>
          <p className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            {t('schemesPage.filterCategory')}
          </p>
          <div className="flex flex-col gap-1.5" role="group" aria-label={t('schemesPage.filterCategory')}>
            {CATEGORIES.map((c) => {
              const isSelected = category === c.value;
              const palette = getCategoryPalette(c.kind);
              return (
                <button
                  key={c.value || 'all'}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setCategory(c.value);
                    applyFilters({ category: c.value, page: 1 });
                  }}
                  className={`w-full min-h-[40px] px-3 py-1.5 rounded-[6px] text-sm font-semibold flex items-center gap-2.5 text-left transition-colors duration-150 cursor-pointer border ${
                    isSelected
                      ? 'border-[var(--text-primary)]'
                      : 'border-[var(--border)] hover:border-[var(--teal)]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? palette.bg : 'var(--surface)',
                    color: isSelected ? palette.fg : 'var(--text-primary)',
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-[6px] inline-flex items-center justify-center shrink-0"
                    style={{ backgroundColor: palette.bg, color: palette.fg }}
                  >
                    <CategoryIcon kind={c.kind} size={15} />
                  </span>
                  <span className="truncate">{t(c.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="filter-level" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
            {t('schemesPage.filterLevel')}
          </label>
          <select
            id="filter-level"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              applyFilters({ level: e.target.value, page: 1 });
            }}
            className="w-full min-h-[44px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] cursor-pointer"
          >
            <option value="All">{t('schemesPage.allLevels')}</option>
            <option value="central">{t('schemesPage.levelCentral')}</option>
            <option value="state">{t('schemesPage.levelState')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-state" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
            {t('schemesPage.filterState')}
          </label>
          <select
            id="filter-state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              applyFilters({ state: e.target.value, page: 1 });
            }}
            className="w-full min-h-[44px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] cursor-pointer"
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
            className="w-full min-h-[44px] px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--error)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--error)] transition-colors duration-150 cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="pb-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
            {t('schemesPage.title')}
          </h1>
          <p className="text-base text-[var(--text-muted)] mt-1 tabular-nums">
            {t('schemesPage.foundCount', { count: total })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          aria-expanded={mobileFiltersOpen}
          className="lg:hidden min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--teal)] transition-colors duration-150 self-start cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[var(--teal)]" />
          <span>{mobileFiltersOpen ? 'Hide Filters' : 'Filter Schemes'}</span>
        </button>
      </div>

      {mobileFiltersOpen && (
        <aside className="lg:hidden bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-5">
          {filterFormContent}
        </aside>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
        <aside className="hidden lg:block bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-5">
          {filterFormContent}
        </aside>

        <div className="space-y-6 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-[var(--surface)] rounded-[6px] border border-[var(--border)]" />
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

          <div className="pt-2 flex items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
            <span>Missing a scheme or need an update?</span>
            <Link
              to="/suggest"
              className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-semibold underline underline-offset-2 transition-colors duration-150"
            >
              Suggest a scheme
            </Link>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-6 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => applyFilters({ page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--teal)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => applyFilters({ page: Math.min(totalPages, page + 1) })}
                disabled={page >= totalPages}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--teal)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                aria-label="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schemes;
