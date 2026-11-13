import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import EmptyState from '../components/EmptyState';
import { matchHardcodedSchemes } from '../services/schemeMirrorService';
import {
  getMirrorProfile,
  getMirrorSavedSchemes,
  isMirrorToken,
} from '../services/authMirrorService';

interface MatchItem {
  scheme: SchemeData;
  match: 'High' | 'Medium';
  reasons: string[];
  missing: string[];
}

export const Recommendations: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterMatch, setFilterMatch] = useState<'all' | 'High' | 'Medium'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      const loadLocalMatches = async () => {
        let profileData = user ? getMirrorProfile(user.id) : {};
        if (!isMirrorToken(token)) {
          try {
            const profileRes = await api.get('/profile');
            if (profileRes.data && typeof profileRes.data === 'object') {
              profileData = profileRes.data;
            }
          } catch {
            // keep mirror profile
          }
        }
        setMatches(matchHardcodedSchemes(profileData));
        if (user) {
          setSavedIds(new Set(getMirrorSavedSchemes(user.id).map((s) => s.schemeId)));
        }
        setError(null);
      };

      try {
        setLoading(true);
        if (isMirrorToken(token)) {
          await loadLocalMatches();
          return;
        }

        const [matchRes, savedRes] = await Promise.all([
          api.post('/match', {}),
          api.get('/saved'),
        ]);

        if (Array.isArray(matchRes.data)) {
          setMatches(matchRes.data);
          const ids = new Set<string>((savedRes.data || []).map((s: any) => s.schemeId));
          setSavedIds(ids);
        } else {
          await loadLocalMatches();
        }
      } catch (err: any) {
        console.error('Failed to evaluate recommendations via API, mirroring locally:', err);
        await loadLocalMatches();
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [user, token]);

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

  const highMatches = matches.filter((m) => m.match === 'High');
  const mediumMatches = matches.filter((m) => m.match === 'Medium');
  const highCount = highMatches.length;
  const mediumCount = mediumMatches.length;

  const filteredMatches = matches.filter((m) => {
    if (filterMatch === 'all') return true;
    return m.match === filterMatch;
  });

  const visibleHigh = filteredMatches.filter((m) => m.match === 'High');
  const visibleMedium = filteredMatches.filter((m) => m.match === 'Medium');

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
            {t('recommendations.title')}
          </h1>
          <p className="text-base text-[var(--text-muted)] mt-1 max-w-2xl">
            {t('recommendations.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/profile"
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors duration-150"
          >
            Update Profile
          </Link>

          <Link
            to="/saved"
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors duration-150 tabular-nums"
          >
            View Saved ({savedIds.size})
          </Link>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-4 text-sm text-[var(--text-primary)]">
        <p>
          <strong>Important Disclaimer:</strong> These results represent{' '}
          <span className="font-semibold text-[var(--teal)]">potentially relevant</span> schemes identified by matching your declared age, state, category, and income band. No government benefit is guaranteed. Always verify eligibility rules directly on the official department website.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMatch('all')}
            className={`min-h-[44px] px-4 py-2 rounded-[6px] text-sm font-semibold border transition-colors duration-150 cursor-pointer tabular-nums ${
              filterMatch === 'all'
                ? 'bg-[var(--teal)] text-[var(--deep-text)] border-[var(--teal)]'
                : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--teal)]'
            }`}
          >
            All Potential Matches ({matches.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMatch('High')}
            className={`min-h-[44px] px-4 py-2 rounded-[6px] text-sm font-semibold border transition-colors duration-150 cursor-pointer tabular-nums ${
              filterMatch === 'High'
                ? 'bg-[var(--saffron-tint)] text-[var(--saffron-tint-text)] border-[var(--saffron-tint-text)]'
                : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--saffron-tint-text)]'
            }`}
          >
            High Matches ({highCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMatch('Medium')}
            className={`min-h-[44px] px-4 py-2 rounded-[6px] text-sm font-semibold border transition-colors duration-150 cursor-pointer tabular-nums ${
              filterMatch === 'Medium'
                ? 'bg-[var(--medium-bg)] text-[var(--medium-text)] border-[var(--medium-text)]'
                : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--medium-text)]'
            }`}
          >
            Medium Matches ({mediumCount})
          </button>
        </div>

        <span className="text-sm text-[var(--text-muted)]">
          Sorted: High alignment first, then Medium
        </span>
      </div>

      {/* Vertical Grouped List Rows */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-[var(--surface)] rounded-[6px] border border-[var(--border)]" />
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
        <div className="space-y-8">
          {visibleHigh.length > 0 && (
            <section className="space-y-4">
              <div className="px-4 py-3 rounded-[6px] bg-[var(--saffron-tint)] border border-[var(--saffron-border)] flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[18px] font-bold text-[var(--saffron-tint-text)]">
                  Strong matches
                </h2>
                <span className="text-sm font-semibold text-[var(--saffron-tint-text)] tabular-nums">
                  {visibleHigh.length} {visibleHigh.length === 1 ? 'scheme' : 'schemes'}
                </span>
              </div>

              <div className="space-y-4">
                {visibleHigh.map((item) => (
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
            </section>
          )}

          {visibleMedium.length > 0 && (
            <section className="space-y-4">
              <div className="px-4 py-3 rounded-[6px] bg-[var(--medium-bg)] border border-[var(--medium-border)] flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[18px] font-bold text-[var(--medium-text)]">
                  Please confirm
                </h2>
                <span className="text-sm font-semibold text-[var(--medium-text)] tabular-nums">
                  {visibleMedium.length} {visibleMedium.length === 1 ? 'scheme' : 'schemes'}
                </span>
              </div>

              <div className="space-y-4">
                {visibleMedium.map((item) => (
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
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
