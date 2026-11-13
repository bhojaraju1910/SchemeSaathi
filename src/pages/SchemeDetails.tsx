import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import SampleBadge from '../components/SampleBadge';
import EmptyState from '../components/EmptyState';
import CategoryIcon, { getCategoryPalette } from '../components/CategoryIcon';
import { getHardcodedSchemeById } from '../services/schemeMirrorService';
import {
  addMirrorSavedScheme,
  getMirrorSavedSchemes,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';
import { ArrowLeft, Bookmark, ExternalLink, Loader2 } from 'lucide-react';

export const SchemeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const initialScheme = id ? getHardcodedSchemeById(id) : null;
  const [data, setData] = useState<any>(initialScheme);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!initialScheme);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScheme() {
      if (!id) return;
      const hardcodedMatch = getHardcodedSchemeById(id);
      if (hardcodedMatch) {
        setData(hardcodedMatch);
        setError(null);
        setLoading(false);
      } else {
        setLoading(true);
      }

      if (user) {
        const localSaved = getMirrorSavedSchemes(user.id).some((s) => s.schemeId === id);
        if (localSaved) setIsSaved(true);
      }

      try {
        const [schemeRes, savedRes] = await Promise.all([
          api.get(`/schemes/${id}`),
          user && !isMirrorToken(token) ? api.get('/saved') : Promise.resolve({ data: null }),
        ]);

        if (schemeRes.data?.scheme) {
          setData(schemeRes.data);
          setError(null);
        }

        if (user && Array.isArray(savedRes.data)) {
          const found = savedRes.data.some((s: any) => s.schemeId === id);
          setIsSaved(found);
        }
      } catch (err: any) {
        console.error('Failed to load scheme details from API:', err);
        if (hardcodedMatch) {
          setData(hardcodedMatch);
          setError(null);
        } else {
          setError('Scheme could not be loaded or was removed.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadScheme();
  }, [id, user, token]);

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
        addMirrorSavedScheme(user.id, id);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-[var(--teal)] animate-spin" />
        <p className="text-base text-[var(--text-muted)]">Loading scheme details...</p>
      </div>
    );
  }

  if (error || !data || !data.scheme) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-12">
        <EmptyState
          title="Scheme Not Found"
          description={error || 'The requested scheme does not exist.'}
          actionText="Back to Directory"
          actionLink="/schemes"
        />
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

  const displayBenefits =
    hasTranslation && scheme.translations[currentLang]?.benefits?.length
      ? scheme.translations[currentLang].benefits
      : scheme.benefits;

  const formattedDate = scheme.lastVerified
    ? new Date(scheme.lastVerified).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  const sourceHost = (() => {
    try {
      return scheme.sourceUrl ? new URL(scheme.sourceUrl).hostname : 'myscheme.gov.in';
    } catch {
      return 'myscheme.gov.in';
    }
  })();

  const palette = getCategoryPalette(scheme.category);
  const categoryLabel = String(t(`categories.${scheme.category}`, scheme.category));
  const levelLabel =
    scheme.level === 'central'
      ? t('schemesPage.levelCentral')
      : `${scheme.state || 'State'} ${t('schemesPage.levelState')}`;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-hover)] transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('schemeDetails.back')}</span>
        </Link>
      </div>

      {/* Category Tinted Header Block */}
      <section
        className="border border-[var(--border)] rounded-[6px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start gap-5"
        style={{ backgroundColor: palette.bg }}
      >
        <span
          className="w-12 h-12 rounded-[6px] border border-[var(--border)] inline-flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--surface)', color: palette.fg }}
        >
          <CategoryIcon kind={scheme.category} size={26} />
        </span>

        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold border border-[var(--border)]"
              style={{ backgroundColor: 'var(--surface)', color: palette.fg }}
            >
              {categoryLabel}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[var(--medium-bg)] text-[var(--medium-text)] border border-[var(--medium-border)]">
              {levelLabel}
            </span>
            {scheme.isSample && <SampleBadge />}
          </div>

          <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
            {displayTitle}
          </h1>

          {!hasTranslation && currentLang !== 'en' && (
            <p className="text-sm text-[var(--text-primary)] italic">
              ({t('shownInEnglish')})
            </p>
          )}

          <p className="text-base text-[var(--text-primary)] leading-relaxed max-w-3xl">
            {displayDescription}
          </p>
        </div>
      </section>

      {/* Two-Column Key Facts Table with subtle zebra rows */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]">
          <h2 className="text-[22px] font-bold text-[var(--text-primary)]">
            Key Scheme Facts
          </h2>
        </div>

        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-[var(--border)] text-base">
            <tr className="flex flex-col sm:table-row odd:bg-[var(--surface)] even:bg-[var(--bg-page)]">
              <th scope="row" className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--text-primary)] align-top">
                {t('schemeDetails.benefits')}
              </th>
              <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--text-primary)]">
                {displayBenefits && displayBenefits.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {displayBenefits.map((benefit: string, idx: number) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[var(--text-muted)]">Detailed benefits specified on official department page.</span>
                )}
              </td>
            </tr>

            <tr className="flex flex-col sm:table-row odd:bg-[var(--surface)] even:bg-[var(--bg-page)]">
              <th scope="row" className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--text-primary)] align-top">
                {t('schemeDetails.documents')}
              </th>
              <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--text-primary)]">
                {scheme.documentsRequired && scheme.documentsRequired.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {scheme.documentsRequired.map((doc: string, idx: number) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[var(--text-muted)]">Standard residence and family category proof.</span>
                )}
              </td>
            </tr>

            <tr className="flex flex-col sm:table-row odd:bg-[var(--surface)] even:bg-[var(--bg-page)]">
              <th scope="row" className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--text-primary)] align-top">
                {t('schemeDetails.level')}
              </th>
              <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--text-primary)]">
                {scheme.level === 'central'
                  ? t('schemesPage.levelCentral')
                  : t('schemesPage.levelState')}
              </td>
            </tr>

            <tr className="flex flex-col sm:table-row odd:bg-[var(--surface)] even:bg-[var(--bg-page)]">
              <th scope="row" className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--text-primary)] align-top">
                {t('schemeDetails.state')}
              </th>
              <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--text-primary)]">
                {scheme.state || 'All'}
              </td>
            </tr>

            <tr className="flex flex-col sm:table-row odd:bg-[var(--surface)] even:bg-[var(--bg-page)]">
              <th scope="row" className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--text-primary)] align-top">
                {t('schemeDetails.lastVerified')}
              </th>
              <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4 text-[var(--text-primary)] tabular-nums">
                {formattedDate}
              </td>
            </tr>

            <tr className="flex flex-col sm:table-row odd:bg-[var(--surface)] even:bg-[var(--bg-page)]">
              <th scope="row" className="sm:w-1/3 px-6 pt-4 pb-1 sm:py-4 font-semibold text-[var(--text-primary)] align-top">
                {t('schemeDetails.officialSource')}
              </th>
              <td className="sm:w-2/3 px-6 pb-4 pt-1 sm:py-4">
                <a
                  href={scheme.sourceUrl || 'https://www.myscheme.gov.in/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-semibold underline underline-offset-2 inline-flex items-center gap-1 transition-colors duration-150"
                >
                  <span>{sourceHost}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Eligibility Criteria Section with small teal check marks */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-6 sm:p-8 space-y-4">
        <h2 className="text-[22px] font-bold text-[var(--text-primary)]">
          {t('schemeDetails.eligibilityRules')}
        </h2>
        <p className="text-base text-[var(--text-muted)]">
          The following conditions determine whether this scheme is flagged as potentially relevant for your profile:
        </p>

        {criteria && criteria.rules && criteria.rules.length > 0 ? (
          <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {criteria.rules.map((rule: any, idx: number) => (
              <li key={idx} className="py-3.5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 w-6 h-6 rounded-[6px] bg-[var(--teal-tint)] text-[var(--teal)] inline-flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[var(--text-primary)]">
                      {rule.label || `${rule.field} ${rule.op} ${rule.value}`}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Profile field: {rule.field}
                    </p>
                  </div>
                </div>
                {rule.required !== false && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-[6px] bg-[var(--saffron-tint)] text-[var(--saffron-tint-text)] border border-[var(--saffron-border)] shrink-0">
                    Mandatory
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base text-[var(--text-muted)]">No special restrictions specified.</p>
        )}
      </section>

      {/* Prominent Saffron Official Button + Save Button */}
      <section className="flex flex-wrap items-center gap-3">
        <a
          href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOfficialClick}
          className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[6px] text-base font-semibold bg-[var(--saffron)] hover:bg-[var(--saffron-hover)] text-[var(--saffron-text)] transition-colors duration-150"
        >
          <span>{t('schemeDetails.openOfficial')}</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={handleSaveToggle}
          disabled={saveLoading}
          className={`min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[6px] text-base font-semibold border transition-colors duration-150 cursor-pointer ${
            isSaved
              ? 'bg-[var(--teal)] text-[var(--deep-text)] border-[var(--teal)] hover:bg-[var(--teal-hover)]'
              : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--teal)] hover:text-[var(--teal)]'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          <span>{isSaved ? t('recommendations.saved') : t('recommendations.save')}</span>
        </button>
      </section>

      {/* Mandatory Notice */}
      <div className="p-4 rounded-[6px] bg-[var(--saffron-tint)] border border-[var(--saffron-border)] text-sm text-[var(--text-primary)]">
        <strong className="text-[var(--saffron-tint-text)]">Mandatory Notice:</strong> {t('schemeDetails.notice')}
      </div>
    </div>
  );
};

export default SchemeDetails;
