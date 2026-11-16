import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import SampleBadge from './SampleBadge';
import VerificationBadge from './VerificationBadge';
import MatchBadge from './MatchBadge';
import CategoryIcon, { getCategoryIconColor } from './CategoryIcon';
import ProgressRing from './ProgressRing';
import { getRuleProgress } from '../utils/schemeTools';
import api from '../api/axios';
import {
  addMirrorSavedScheme,
  getMirrorCatalog,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';
import {
  AlertCircleIcon,
  BookmarkIcon,
  CheckIcon,
  ExternalLinkIcon,
  ScaleIcon,
} from './Icons';

export interface SchemeData {
  _id: string;
  slug?: string;
  title: string;
  shortDescription: string;
  category: string;
  level: 'central' | 'state';
  state: string;
  benefits: string[];
  documentsRequired: string[];
  applyUrl: string;
  sourceUrl: string;
  verified?: boolean;
  lastVerified: string | Date | null;
  isSample: boolean;
  isActive?: boolean;
  rules?: { label?: string }[];
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
  const { isCompared, toggleCompare } = useCompare();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [saveLoading, setSaveLoading] = useState(false);

  const compared = isCompared(scheme._id);
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
        addMirrorSavedScheme(user.id, scheme._id, getMirrorCatalog(), scheme as any);
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

  const iconTint = getCategoryIconColor(scheme.category);

  // Recommendation row layout (with ProgressRing + rules reasons/missing + Compare button)
  if (match) {
    const oneLineSummary = reasons[0] || displayDescription;
    const ruleProgress = getRuleProgress(
      scheme._id,
      reasons.length,
      missing.length,
      scheme.rules?.length
    );

    return (
      <article className="editorial-card editorial-card-lift p-5 sm:p-7 space-y-5 hover:border-[var(--navy)] transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <CategoryIcon kind={scheme.category} size={22} withChip />

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
                <MatchBadge match={match} />
                <span className="font-bold text-[var(--navy)] inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: iconTint }} aria-hidden="true" />
                  <span>{categoryLabel}</span>
                </span>
                <span className="text-[var(--line)]" aria-hidden="true">·</span>
                <span className="font-medium text-[var(--muted)]">{levelLabel}</span>
                {scheme.isSample ? (
                  <>
                    <span className="text-[var(--line)]" aria-hidden="true">·</span>
                    <SampleBadge />
                  </>
                ) : (
                  <>
                    <span className="text-[var(--line)]" aria-hidden="true">·</span>
                    <VerificationBadge
                      verified={scheme.verified}
                      lastVerified={scheme.lastVerified}
                      isSample={scheme.isSample}
                    />
                  </>
                )}
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--navy)] leading-snug">
                <Link
                  to={`/schemes/${scheme._id}`}
                  className="hover:text-[var(--accent-ink)] transition-colors"
                >
                  {displayTitle}
                </Link>
              </h3>

              {!hasTranslation && currentLang !== 'en' && (
                <p className="text-xs text-[var(--muted)] italic">({t('shownInEnglish')})</p>
              )}

              <p className="text-base text-[var(--muted)] leading-relaxed max-w-2xl">
                {oneLineSummary}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0">
            <ProgressRing
              passed={ruleProgress.passed}
              total={ruleProgress.total}
              label="rules passed"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCompare(scheme)}
                aria-pressed={compared}
                className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                  compared
                    ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                    : 'bg-[var(--cream)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
                }`}
              >
                <ScaleIcon size={15} />
                <span>{compared ? t('comparePage.addedCompare') : t('comparePage.addCompare')}</span>
              </button>

              <Link
                to={`/schemes/${scheme._id}`}
                className="btn-outline-pill min-h-[44px] px-4 py-2 inline-flex items-center justify-center text-xs font-bold whitespace-nowrap"
              >
                {t('recommendations.viewDetails')}
              </Link>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveLoading}
                aria-label={isSaved ? t('recommendations.saved') : t('recommendations.save')}
                className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                  isSaved
                    ? 'bg-[var(--badge-high-bg)] text-[var(--badge-high-text)] border-[var(--accent)]'
                    : 'bg-[var(--paper)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
                }`}
              >
                <BookmarkIcon size={15} filled={isSaved} />
                <span>{isSaved ? t('recommendations.saved') : t('recommendations.save')}</span>
              </button>

              <a
                href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOfficialClick}
                className="btn-accent-pill min-h-[44px] px-5 py-2 inline-flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap"
              >
                <span>{t('recommendations.officialPage')}</span>
                <ExternalLinkIcon size={14} />
              </a>
            </div>
          </div>
        </div>

        {(reasons.length > 0 || (match === 'Medium' && missing.length > 0)) && (
          <div className="pt-5 border-t border-[var(--line)] grid grid-cols-1 md:grid-cols-2 gap-4">
            {reasons.length > 0 && (
              <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-[12px] p-4">
                <p className="text-sm font-bold text-[var(--success)] mb-2">
                  {t('recommendations.whyRelevant')}
                </p>
                <ul className="space-y-1.5 text-sm text-[var(--navy)]">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon size={16} className="text-[var(--success)] mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match === 'Medium' && missing.length > 0 && (
              <div className="bg-[var(--badge-high-bg)] border border-[var(--line)] rounded-[12px] p-4">
                <p className="text-sm font-bold text-[var(--badge-high-text)] mb-2">
                  {t('recommendations.pleaseConfirm')}
                </p>
                <ul className="space-y-1.5 text-sm text-[var(--navy)]">
                  {missing.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircleIcon size={16} className="text-[var(--badge-high-text)] mt-0.5" />
                      <span>{m}</span>
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

  // Catalog / Landing Editorial Scheme Card
  return (
    <article className="editorial-card editorial-card-lift p-5 sm:p-6 flex flex-col justify-between gap-5 hover:border-[var(--navy)] transition-colors duration-200">
      <div className="flex items-start gap-4">
        <CategoryIcon kind={scheme.category} size={22} withChip />

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs pt-0.5">
              <span className="font-bold text-[var(--navy)] inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: iconTint }} aria-hidden="true" />
                <span>{categoryLabel}</span>
              </span>
              <span className="text-[var(--line)]" aria-hidden="true">·</span>
              <span className="font-medium text-[var(--muted)]">{levelLabel}</span>
              {scheme.isSample ? (
                <>
                  <span className="text-[var(--line)]" aria-hidden="true">·</span>
                  <SampleBadge />
                </>
              ) : (
                <>
                  <span className="text-[var(--line)]" aria-hidden="true">·</span>
                  <VerificationBadge
                    verified={scheme.verified}
                    lastVerified={scheme.lastVerified}
                    isSample={scheme.isSample}
                  />
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              aria-label={isSaved ? t('recommendations.saved') : t('recommendations.save')}
              title={isSaved ? t('recommendations.saved') : t('recommendations.save')}
              className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full border transition-colors cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-[var(--badge-high-bg)] text-[var(--badge-high-text)] border-[var(--accent)]'
                  : 'bg-[var(--cream)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--navy)] hover:text-[var(--navy)]'
              }`}
            >
              <BookmarkIcon size={16} filled={isSaved} />
            </button>
          </div>

          <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--navy)] leading-snug">
            <Link
              to={`/schemes/${scheme._id}`}
              className="hover:text-[var(--accent-ink)] transition-colors"
            >
              {displayTitle}
            </Link>
          </h3>

          {!hasTranslation && currentLang !== 'en' && (
            <p className="text-xs text-[var(--muted)] italic">({t('shownInEnglish')})</p>
          )}

          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            {displayDescription}
          </p>

          {displayBenefits && displayBenefits.length > 0 && (
            <p className="text-sm text-[var(--navy)] pt-1 leading-relaxed">
              <span className="font-bold text-[var(--accent-ink)]">{t('schemeDetails.benefits')}: </span>
              {displayBenefits[0]}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--line)] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {formattedDate ? (
            <p className="text-xs text-[var(--muted)] tabular-nums">
              {t('schemeDetails.lastVerified')}:{' '}
              <span className="font-semibold text-[var(--navy)]">{formattedDate}</span>
            </p>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              {t('badges.confirmPortal', 'Confirm details on official portal')}
            </p>
          )}

          <button
            type="button"
            onClick={() => toggleCompare(scheme)}
            aria-pressed={compared}
            className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              compared
                ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                : 'bg-[var(--cream)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
            }`}
          >
            <ScaleIcon size={14} />
            <span>{compared ? t('comparePage.addedCompare') : t('comparePage.addCompare')}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/schemes/${scheme._id}`}
            className="btn-outline-pill flex-1 min-w-[120px] min-h-[44px] inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            {t('recommendations.viewDetails')}
          </Link>

          <a
            href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOfficialClick}
            className="btn-accent-pill flex-1 min-w-[120px] min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <span>{t('recommendations.officialPage')}</span>
            <ExternalLinkIcon size={14} />
          </a>
        </div>
      </div>
    </article>
  );
};

export default SchemeCard;
