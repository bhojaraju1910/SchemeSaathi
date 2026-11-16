import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import api from '../api/axios';
import SampleBadge from '../components/SampleBadge';
import VerificationBadge from '../components/VerificationBadge';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import FallbackNotice from '../components/FallbackNotice';
import CategoryIcon, { getCategoryIconColor } from '../components/CategoryIcon';
import {
  AlertCircleIcon,
  BookmarkIcon,
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
  FileCheckIcon,
  PrintIcon,
  ScaleIcon,
  ShareIcon,
  StopIcon,
  VolumeIcon,
} from '../components/Icons';
import { getHardcodedSchemeById } from '../services/schemeMirrorService';
import {
  addMirrorSavedScheme,
  getMirrorCatalog,
  getMirrorSavedSchemes,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';
import {
  loadEmergencySchemes,
  readSessionCache,
  withTimeout,
  writeSessionCache,
} from '../utils/clientCache';
import {
  getChecklistProgress,
  readChecklist,
  writeChecklist,
} from '../utils/schemeTools';
import type { SchemeData } from '../components/SchemeCard';

function getLocaleSpeechLang(lang: string): string {
  if (lang === 'kn') return 'kn-IN';
  if (lang === 'hi') return 'hi-IN';
  return 'en-IN';
}

export const SchemeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const { isCompared, toggleCompare, compareIds, registerSchemes } = useCompare();
  const navigate = useNavigate();

  const cacheKey = id ? `ss_cache_scheme_${id}` : '';
  const initialCached = cacheKey ? readSessionCache<any>(cacheKey) : null;

  const [data, setData] = useState<any>(() => initialCached?.data || null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(() => !initialCached?.data);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [docChecks, setDocChecks] = useState<boolean[]>([]);

  const speechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!speechSupported) return;
    const loadVoices = () => {
      try {
        setVoices(window.speechSynthesis.getVoices() || []);
      } catch {
        setVoices([]);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, [speechSupported]);

  useEffect(() => {
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [id, i18n.language, speechSupported]);

  const loadScheme = useCallback(async () => {
    if (!id) return;

    const cached = readSessionCache<any>(`ss_cache_scheme_${id}`);
    if (cached?.data?.scheme) {
      setData(cached.data);
      registerSchemes([cached.data.scheme]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (user) {
      const localSaved = getMirrorSavedSchemes(user.id).some((s) => s.schemeId === id);
      if (localSaved) setIsSaved(true);
    }

    const fallbackLookup = async () => {
      const emergency = await loadEmergencySchemes();
      const matched = getHardcodedSchemeById(id, emergency);
      if (matched) {
        setData(matched);
        registerSchemes([matched.scheme as unknown as SchemeData]);
        setError(null);
        setIsFallback(true);
      } else {
        setError('Scheme could not be loaded or was removed.');
      }
    };

    try {
      const [schemeRes, savedRes] = await withTimeout(
        (signal) =>
          Promise.all([
            api.get(`/schemes/${id}`, { signal }),
            user && !isMirrorToken(token)
              ? api.get('/saved', { signal }).catch(() => ({ data: null }))
              : Promise.resolve({ data: null }),
          ]),
        4000
      );

      if (schemeRes.data?.scheme) {
        setData(schemeRes.data);
        writeSessionCache(`ss_cache_scheme_${id}`, schemeRes.data);
        registerSchemes([
          {
            ...schemeRes.data.scheme,
            rules: schemeRes.data.criteria?.rules || schemeRes.data.scheme.rules,
          },
        ]);
        setError(null);
        setIsFallback(false);
      } else {
        await fallbackLookup();
      }

      if (user && Array.isArray(savedRes.data)) {
        const found = savedRes.data.some((s: any) => s.schemeId === id);
        setIsSaved(found);
      }
    } catch {
      await fallbackLookup();
    } finally {
      setLoading(false);
    }
  }, [id, user, token, registerSchemes]);

  useEffect(() => {
    loadScheme();
  }, [loadScheme]);

  const docsList: string[] = useMemo(() => {
    if (!data?.scheme?.documentsRequired || !Array.isArray(data.scheme.documentsRequired)) {
      return [];
    }
    return data.scheme.documentsRequired;
  }, [data]);

  const schemeKey = data?.scheme?._id || id || '';

  useEffect(() => {
    if (!schemeKey) return;
    setDocChecks(readChecklist(schemeKey, docsList.length));
  }, [schemeKey, docsList.length]);

  const handleToggleChecklist = useCallback(
    (index: number) => {
      if (!schemeKey) return;
      setDocChecks((prev) => {
        const next = Array.from({ length: docsList.length }, (_, i) => Boolean(prev[i]));
        next[index] = !next[index];
        writeChecklist(schemeKey, next);
        return next;
      });
    },
    [schemeKey, docsList.length]
  );

  const checklistProgress = useMemo(
    () => getChecklistProgress(docChecks, docsList.length),
    [docChecks, docsList.length]
  );

  const handleSaveToggle = async () => {
    if (!user || !id) {
      navigate('/login');
      return;
    }
    setSaveLoading(true);
    try {
      if (isSaved) {
        removeMirrorSavedScheme(user.id, id);
        if (!isMirrorToken(token)) {
          await api.delete(`/saved/${id}`).catch(() => {});
        }
        setIsSaved(false);
      } else {
        addMirrorSavedScheme(user.id, id, getMirrorCatalog(), data?.scheme);
        if (!isMirrorToken(token)) {
          await api.post('/saved', { schemeId: id }).catch(() => {});
        }
        setIsSaved(true);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleOfficialClick = async () => {
    if (user && id) {
      recordMirrorApplicationStatus(user.id, id, 'clicked');
      if (!isMirrorToken(token)) {
        try {
          await api.post('/applications/click', { schemeId: id, status: 'clicked' });
        } catch {
          // non-blocking
        }
      }
    }
  };

  if (loading) {
    return (
      <div>
        <PageHero
          backTo="/schemes"
          backLabel={t('schemeDetails.back')}
          eyebrow="Scheme Guide"
          title="Loading scheme details..."
          subtitle="Fetching plain-language rules, documents checklist, and official links."
        />
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 pb-14 space-y-6">
          <div className="editorial-card p-6 h-20" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 editorial-card h-72" />
            <div className="lg:col-span-5 editorial-card h-72" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.scheme) {
    return (
      <div>
        <PageHero
          backTo="/schemes"
          backLabel={t('schemeDetails.back')}
          eyebrow="Directory Notice"
          title="Scheme Not Found"
        />
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 pb-14">
          <EmptyState
            title="Scheme Not Found"
            description={error || 'The requested scheme does not exist.'}
            actionText="Back to Directory"
            actionLink="/schemes"
          />
        </div>
      </div>
    );
  }

  const { scheme, criteria } = data;
  const currentLang = i18n.language as 'en' | 'kn' | 'hi';

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

  const displayBenefits: string[] =
    hasTranslation && scheme.translations[currentLang]?.benefits?.length
      ? scheme.translations[currentLang].benefits
      : scheme.benefits || [];

  const formattedDate = scheme.lastVerified
    ? new Date(scheme.lastVerified).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const sourceHost = (() => {
    try {
      return scheme.sourceUrl ? new URL(scheme.sourceUrl).hostname : 'myscheme.gov.in';
    } catch {
      return 'myscheme.gov.in';
    }
  })();

  const iconTint = getCategoryIconColor(scheme.category);
  const categoryLabel = String(t(`categories.${scheme.category}`, scheme.category));
  const levelLabel =
    scheme.level === 'central'
      ? t('schemesPage.levelCentral')
      : `${scheme.state || 'State'} ${t('schemesPage.levelState')}`;

  const pageUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://schemesaathi.app/schemes/${scheme._id}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${displayTitle} — ${pageUrl}`
  )}`;

  const compared = isCompared(scheme._id);

  const handleListenToggle = () => {
    if (!speechSupported) {
      setSpeechNotice(t('detailsExtra.listenUnsupported'));
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setSpeechNotice(null);
    window.speechSynthesis.cancel();

    const targetLocale = getLocaleSpeechLang(currentLang);
    const langPrefix = currentLang;
    const availableVoices =
      voices.length > 0 ? voices : window.speechSynthesis.getVoices?.() || [];

    const matchedVoice = availableVoices.find((v) =>
      v.lang.toLowerCase().startsWith(langPrefix)
    );

    if (availableVoices.length > 0 && !matchedVoice && currentLang !== 'en') {
      setSpeechNotice(t('detailsExtra.listenUnsupported'));
    }

    const rulesSummary =
      criteria?.rules?.length > 0
        ? criteria.rules
            .map((r: any) => r.label || `${r.field} ${r.op} ${r.value}`)
            .join('. ')
        : '';

    const spokenText = [
      displayTitle,
      displayDescription,
      displayBenefits.length > 0 ? `${t('schemeDetails.benefits')}: ${displayBenefits.join('. ')}` : '',
      rulesSummary ? `${t('schemeDetails.eligibilityRules')}: ${rulesSummary}` : '',
    ]
      .filter(Boolean)
      .join('. ');

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = targetLocale;
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.rate = 0.96;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechNotice(t('detailsExtra.listenUnsupported'));
    };

    try {
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setSpeechNotice(t('detailsExtra.listenUnsupported'));
    }
  };

  return (
    <div className="pb-28 sm:pb-14">
      <PageHero
        backTo="/schemes"
        backLabel={t('schemeDetails.back')}
        icon={
          <span
            className="w-14 h-14 rounded-[16px] bg-[var(--navy-2)] border border-[var(--line-dark)] inline-flex items-center justify-center shrink-0"
            style={{ color: iconTint }}
          >
            <CategoryIcon kind={scheme.category} size={28} />
          </span>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--cream)]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: iconTint }}
                aria-hidden="true"
              />
              <span>{categoryLabel}</span>
            </span>
            <span className="text-[var(--line-dark)]" aria-hidden="true">·</span>
            <span className="text-[var(--muted-dark)] font-medium">{levelLabel}</span>
            <span className="text-[var(--line-dark)]" aria-hidden="true">·</span>
            {scheme.isSample ? (
              <SampleBadge />
            ) : (
              <VerificationBadge
                verified={scheme.verified}
                lastVerified={scheme.lastVerified}
                isSample={scheme.isSample}
              />
            )}
          </>
        }
        title={displayTitle}
        subtitle={
          <>
            {!hasTranslation && currentLang !== 'en' && (
              <span className="block text-sm text-[var(--muted-dark)] italic mb-1.5">
                ({t('shownInEnglish')})
              </span>
            )}
            <span>{displayDescription}</span>
          </>
        }
      />

      {/* Overlapping Main Content */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-8">
        {isFallback && <FallbackNotice onRetry={loadScheme} />}

        {/* Print-only Source & Disclaimer Line */}
        <div className="print-only border border-[var(--line)] p-4 mb-4">
          <p className="font-bold">SchemeSaathi — Printed Guidance Summary</p>
          <p className="text-sm">Page link: {pageUrl}</p>
          <p className="text-sm">{t('disclaimer')}</p>
        </div>

        {/* Utility Action Bar */}
        <section
          aria-label="Scheme tools"
          className="no-print editorial-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleListenToggle}
              disabled={!speechSupported}
              aria-pressed={isSpeaking}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                isSpeaking
                  ? 'bg-[var(--accent)] text-[var(--navy)] border-[var(--accent)]'
                  : 'bg-[var(--cream)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
              }`}
            >
              {isSpeaking ? <StopIcon size={16} /> : <VolumeIcon size={16} />}
              <span>
                {isSpeaking
                  ? t('detailsExtra.stopListenBtn')
                  : t('detailsExtra.listenBtn')}
              </span>
            </button>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[var(--cream)] text-[var(--navy)] border border-[var(--line)] hover:border-[var(--navy)] transition-colors"
            >
              <ShareIcon size={16} />
              <span>{t('detailsExtra.shareWhatsapp')}</span>
            </a>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[var(--cream)] text-[var(--navy)] border border-[var(--line)] hover:border-[var(--navy)] transition-colors cursor-pointer"
            >
              <PrintIcon size={16} />
              <span>{t('detailsExtra.printPdf')}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleCompare(scheme as SchemeData)}
              aria-pressed={compared}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                compared
                  ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                  : 'bg-[var(--cream)] text-[var(--navy)] border-[var(--line)] hover:border-[var(--navy)]'
              }`}
            >
              <ScaleIcon size={16} />
              <span>
                {compared ? t('comparePage.addedCompare') : t('comparePage.addCompare')}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                : 'bg-[var(--paper)] text-[var(--navy)] border-[var(--navy)] hover:bg-[var(--navy)] hover:text-[var(--cream)]'
            }`}
          >
            <BookmarkIcon size={16} filled={isSaved} />
            <span>{isSaved ? t('recommendations.saved') : t('recommendations.save')}</span>
          </button>

          {speechNotice && (
            <p className="w-full text-xs font-medium text-[var(--muted)] pt-1" role="status">
              {speechNotice}
            </p>
          )}
        </section>

        {/* Two-Column Grid: Key Facts Table + Interactive Documents Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 editorial-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] bg-[var(--cream)]">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--navy)]">
                {t('detailsExtra.keyFactsTitle')}
              </h2>
            </div>

            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-[var(--line)] text-base">
                <tr className="flex flex-col sm:table-row odd:bg-[var(--paper)] even:bg-[var(--cream)]/50">
                  <th
                    scope="row"
                    className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--navy)] align-top"
                  >
                    {t('schemeDetails.benefits')}
                  </th>
                  <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--navy)]">
                    {displayBenefits && displayBenefits.length > 0 ? (
                      <ul className="space-y-2">
                        {displayBenefits.map((benefit: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span
                              className="mt-1 w-5 h-5 rounded-full bg-[var(--success-bg)] text-[var(--success)] inline-flex items-center justify-center shrink-0"
                              aria-hidden="true"
                            >
                              <CheckIcon size={12} />
                            </span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[var(--muted)]">
                        Detailed benefits specified on official department page.
                      </span>
                    )}
                  </td>
                </tr>

                <tr className="flex flex-col sm:table-row odd:bg-[var(--paper)] even:bg-[var(--cream)]/50">
                  <th
                    scope="row"
                    className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--navy)] align-top"
                  >
                    {t('schemeDetails.level')}
                  </th>
                  <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--navy)]">
                    {scheme.level === 'central'
                      ? t('schemesPage.levelCentral')
                      : t('schemesPage.levelState')}
                  </td>
                </tr>

                <tr className="flex flex-col sm:table-row odd:bg-[var(--paper)] even:bg-[var(--cream)]/50">
                  <th
                    scope="row"
                    className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--navy)] align-top"
                  >
                    {t('schemeDetails.state')}
                  </th>
                  <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--navy)]">
                    {scheme.state || 'All'}
                  </td>
                </tr>

                <tr className="flex flex-col sm:table-row odd:bg-[var(--paper)] even:bg-[var(--cream)]/50">
                  <th
                    scope="row"
                    className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--navy)] align-top"
                  >
                    {t('schemeDetails.lastVerified')}
                  </th>
                  <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--navy)] tabular-nums inline-flex items-center gap-2">
                    <CalendarIcon size={15} className="text-[var(--muted)]" />
                    <span>
                      {formattedDate || 'Not yet verified — confirm on official portal'}
                    </span>
                  </td>
                </tr>

                <tr className="flex flex-col sm:table-row odd:bg-[var(--paper)] even:bg-[var(--cream)]/50">
                  <th
                    scope="row"
                    className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--navy)] align-top"
                  >
                    {t('schemeDetails.officialSource')}
                  </th>
                  <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4">
                    <a
                      href={scheme.sourceUrl || 'https://www.myscheme.gov.in/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-ink)] hover:text-[var(--navy)] font-semibold underline underline-offset-2 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>{sourceHost}</span>
                      <ExternalLinkIcon size={14} />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Interactive Documents Checklist */}
          <section className="lg:col-span-5 editorial-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <FileCheckIcon size={20} className="text-[var(--accent-ink)]" />
                <h2 className="font-display text-xl font-bold text-[var(--navy)]">
                  {t('schemeDetails.documents')}
                </h2>
              </div>

              {checklistProgress.total > 0 && (
                <span className="px-3 py-1 rounded-full bg-[var(--badge-high-bg)] text-[var(--badge-high-text)] text-xs font-bold tabular-nums shrink-0">
                  {t('detailsExtra.checklistProgress', {
                    done: checklistProgress.done,
                    total: checklistProgress.total,
                  })}
                </span>
              )}
            </div>

            {checklistProgress.total > 0 && (
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-[var(--cream)] border border-[var(--line)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-200"
                    style={{ width: `${checklistProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {t('detailsExtra.checklistHint')}
                </p>
              </div>
            )}

            {docsList.length > 0 ? (
              <ul className="space-y-2.5 pt-1">
                {docsList.map((doc: string, idx: number) => {
                  const checked = Boolean(docChecks[idx]);
                  return (
                    <li key={idx}>
                      <label
                        className={`min-h-[44px] flex items-start gap-3 p-3 rounded-[12px] border transition-colors cursor-pointer ${
                          checked
                            ? 'bg-[var(--success-bg)] border-[var(--success-border)]'
                            : 'bg-[var(--cream)]/60 border-[var(--line)] hover:border-[var(--navy)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleChecklist(idx)}
                          className="w-5 h-5 mt-0.5 accent-[var(--navy)] cursor-pointer shrink-0"
                        />
                        <span
                          className={`text-sm sm:text-base leading-snug ${
                            checked
                              ? 'text-[var(--navy)] font-semibold line-through decoration-[var(--success)]/70'
                              : 'text-[var(--navy)]'
                          }`}
                        >
                          {doc}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Standard residence and family category proof.
              </p>
            )}
          </section>
        </div>

        {/* Eligibility Criteria Section */}
        <section className="editorial-card p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--navy)]">
              {t('schemeDetails.eligibilityRules')}
            </h2>
            <p className="text-base text-[var(--muted)] mt-1">
              The following conditions determine whether this scheme may be relevant for your profile:
            </p>
          </div>

          {criteria && criteria.rules && criteria.rules.length > 0 ? (
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {criteria.rules.map((rule: any, idx: number) => (
                <li key={idx} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-7 h-7 rounded-full bg-[var(--success-bg)] text-[var(--success)] inline-flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <CheckIcon size={15} />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-[var(--navy)]">
                        {rule.label || `${rule.field} ${rule.op} ${rule.value}`}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        Profile field: {rule.field}
                      </p>
                    </div>
                  </div>
                  {rule.required !== false && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--badge-high-bg)] text-[var(--badge-high-text)] shrink-0">
                      Mandatory
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-[var(--muted)]">No special restrictions specified.</p>
          )}
        </section>

        {/* Official Website Primary CTA + Mandatory Notice */}
        <section className="no-print flex flex-wrap items-center gap-3.5">
          <a
            href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOfficialClick}
            className="btn-accent-pill inline-flex items-center justify-center gap-2 px-7 py-3 text-base"
          >
            <span>{t('schemeDetails.openOfficial')}</span>
            <ExternalLinkIcon size={16} />
          </a>

          <button
            type="button"
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className="btn-outline-pill inline-flex items-center justify-center gap-2 px-6 py-3 text-base cursor-pointer"
          >
            <BookmarkIcon size={16} filled={isSaved} />
            <span>{isSaved ? t('recommendations.saved') : t('recommendations.save')}</span>
          </button>
        </section>

        <div className="p-5 rounded-[16px] bg-[var(--badge-high-bg)] border border-[var(--line)] text-sm text-[var(--navy)] flex items-start gap-3">
          <AlertCircleIcon size={18} className="text-[var(--badge-high-text)] mt-0.5 shrink-0" />
          <p>
            <strong className="text-[var(--badge-high-text)]">Mandatory Notice:</strong>{' '}
            {t('schemeDetails.notice')}
          </p>
        </div>
      </div>

      {/* Compact Sticky Mobile Bottom Bar */}
      <div
        className={`mobile-sticky-bar no-print sm:hidden fixed inset-x-0 z-30 bg-[var(--paper)] border-t border-[var(--line)] px-4 py-2.5 flex items-center gap-2.5 shadow-[var(--shadow-paper)] ${
          compareIds.length > 0 ? 'bottom-[68px]' : 'bottom-0'
        }`}
      >
        <a
          href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOfficialClick}
          className="btn-accent-pill flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm"
        >
          <span>{t('recommendations.officialPage')}</span>
          <ExternalLinkIcon size={14} />
        </a>

        <button
          type="button"
          onClick={handleSaveToggle}
          disabled={saveLoading}
          className="btn-outline-pill min-h-[44px] px-4 py-2 inline-flex items-center justify-center gap-1.5 text-sm cursor-pointer"
        >
          <BookmarkIcon size={15} filled={isSaved} />
          <span>{isSaved ? t('recommendations.saved') : t('recommendations.save')}</span>
        </button>
      </div>
    </div>
  );
};

export default SchemeDetails;
