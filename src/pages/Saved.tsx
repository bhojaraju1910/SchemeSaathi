import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import SampleBadge from '../components/SampleBadge';
import CategoryIcon, { getCategoryPalette } from '../components/CategoryIcon';
import { getHardcodedSchemeById } from '../services/schemeMirrorService';
import {
  getMirrorSavedSchemes,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';
import { Bookmark, Trash2, ExternalLink } from 'lucide-react';

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
  const [savedList, setSavedList] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      if (isMirrorToken(token) && user) {
        setSavedList(getMirrorSavedSchemes(user.id) as SavedRecord[]);
        return;
      }

      const res = await api.get('/saved');
      const records = (Array.isArray(res.data) ? res.data : []).map((item: SavedRecord) => ({
        ...item,
        scheme: item.scheme || getHardcodedSchemeById(item.schemeId)?.scheme,
      }));
      setSavedList(records);
    } catch (err) {
      console.error('Failed to load saved schemes, using mirror store:', err);
      if (user) {
        setSavedList(getMirrorSavedSchemes(user.id) as SavedRecord[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [user, token]);

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
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
            {t('savedPage.title')}
          </h1>
          <p className="text-base text-[var(--text-muted)] mt-1">
            {t('savedPage.subtitle')}
          </p>
        </div>

        <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
          {savedList.length} Scheme{savedList.length === 1 ? '' : 's'} Saved
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-[var(--surface)] rounded-[6px] border border-[var(--border)]" />
          ))}
        </div>
      ) : savedList.length === 0 ? (
        <EmptyState
          icon={Bookmark}
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
            const palette = getCategoryPalette(scheme.category);

            return (
              <article
                key={item.schemeId}
                className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] rounded-[6px] p-5 sm:p-6 space-y-4 transition-colors duration-150"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <CategoryIcon kind={scheme.category} size={22} withChip />

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold"
                          style={{ backgroundColor: palette.bg, color: palette.fg }}
                        >
                          {String(t(`categories.${scheme.category}`, scheme.category))}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[var(--medium-bg)] text-[var(--medium-text)]">
                          {scheme.level === 'central'
                            ? t('schemesPage.levelCentral')
                            : `${scheme.state || 'State'}`}
                        </span>
                        {scheme.isSample && <SampleBadge />}
                      </div>

                      <h2 className="text-[18px] font-bold text-[var(--text-primary)] leading-snug">
                        <Link
                          to={`/schemes/${scheme._id}`}
                          className="hover:text-[var(--teal)] transition-colors duration-150"
                        >
                          {displayTitle}
                        </Link>
                      </h2>

                      <p className="text-base text-[var(--text-muted)] leading-relaxed">
                        {displayDescription}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.schemeId)}
                    disabled={actionLoading === item.schemeId}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[6px] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--error)] hover:border-[var(--error)] transition-colors duration-150 cursor-pointer shrink-0"
                    title={t('savedPage.remove')}
                    aria-label={t('savedPage.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-[var(--text-muted)]">{t('savedPage.status')}:</span>
                    {isApplied ? (
                      <span className="font-semibold text-[var(--success)]">
                        {t('savedPage.statusApplied')}
                      </span>
                    ) : (
                      <span className="font-semibold text-[var(--saffron-tint-text)]">
                        {item.status === 'clicked' ? t('savedPage.statusClicked') : t('savedPage.statusNotApplied')}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStatusToggle(item.schemeId, item.status)}
                      disabled={actionLoading === item.schemeId}
                      className="min-h-[40px] px-3 py-1.5 rounded-[6px] text-sm font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors duration-150 cursor-pointer"
                    >
                      {isApplied ? t('savedPage.markNotApplied') : t('savedPage.markApplied')}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/schemes/${scheme._id}`}
                      className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors duration-150"
                    >
                      {t('recommendations.viewDetails')}
                    </Link>

                    <a
                      href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleOfficialClick(scheme._id)}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--deep-text)] bg-[var(--teal)] hover:bg-[var(--teal-hover)] transition-colors duration-150"
                    >
                      <span>{t('recommendations.officialPage')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Saved;
