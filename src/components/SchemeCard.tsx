import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SampleBadge from './SampleBadge';
import MatchBadge from './MatchBadge';
import CategoryIcon, { getCategoryPalette } from './CategoryIcon';
import api from '../api/axios';
import {
  addMirrorSavedScheme,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';

export interface SchemeData {
  _id: string;
  title: string;
  shortDescription: string;
  category: string;
  level: 'central' | 'state';
  state: string;
  benefits: string[];
  documentsRequired: string[];
  applyUrl: string;
  sourceUrl: string;
  lastVerified: string | Date;
  isSample: boolean;
  translations?: {
    kn?: { title?: string; shortDescription?: string; benefits?: string[] };
    hi?: { title?: string; shortDescription?: string; benefits?: string[] };
  };
}

interface SchemeCardProps {
  scheme: SchemeData;
  match?: 'High' | 'Medium';
  reasons?: string[];
  missing?: string[];
  isInitiallySaved?: boolean;
  onSaveToggle?: (schemeId: string, saved: boolean) => void;
}

const BookmarkSvg: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 4h12v16l-6-4-6 4V4z" />
  </svg>
);

const ExternalSvg: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 4h6v6" />
    <path d="M10 14L20 4" />
    <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
  </svg>
);

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  match,
  reasons = [],
  missing = [],
  isInitiallySaved = false,
  onSaveToggle,
}) => {
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [saveLoading, setSaveLoading] = useState(false);

  const currentLang = i18n.language as 'en' | 'kn' | 'hi';
  const hasTranslation =
    currentLang !== 'en' &&
    scheme.translations &&
    scheme.translations[currentLang] &&
    Boolean(scheme.translations[currentLang]?.title);

  const displayTitle = hasTranslation
    ? scheme.translations![currentLang]!.title!
    : scheme.title;

  const displayDescription =
    hasTranslation && scheme.translations![currentLang]?.shortDescription
      ? scheme.translations![currentLang]!.shortDescription!
      : scheme.shortDescription;

  const displayBenefits =
    hasTranslation && scheme.translations![currentLang]?.benefits?.length
      ? scheme.translations![currentLang]!.benefits!
      : scheme.benefits;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        removeMirrorSavedScheme(user.id, scheme._id);
        if (!isMirrorToken(token)) {
          await api.delete(`/saved/${scheme._id}`).catch(() => {});
        }
        setIsSaved(false);
        onSaveToggle?.(scheme._id, false);
      } else {
        addMirrorSavedScheme(user.id, scheme._id);
        if (!isMirrorToken(token)) {
          await api.post('/saved', { schemeId: scheme._id }).catch(() => {});
        }
        setIsSaved(true);
        onSaveToggle?.(scheme._id, true);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleOfficialClick = async () => {
    if (user) {
      recordMirrorApplicationStatus(user.id, scheme._id, 'clicked');
      if (!isMirrorToken(token)) {
        try {
          await api.post('/applications/click', { schemeId: scheme._id, status: 'clicked' });
        } catch {
          // non-blocking
        }
      }
    }
  };

  const formattedDate = scheme.lastVerified
    ? new Date(scheme.lastVerified).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const categoryLabel = String(t(`categories.${scheme.category}`, scheme.category));
  const levelLabel =
    scheme.level === 'central'
      ? t('schemesPage.levelCentral')
      : `${scheme.state || 'State'} ${t('schemesPage.levelState')}`;

  const palette = getCategoryPalette(scheme.category);

  // Recommendation list row layout (when match prop is provided)
  if (match) {
    const oneLineSummary = reasons[0] || displayDescription;

    return (
      <article className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] rounded-[6px] p-5 sm:p-6 space-y-4 transition-colors duration-150">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <CategoryIcon kind={scheme.category} size={22} withChip />

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <MatchBadge match={match} />
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold"
                  style={{ backgroundColor: palette.bg, color: palette.fg }}
                >
                  {categoryLabel}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[var(--medium-bg)] text-[var(--medium-text)]">
                  {levelLabel}
                </span>
                {scheme.isSample && <SampleBadge />}
              </div>

              <h3 className="text-[18px] font-bold text-[var(--text-primary)] leading-snug">
                <Link
                  to={`/schemes/${scheme._id}`}
                  className="hover:text-[var(--teal)] transition-colors duration-150"
                >
                  {displayTitle}
                </Link>
              </h3>

              {!hasTranslation && currentLang !== 'en' && (
                <p className="text-xs text-[var(--text-muted)] italic">
                  ({t('shownInEnglish')})
                </p>
              )}

              <p className="text-base text-[var(--text-muted)] leading-relaxed">
                {oneLineSummary}
              </p>

              {formattedDate && (
                <p className="text-xs text-[var(--text-muted)] tabular-nums">
                  {t('schemeDetails.lastVerified')}: {formattedDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={`/schemes/${scheme._id}`}
              className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors duration-150 whitespace-nowrap"
            >
              {t('recommendations.viewDetails')}
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              aria-label={isSaved ? t('recommendations.saved') : t('recommendations.save')}
              className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[6px] text-sm font-semibold border transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                isSaved
                  ? 'bg-[var(--teal)] text-[var(--deep-text)] border-[var(--teal)] hover:bg-[var(--teal-hover)]'
                  : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)]'
              }`}
            >
              <BookmarkSvg filled={isSaved} />
              <span>{isSaved ? t('recommendations.saved') : t('recommendations.save')}</span>
            </button>

            <a
              href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOfficialClick}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--deep-text)] bg-[var(--teal)] hover:bg-[var(--teal-hover)] transition-colors duration-150 whitespace-nowrap"
            >
              <span>{t('recommendations.officialPage')}</span>
              <ExternalSvg />
            </a>
          </div>
        </div>

        {(reasons.length > 0 || (match === 'Medium' && missing.length > 0)) && (
          <div className="pt-4 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-4">
            {reasons.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  {t('recommendations.whyRelevant')}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--success)]">
                  {reasons.map((r, i) => (
                    <li key={i}>
                      <span className="text-[var(--text-primary)]">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match === 'Medium' && missing.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--saffron-tint-text)] mb-1.5">
                  {t('recommendations.pleaseConfirm')}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--saffron-tint-text)]">
                  {missing.map((m, i) => (
                    <li key={i}>
                      <span className="text-[var(--text-primary)]">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </article>
    );
  }

  // Flat bordered card / catalog row layout (Landing Popular Schemes & Catalog)
  return (
    <article className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] rounded-[6px] p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors duration-150">
      <div className="flex items-start gap-4">
        <CategoryIcon kind={scheme.category} size={22} withChip />

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold"
                style={{ backgroundColor: palette.bg, color: palette.fg }}
              >
                {categoryLabel}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[var(--medium-bg)] text-[var(--medium-text)]">
                {levelLabel}
              </span>
              {scheme.isSample && <SampleBadge />}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              aria-label={isSaved ? t('recommendations.saved') : t('recommendations.save')}
              title={isSaved ? t('recommendations.saved') : t('recommendations.save')}
              className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-[6px] border transition-colors duration-150 cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-[var(--teal)] text-[var(--deep-text)] border-[var(--teal)] hover:bg-[var(--teal-hover)]'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)]'
              }`}
            >
              <BookmarkSvg filled={isSaved} />
            </button>
          </div>

          <h3 className="text-[18px] font-bold text-[var(--text-primary)] leading-snug">
            <Link
              to={`/schemes/${scheme._id}`}
              className="hover:text-[var(--teal)] transition-colors duration-150"
            >
              {displayTitle}
            </Link>
          </h3>

          {!hasTranslation && currentLang !== 'en' && (
            <p className="text-xs text-[var(--text-muted)] italic">
              ({t('shownInEnglish')})
            </p>
          )}

          <p className="text-base text-[var(--text-muted)] leading-relaxed">
            {displayDescription}
          </p>

          {displayBenefits && displayBenefits.length > 0 && (
            <p className="text-sm text-[var(--text-primary)] pt-0.5">
              <span className="font-semibold">{t('schemeDetails.benefits')}: </span>
              {displayBenefits[0]}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border)] space-y-3">
        {formattedDate && (
          <p className="text-sm text-[var(--text-muted)] tabular-nums">
            {t('schemeDetails.lastVerified')}: <span className="font-medium text-[var(--text-primary)]">{formattedDate}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/schemes/${scheme._id}`}
            className="flex-1 min-w-[120px] min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors duration-150 whitespace-nowrap"
          >
            {t('recommendations.viewDetails')}
          </Link>

          <a
            href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOfficialClick}
            className="flex-1 min-w-[120px] min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--deep-text)] bg-[var(--teal)] hover:bg-[var(--teal-hover)] transition-colors duration-150 whitespace-nowrap"
          >
            <span>{t('recommendations.officialPage')}</span>
            <ExternalSvg />
          </a>
        </div>
      </div>
    </article>
  );
};

export default SchemeCard;
