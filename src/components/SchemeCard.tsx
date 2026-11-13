import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SampleBadge from './SampleBadge';
import MatchBadge from './MatchBadge';
import api from '../api/axios';
import {
  addMirrorSavedScheme,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';
import {
  Bookmark,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
} from 'lucide-react';

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

  // Localization resolution
  const currentLang = i18n.language as 'en' | 'kn' | 'hi';
  const hasTranslation =
    currentLang !== 'en' &&
    scheme.translations &&
    scheme.translations[currentLang] &&
    Boolean(scheme.translations[currentLang]?.title);

  const displayTitle = hasTranslation
    ? scheme.translations![currentLang]!.title!
    : scheme.title;

  const displayDescription = hasTranslation && scheme.translations![currentLang]?.shortDescription
    ? scheme.translations![currentLang]!.shortDescription!
    : scheme.shortDescription;

  const displayBenefits = hasTranslation && scheme.translations![currentLang]?.benefits?.length
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

  return (
    <div className="bg-[#14213B] border border-[#243A63] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:border-[#5AA9FF]/50 hover:shadow-lg hover:shadow-[#0B1426]/50 group relative">
      <div>
        {/* Top Badges and Category */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#5AA9FF]/10 text-[#5AA9FF] border border-[#5AA9FF]/20">
              {String(t(`categories.${scheme.category}`, scheme.category))}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#243A63]/60 text-[#9FB0C8] border border-[#243A63] flex items-center gap-1">
              <Building className="w-3 h-3 text-[#9FB0C8]" />
              {scheme.level === 'central'
                ? t('schemesPage.levelCentral')
                : `${scheme.state || 'State'} ${t('schemesPage.levelState')}`}
            </span>
            {scheme.isSample && <SampleBadge />}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleSave}
            disabled={saveLoading}
            aria-label={isSaved ? t('recommendations.saved') : t('recommendations.save')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#FF7BA5]/15 text-[#FF7BA5] border border-[#FF7BA5]/30'
                : 'text-[#9FB0C8] hover:text-[#EAF1FB] bg-[#0B1426]/60 border border-[#243A63] hover:border-[#5AA9FF]/40'
            }`}
            title={isSaved ? t('recommendations.saved') : t('recommendations.save')}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#EAF1FB] font-heading group-hover:text-[#5AA9FF] transition-colors line-clamp-2 mb-2">
          <Link to={`/schemes/${scheme._id}`}>{displayTitle}</Link>
        </h3>

        {/* Translation Indicator */}
        {!hasTranslation && currentLang !== 'en' && (
          <div className="text-[11px] text-[#9FB0C8]/80 mb-2 italic">
            ({t('shownInEnglish')})
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-[#9FB0C8] leading-relaxed line-clamp-3 mb-4">
          {displayDescription}
        </p>

        {/* Match Breakdown Section (If provided in recommendations) */}
        {match && (
          <div className="mb-4 pt-3 pb-3 px-3.5 bg-[#0B1426]/60 border border-[#243A63] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <MatchBadge match={match} />
              <span className="text-[11px] text-[#9FB0C8]">
                {reasons.length} rule{reasons.length === 1 ? '' : 's'} aligned
              </span>
            </div>

            {reasons.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#EAF1FB] mb-1.5 flex items-center gap-1">
                  <span>{t('recommendations.whyRelevant')}</span>
                </p>
                <ul className="space-y-1">
                  {reasons.map((r, i) => (
                    <li key={i} className="text-xs text-[#9FB0C8] flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match === 'Medium' && missing.length > 0 && (
              <div className="pt-2 border-t border-[#243A63]/60">
                <p className="text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1">
                  <span>{t('recommendations.pleaseConfirm')}</span>
                </p>
                <ul className="space-y-1">
                  {missing.map((m, i) => (
                    <li key={i} className="text-xs text-amber-200/90 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Key Benefit Highlights (when not in recommendation mode or small preview) */}
        {!match && displayBenefits && displayBenefits.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9FB0C8]">
              {t('schemeDetails.benefits')}
            </p>
            <p className="text-xs text-[#EAF1FB] flex items-start gap-1.5 line-clamp-2">
              <span className="text-[#5AA9FF] font-bold">•</span>
              {displayBenefits[0]}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer: Last Verified Date & Action Buttons */}
      <div className="pt-4 border-t border-[#243A63] mt-2 flex flex-col gap-3">
        {formattedDate && (
          <div className="flex items-center justify-between text-xs text-[#9FB0C8]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#9FB0C8]" />
              {t('schemeDetails.lastVerified')}:
            </span>
            <span className="text-[#EAF1FB] font-medium">{formattedDate}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/schemes/${scheme._id}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#EAF1FB] bg-[#0B1426] border border-[#243A63] hover:border-[#5AA9FF] hover:bg-[#14213B] transition-all"
          >
            <span>{t('recommendations.viewDetails')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <a
            href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOfficialClick}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 transition-all shadow-sm"
          >
            <span>{t('recommendations.officialPage')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SchemeCard;
