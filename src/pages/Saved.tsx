import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import EmptyState from '../components/EmptyState';
import SampleBadge from '../components/SampleBadge';
import VerificationBadge from '../components/VerificationBadge';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import FallbackNotice from '../components/FallbackNotice';
import CategoryIcon, { getCategoryIconColor } from '../components/CategoryIcon';
import { getChecklistProgress, readChecklist } from '../utils/schemeTools';
import { loadEmergencySchemes, withTimeout } from '../utils/clientCache';
import {
  getMirrorCatalog,
  getMirrorSavedSchemes,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
  setMirrorCatalog,
} from '../services/authMirrorService';
import {
  BookmarkIcon,
  ExternalLinkIcon,
  FileCheckIcon,
  TrashIcon,
} from '../components/Icons';

interface SavedRecord {
  _id: string;
  userId: string;
  schemeId: string;
  savedAt: string;
  scheme: any;
  status?: 'clicked' | 'applied' | 'not_applied';
}

export const Saved: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const { registerSchemes } = useCompare();

  const [savedList, setSavedList] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    const loadMirrorSavedWithCatalog = async () => {
      if (!user) return;
      let catalog = getMirrorCatalog();
      let usedEmergency = false;
      if (catalog.length === 0) {
        try {
          const res = await withTimeout(
            (signal) => api.get('/schemes/quick-catalog', { signal }),
            4000
          );
          if (Array.isArray(res.data?.schemes) && res.data.schemes.length > 0) {
            catalog = res.data.schemes;
            setMirrorCatalog(catalog);
          }
        } catch {
          // fallback below
        }
      }
      if (catalog.length === 0) {
        catalog = await loadEmergencySchemes();
        setMirrorCatalog(catalog);
        usedEmergency = true;
      }
      const list = getMirrorSavedSchemes(user.id, catalog) as SavedRecord[];
      setSavedList(list);
      registerSchemes(list.map((l) => l.scheme).filter(Boolean));
      setIsFallback(usedEmergency);
    };

    try {
      setLoading(true);
      if (isMirrorToken(token)) {
        await loadMirrorSavedWithCatalog();
        return;
      }

      const res = await withTimeout((signal) => api.get('/saved', { signal }), 4000);
      const records: SavedRecord[] = Array.isArray(res.data) ? res.data : [];

      const unresolvedIds = records
        .filter((item) => !item.scheme && item.schemeId)
        .map((item) => item.schemeId);

      if (unresolvedIds.length > 0) {
        const emergency = await loadEmergencySchemes();
        const byId = new Map<string, any>();
        for (const s of emergency) {
          byId.set(s._id, s);
          if (s.slug) byId.set(s.slug, s);
        }
        setSavedList(
          records.map((item) => ({
            ...item,
            scheme: item.scheme || byId.get(item.schemeId),
          }))
        );
      } else {
        setSavedList(records);
      }
      registerSchemes(records.map((r) => r.scheme).filter(Boolean));
      setIsFallback(false);
    } catch {
      await loadMirrorSavedWithCatalog();
    } finally {
      setLoading(false);
    }
  }, [user, token, registerSchemes]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleRemove = async (schemeId: string) => {
    setActionLoading(schemeId);
    try {
      if (user) {
        removeMirrorSavedScheme(user.id, schemeId);
      }
      if (!isMirrorToken(token)) {
        await api.delete(`/saved/${schemeId}`).catch(() => {});
      }
      setSavedList((prev) => prev.filter((item) => item.schemeId !== schemeId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (schemeId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'applied' ? 'not_applied' : 'applied';
    setActionLoading(schemeId);
    try {
      if (user) {
        recordMirrorApplicationStatus(user.id, schemeId, nextStatus);
      }
      if (!isMirrorToken(token)) {
        await api.post('/applications/status', { schemeId, status: nextStatus }).catch(() => {});
      }
      setSavedList((prev) =>
        prev.map((item) =>
          item.schemeId === schemeId ? { ...item, status: nextStatus } : item
        )
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleOfficialClick = async (schemeId: string) => {
    if (user) {
      recordMirrorApplicationStatus(user.id, schemeId, 'clicked');
    }
    if (!isMirrorToken(token)) {
      try {
        await api.post('/applications/click', { schemeId, status: 'clicked' });
      } catch {
        // non-blocking
      }
    }
  };

  const currentLang = i18n.language as 'en' | 'kn' | 'hi';

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Shortlist & Documents"
        title={
          <>
            Saved <AccentWord>Schemes</AccentWord>
          </>
        }
        subtitle={t('savedPage.subtitle')}
        actions={
          <span className="px-4 py-2 rounded-full bg-[var(--navy-2)] border border-[var(--line-dark)] text-sm font-bold text-[var(--cream)] tabular-nums">
            {savedList.length} Scheme{savedList.length === 1 ? '' : 's'} Saved
          </span>
        }
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {isFallback && <FallbackNotice onRetry={fetchSaved} />}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="editorial-card p-6 h-40 space-y-3">
                <div className="h-5 w-44 rounded-full bg-[var(--line)]/70" />
                <div className="h-7 w-2/3 rounded-[10px] bg-[var(--line)]/55" />
                <div className="h-4 w-full rounded-[8px] bg-[var(--line)]/40" />
              </div>
            ))}
          </div>
        ) : savedList.length === 0 ? (
          <EmptyState
            icon={BookmarkIcon}
            title={t('savedPage.empty')}
            description="Browse potentially relevant schemes and click the bookmark button to save them here."
            actionText={t('savedPage.browseNow')}
            actionLink="/schemes"
          />
        ) : (
          <div className="space-y-4">
            {savedList.map((item) => {
              const scheme = item.scheme;
              if (!scheme) return null;

              const hasTranslation =
                currentLang !== 'en' &&
                scheme.translations &&
                scheme.translations[currentLang] &&
                Boolean(scheme.translations[currentLang]?.title);

              const displayTitle = hasTranslation
                ? scheme.translations[currentLang].title
                : scheme.title;

              const displayDescription =
                hasTranslation && scheme.translations[currentLang]?.shortDescription
                  ? scheme.translations[currentLang].shortDescription
                  : scheme.shortDescription;

              const isApplied = item.status === 'applied';
              const iconTint = getCategoryIconColor(scheme.category);
              const docsTotal = Array.isArray(scheme.documentsRequired)
                ? scheme.documentsRequired.length
                : 0;
              const docChecks = readChecklist(scheme._id, docsTotal);
              const docProgress = getChecklistProgress(docChecks, docsTotal);

              return (
                <article
                  key={item.schemeId}
                  className="editorial-card editorial-card-lift p-5 sm:p-6 space-y-5 hover:border-[var(--navy)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <CategoryIcon kind={scheme.category} size={22} withChip />

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <span className="font-bold text-[var(--navy)] inline-flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: iconTint }}
                              aria-hidden="true"
                            />
                            <span>{String(t(`categories.${scheme.category}`, scheme.category))}</span>
                          </span>
                          <span className="text-[var(--line)]" aria-hidden="true">·</span>
                          <span className="font-medium text-[var(--muted)]">
                            {scheme.level === 'central'
                              ? t('schemesPage.levelCentral')
                              : `${scheme.state || 'State'}`}
                          </span>
                          <span className="text-[var(--line)]" aria-hidden="true">·</span>
                          {scheme.isSample ? (
                            <SampleBadge />
                          ) : (
                            <VerificationBadge
                              verified={scheme.verified}
                              lastVerified={scheme.lastVerified}
                              isSample={scheme.isSample}
                            />
                          )}
                        </div>

                        <h2 className="font-display text-xl font-bold text-[var(--navy)] leading-snug">
                          <Link
                            to={`/schemes/${scheme._id}`}
                            className="hover:text-[var(--accent-ink)] transition-colors"
                          >
                            {displayTitle}
                          </Link>
                        </h2>

                        <p className="text-base text-[var(--muted)] leading-relaxed">
                          {displayDescription}
                        </p>

                        {docProgress.total > 0 && (
                          <div className="pt-2 flex flex-wrap items-center gap-3">
                            <Link
                              to={`/schemes/${scheme._id}`}
                              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--navy)] bg-[var(--cream)] border border-[var(--line)] px-3 py-1.5 rounded-full hover:border-[var(--navy)] transition-colors tabular-nums"
                            >
                              <FileCheckIcon size={14} className="text-[var(--accent-ink)]" />
                              <span>
                                {t('detailsExtra.checklistProgress', {
                                  done: docProgress.done,
                                  total: docProgress.total,
                                })}
                              </span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.schemeId)}
                      disabled={actionLoading === item.schemeId}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[var(--cream)] text-[var(--muted)] hover:text-[var(--error)] hover:border-[var(--error)] transition-colors cursor-pointer shrink-0"
                      title={t('savedPage.remove')}
                      aria-label={t('savedPage.remove')}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="text-[var(--muted)]">{t('savedPage.status')}:</span>
                      {isApplied ? (
                        <span className="font-bold text-[var(--success)]">
                          {t('savedPage.statusApplied')}
                        </span>
                      ) : (
                        <span className="font-bold text-[var(--badge-high-text)]">
                          {item.status === 'clicked'
                            ? t('savedPage.statusClicked')
                            : t('savedPage.statusNotApplied')}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item.schemeId, item.status)}
                        disabled={actionLoading === item.schemeId}
                        className="btn-card-3d-subtle bg-[var(--paper)] text-[var(--navy)] min-h-[40px] px-4 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        {isApplied ? t('savedPage.markNotApplied') : t('savedPage.markApplied')}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/schemes/${scheme._id}`}
                        className="btn-card-3d-outline min-h-[44px] inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm"
                      >
                        {t('recommendations.viewDetails')}
                      </Link>

                      <a
                        href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleOfficialClick(scheme._id)}
                        className="btn-card-3d-accent min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm"
                      >
                        <span>{t('recommendations.officialPage')}</span>
                        <ExternalLinkIcon size={14} />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;
