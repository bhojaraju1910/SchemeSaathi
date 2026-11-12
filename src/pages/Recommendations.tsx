import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import EmptyState from '../components/EmptyState';
import {
  Sparkles,
  Info,
  Loader2,
  SlidersHorizontal,
  BookmarkCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface MatchItem {
  scheme: SchemeData;
  match: 'High' | 'Medium';
  reasons: string[];
  missing: string[];
}

export const Recommendations: React.FC = () => {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterMatch, setFilterMatch] = useState<'all' | 'High' | 'Medium'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        // Call match API using stored user profile
        const [matchRes, savedRes] = await Promise.all([
          api.post('/match', {}),
          api.get('/saved'),
        ]);

        setMatches(matchRes.data || []);

        const ids = new Set<string>((savedRes.data || []).map((s: any) => s.schemeId));
        setSavedIds(ids);
      } catch (err: any) {
        console.error('Failed to evaluate recommendations:', err);
        setError('Could not evaluate scheme matches. Please verify your profile.');
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  const handleSaveToggle = (schemeId: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) {
        next.add(schemeId);
      } else {
        next.delete(schemeId);
      }
      return next;
    });
  };

  const highCount = matches.filter((m) => m.match === 'High').length;
  const mediumCount = matches.filter((m) => m.match === 'Medium').length;

  const filteredMatches = matches.filter((m) => {
    if (filterMatch === 'all') return true;
    return m.match === filterMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#243A63]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-6 h-6 text-[#5AA9FF]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EAF1FB] font-heading">
              {t('recommendations.title')}
            </h1>
          </div>
          <p className="text-sm text-[#9FB0C8] max-w-2xl leading-relaxed">
            {t('recommendations.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#EAF1FB] bg-[#14213B] border border-[#243A63] hover:border-[#5AA9FF]/50 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5AA9FF]" />
            <span>Update Profile</span>
          </Link>

          <Link
            to="/saved"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#EAF1FB] bg-[#14213B] border border-[#243A63] hover:border-[#5AA9FF]/50 transition-colors"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-[#FF7BA5]" />
            <span>View Saved ({savedIds.size})</span>
          </Link>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-[#14213B] border border-[#243A63] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#9FB0C8]">
        <Info className="w-4 h-4 text-[#5AA9FF] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#EAF1FB]">Important Disclaimer:</strong> These results represent{' '}
          <span className="text-[#5AA9FF] font-medium">potentially relevant</span> schemes identified by matching your declared age, state, category, and income band. No government benefit is guaranteed. Always verify eligibility rules directly on the official department website.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#14213B] p-1 rounded-xl border border-[#243A63]">
          <button
            onClick={() => setFilterMatch('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMatch === 'all'
                ? 'bg-[#5AA9FF] text-[#0B1426] shadow-sm'
                : 'text-[#9FB0C8] hover:text-[#EAF1FB]'
            }`}
          >
            All Potential Matches ({matches.length})
          </button>
          <button
            onClick={() => setFilterMatch('High')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMatch === 'High'
                ? 'bg-emerald-500 text-[#0B1426] shadow-sm'
                : 'text-emerald-300 hover:text-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>High Matches ({highCount})</span>
          </button>
          <button
            onClick={() => setFilterMatch('Medium')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMatch === 'Medium'
                ? 'bg-amber-500 text-[#0B1426] shadow-sm'
                : 'text-amber-300 hover:text-amber-200'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Medium Matches ({mediumCount})</span>
          </button>
        </div>

        <span className="text-xs text-[#9FB0C8]">
          Sorted: High alignment first, then Medium
        </span>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-[#14213B] rounded-2xl animate-pulse border border-[#243A63]" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Evaluation Failed"
          description={error}
          actionText="Edit Profile"
          actionLink="/profile"
        />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          title={t('recommendations.noMatches')}
          description={t('recommendations.updateProfilePrompt')}
          actionText="Update Profile"
          actionLink="/profile"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((item) => (
            <SchemeCard
              key={item.scheme._id}
              scheme={item.scheme}
              match={item.match}
              reasons={item.reasons}
              missing={item.missing}
              isInitiallySaved={savedIds.has(item.scheme._id)}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
