import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import SampleBadge from '../components/SampleBadge';
import EmptyState from '../components/EmptyState';
import { getHardcodedSchemeById } from '../services/schemeMirrorService';
import {
  addMirrorSavedScheme,
  getMirrorSavedSchemes,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Loader2,
  Scale,
  Award,
} from 'lucide-react';

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
        <Loader2 className="w-8 h-8 text-[#5AA9FF] animate-spin" />
        <p className="text-sm text-[#9FB0C8]">Loading scheme specifications...</p>
      </div>
    );
  }

  if (error || !data || !data.scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          title="Scheme Not Found"
          description={error || "The requested scheme does not exist."}
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

  const displayDescription = hasTranslation && scheme.translations[currentLang]?.shortDescription
    ? scheme.translations[currentLang].shortDescription
    : scheme.shortDescription;

  const displayBenefits = hasTranslation && scheme.translations[currentLang]?.benefits?.length
    ? scheme.translations[currentLang].benefits
    : scheme.benefits;

  const formattedDate = scheme.lastVerified
    ? new Date(scheme.lastVerified).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#9FB0C8] hover:text-[#5AA9FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('schemeDetails.back')}</span>
        </Link>
      </div>

      {/* Main Scheme Hero Banner */}
      <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#5AA9FF]/10 text-[#5AA9FF] border border-[#5AA9FF]/20">
              {String(t(`categories.${scheme.category}`, scheme.category))}
            </span>
            <span className="text-xs px-3 py-1 rounded-lg bg-[#243A63]/60 text-[#9FB0C8] border border-[#243A63] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#9FB0C8]" />
              {scheme.level === 'central'
                ? t('schemesPage.levelCentral')
                : `${scheme.state || 'State'} ${t('schemesPage.levelState')}`}
            </span>
            {scheme.isSample && <SampleBadge />}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveToggle}
              disabled={saveLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-[#FF7BA5]/15 text-[#FF7BA5] border border-[#FF7BA5]/40'
                  : 'bg-[#0B1426] text-[#EAF1FB] border border-[#243A63] hover:border-[#5AA9FF]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? t('recommendations.saved') : t('recommendations.save')}</span>
            </button>

            <a
              href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOfficialClick}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 transition-all shadow-md shadow-[#5AA9FF]/15"
            >
              <span>{t('schemeDetails.openOfficial')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#EAF1FB] font-heading leading-tight mb-2">
            {displayTitle}
          </h1>
          {!hasTranslation && currentLang !== 'en' && (
            <span className="text-xs text-[#9FB0C8] italic">
              ({t('shownInEnglish')})
            </span>
          )}
        </div>

        <p className="text-base text-[#9FB0C8] leading-relaxed max-w-4xl">
          {displayDescription}
        </p>

        {/* Verification and source meta info */}
        <div className="pt-4 border-t border-[#243A63]/60 flex flex-wrap items-center justify-between gap-4 text-xs text-[#9FB0C8]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5AA9FF]" />
            <span>{t('schemeDetails.lastVerified')}:</span>
            <span className="text-[#EAF1FB] font-medium">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{t('schemeDetails.officialSource')}:</span>
            <a
              href={scheme.sourceUrl || 'https://www.myscheme.gov.in/'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5AA9FF] hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>{scheme.sourceUrl ? new URL(scheme.sourceUrl).hostname : 'myscheme.gov.in'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Benefits & Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Benefits Card */}
        <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Award className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-[#EAF1FB] font-heading">
              {t('schemeDetails.benefits')}
            </h2>
          </div>
          <ul className="space-y-3">
            {displayBenefits && displayBenefits.length > 0 ? (
              displayBenefits.map((benefit: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#EAF1FB]/90 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                  <span>{benefit}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-[#9FB0C8]">Detailed benefits specified on official department page.</li>
            )}
          </ul>
        </div>

        {/* Required Documents Card */}
        <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-[#5AA9FF]">
            <FileText className="w-5 h-5 text-[#5AA9FF]" />
            <h2 className="text-lg font-bold text-[#EAF1FB] font-heading">
              {t('schemeDetails.documents')}
            </h2>
          </div>
          <ul className="space-y-3">
            {scheme.documentsRequired && scheme.documentsRequired.length > 0 ? (
              scheme.documentsRequired.map((doc: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#EAF1FB]/90 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5AA9FF] shrink-0 mt-2"></span>
                  <span>{doc}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-[#9FB0C8]">Standard residence and family category proof.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Eligibility Rules (Plain Language) */}
      <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-[#F7B6CE]">
          <Scale className="w-5 h-5 text-[#FF7BA5]" />
          <h2 className="text-lg font-bold text-[#EAF1FB] font-heading">
            {t('schemeDetails.eligibilityRules')}
          </h2>
        </div>

        <p className="text-xs text-[#9FB0C8]">
          The following conditions determine whether this scheme is flagged as potentially relevant for your profile:
        </p>

        {criteria && criteria.rules && criteria.rules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {criteria.rules.map((rule: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#0B1426] border border-[#243A63] flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-lg bg-[#5AA9FF]/10 text-[#5AA9FF] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#EAF1FB]">
                    {rule.label || `${rule.field} ${rule.op} ${rule.value}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold text-[#9FB0C8] px-1.5 py-0.5 rounded bg-[#14213B] border border-[#243A63]">
                      Field: {rule.field}
                    </span>
                    {rule.required !== false && (
                      <span className="text-[10px] text-amber-300 font-semibold">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#9FB0C8]">No special restrictions specified.</p>
        )}
      </div>

      {/* Advisory Callout */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Mandatory Notice:</strong> {t('schemeDetails.notice')}
        </p>
      </div>
    </div>
  );
};

export default SchemeDetails;
