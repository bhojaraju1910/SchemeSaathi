import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import EmptyState from '../components/EmptyState';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import FallbackNotice from '../components/FallbackNotice';
import { matchHardcodedSchemes } from '../services/schemeMirrorService';
import {
  loadEmergencySchemes,
  readSessionCache,
  withTimeout,
  writeSessionCache,
} from '../utils/clientCache';
import {
  getMirrorCatalog,
  getMirrorProfile,
  getMirrorSavedSchemes,
  isMirrorToken,
  setMirrorCatalog,
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
  const { registerSchemes } = useCompare();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterMatch, setFilterMatch] = useState<'all' | 'High' | 'Medium'>('all');
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    const loadCatalogForMirror = async (): Promise<{
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
        // fallback to emergency copy
      }
      const emergency = await loadEmergencySchemes();
      setMirrorCatalog(emergency);
      return { catalog: emergency, usedEmergency: true };
    };

    const loadLocalMatches = async () => {
      let profileData = user ? getMirrorProfile(user.id) : {};
      if (!isMirrorToken(token)) {
        try {
          const profileRes = await withTimeout(
            (signal) => api.get('/profile', { signal }),
            4000
          );
          if (profileRes.data && typeof profileRes.data === 'object') {
            profileData = profileRes.data;
          }
        } catch {
          // keep mirror profile
        }
      }
      const { catalog, usedEmergency } = await loadCatalogForMirror();
      const localResults = matchHardcodedSchemes(profileData, catalog) as unknown as MatchItem[];
      setMatches(localResults);
      registerSchemes(localResults.map((m) => m.scheme));
      if (user) {
        setSavedIds(new Set(getMirrorSavedSchemes(user.id, catalog).map((s) => s.schemeId)));
      }
      setIsFallback(usedEmergency);
      setError(null);
    };

    try {
      setLoading(true);
      if (isMirrorToken(token)) {
        await loadLocalMatches();
        return;
      }

      const [matchRes, savedRes] = await withTimeout(
        (signal) =>
          Promise.all([
            api.post('/match', {}, { signal }),
            api.get('/saved', { signal }),
          ]),
        4000
      );

      if (Array.isArray(matchRes.data) && matchRes.data.length > 0) {
        setMatches(matchRes.data);
        registerSchemes(matchRes.data.map((m: MatchItem) => m.scheme));
        const ids = new Set<string>((savedRes.data || []).map((s: any) => s.schemeId));
        setSavedIds(ids);
        setIsFallback(false);
        setError(null);
      } else {
        await loadLocalMatches();
      }
    } catch {
      await loadLocalMatches();
    } finally {
      setLoading(false);
    }
  }, [user, token, registerSchemes]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

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

  const visibleHigh = filteredMatches.filter((m) => m.match === 'High');
  const visibleMedium = filteredMatches.filter((m) => m.match === 'Medium');

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Personalized Guidance"
        title={
          <>
            Potentially Relevant <AccentWord>Schemes</AccentWord>
          </>
        }
        subtitle={t('recommendations.subtitle')}
        actions={
          <>
            <Link
              to="/profile"
              className="btn-outline-dark-pill min-h-[44px] inline-flex items-center justify-center px-5 py-2 text-sm"
            >
              Update Profile
            </Link>

            <Link
              to="/saved"
              className="btn-accent-pill min-h-[44px] inline-flex items-center justify-center px-5 py-2 text-sm tabular-nums"
            >
              View Saved ({savedIds.size})
            </Link>
          </>
        }
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {isFallback && <FallbackNotice onRetry={fetchMatches} />}

        {/* Advisory Banner */}
        <div className="editorial-card p-4 sm:p-5 text-sm text-[var(--navy)]">
          <p>
            <strong>Important Disclaimer:</strong> These results represent{' '}
            <span className="font-bold text-[var(--accent-ink)]">potentially relevant</span> schemes identified by checking your declared age, state, category, and income bracket. Always confirm eligibility rules on the official portal.
          </p>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[var(--paper)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setFilterMatch('all')}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                filterMatch === 'all'
                  ? 'bg-[var(--navy)] text-[var(--cream)]'
                  : 'text-[var(--muted)] hover:text-[var(--navy)]'
              }`}
            >
              All Potential Matches ({matches.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMatch('High')}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                filterMatch === 'High'
                  ? 'bg-[var(--accent)] text-[var(--navy)]'
                  : 'text-[var(--muted)] hover:text-[var(--navy)]'
              }`}
            >
              High Matches ({highCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMatch('Medium')}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                filterMatch === 'Medium'
                  ? 'bg-[var(--navy)] text-[var(--cream)]'
                  : 'text-[var(--muted)] hover:text-[var(--navy)]'
              }`}
            >
              Medium Matches ({mediumCount})
            </button>
          </div>

          <span className="text-sm text-[var(--muted)]">
            Sorted: Strongest matches first
          </span>
        </div>

        {/* Grouped Vertical List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="editorial-card p-6 h-44 space-y-3">
                <div className="h-5 w-40 rounded-full bg-[var(--line)]/70" />
                <div className="h-7 w-2/3 rounded-[10px] bg-[var(--line)]/55" />
                <div className="h-4 w-full rounded-[8px] bg-[var(--line)]/40" />
              </div>
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
          <div className="space-y-12">
            {visibleHigh.length > 0 && (
              <section className="space-y-5">
                <div className="pb-3 border-b border-[var(--line)] flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)]">
                    Strong <AccentWord>matches</AccentWord>
                  </h2>
                  <span className="text-sm font-bold text-[var(--badge-high-text)] tabular-nums">
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
              <section className="space-y-5">
                <div className="pb-3 border-b border-[var(--line)] flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--navy)]">
                    Please <AccentWord>confirm</AccentWord>
                  </h2>
                  <span className="text-sm font-bold text-[var(--badge-medium-text)] tabular-nums">
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
    </div>
  );
};

export default Recommendations;
