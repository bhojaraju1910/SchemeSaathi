import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import EmptyState from '../components/EmptyState';
import SampleBadge from '../components/SampleBadge';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Compass,
} from 'lucide-react';

const CATEGORIES = [
  { value: '', labelKey: 'categories.all' },
  { value: 'education', labelKey: 'categories.education' },
  { value: 'healthcare', labelKey: 'categories.healthcare' },
  { value: 'housing', labelKey: 'categories.housing' },
  { value: 'employment', labelKey: 'categories.employment' },
  { value: 'women_child', labelKey: 'categories.women_child' },
  { value: 'senior_citizens', labelKey: 'categories.senior_citizens' },
  { value: 'agriculture', labelKey: 'categories.agriculture' },
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

  const [schemes, setSchemes] = useState<SchemeData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state from URL or defaults
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const stateParam = searchParams.get('state') || 'All';
  const levelParam = searchParams.get('level') || 'All';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);
  const [state, setState] = useState(stateParam);
  const [level, setLevel] = useState(levelParam);

  // Fetch schemes
  useEffect(() => {
    async function fetchSchemes() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (queryParam) params.set('q', queryParam);
        if (categoryParam) params.set('category', categoryParam);
        if (stateParam && stateParam !== 'All') params.set('state', stateParam);
        if (levelParam && levelParam !== 'All') params.set('level', levelParam);
        params.set('page', String(pageParam || 1));
        params.set('limit', '9');

        const res = await api.get(`/schemes?${params.toString()}`);
        setSchemes(res.data.schemes || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error('Failed to load schemes:', err);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#243A63]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-6 h-6 text-[#5AA9FF]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EAF1FB] font-heading">
              {t('schemesPage.title')}
            </h1>
          </div>
          <p className="text-sm text-[#9FB0C8]">
            {t('schemesPage.foundCount', { count: total })}
          </p>
        </div>

        {/* Clear Filters Button */}
        {(queryParam || categoryParam || stateParam !== 'All' || levelParam !== 'All') && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#FF7BA5] bg-[#FF7BA5]/10 border border-[#FF7BA5]/30 hover:bg-[#FF7BA5]/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#14213B] border border-[#243A63] rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-[#9FB0C8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('schemesPage.searchPlaceholder')}
            className="w-full pl-10 pr-24 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] placeholder:text-[#9FB0C8]/50 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 text-[#0B1426] font-bold text-xs rounded-lg transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
              {t('schemesPage.filterCategory')}
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                applyFilters({ category: e.target.value, page: 1 });
              }}
              className="w-full px-3 py-2 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none transition-colors cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Level Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
              {t('schemesPage.filterLevel')}
            </label>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                applyFilters({ level: e.target.value, page: 1 });
              }}
              className="w-full px-3 py-2 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="All">{t('schemesPage.allLevels')}</option>
              <option value="central">{t('schemesPage.levelCentral')}</option>
              <option value="state">{t('schemesPage.levelState')}</option>
            </select>
          </div>

          {/* State Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
              {t('schemesPage.filterState')}
            </label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                applyFilters({ state: e.target.value, page: 1 });
              }}
              className="w-full px-3 py-2 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none transition-colors cursor-pointer"
            >
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? t('schemesPage.allStates') : st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-[#14213B] rounded-2xl animate-pulse border border-[#243A63]" />
          ))}
        </div>
      ) : schemes.length === 0 ? (
        <EmptyState
          title={t('schemesPage.noSchemesFound')}
          description="Try broadening your search term or resetting the category/state filters."
          actionText="Reset All Filters"
          onActionClick={clearAllFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <SchemeCard key={scheme._id} scheme={scheme} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#243A63]/60">
          <button
            onClick={() => applyFilters({ page: Math.max(1, page - 1) })}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-[#14213B] border border-[#243A63] text-[#9FB0C8] hover:text-[#EAF1FB] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-[#EAF1FB]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => applyFilters({ page: Math.min(totalPages, page + 1) })}
            disabled={page >= totalPages}
            className="p-2 rounded-xl bg-[#14213B] border border-[#243A63] text-[#9FB0C8] hover:text-[#EAF1FB] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Schemes;
