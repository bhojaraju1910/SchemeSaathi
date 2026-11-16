import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import { CheckCircleIcon, LoaderIcon, MessageIcon } from '../components/Icons';

type SuggestionType = 'scheme' | 'feature' | 'other';

const SCHEME_STATES = [
  'Central Government',
  'Karnataka',
  'Andhra Pradesh',
  'Delhi',
  'Gujarat',
  'Kerala',
  'Maharashtra',
  'Odisha',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Other State / UT',
];

const TITLE_MAX = 100;
const DETAILS_MAX = 1000;

export const Suggest: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const stateNav = (location.state as { type?: SuggestionType; message?: string } | null) || null;
  const queryType = searchParams.get('type') as SuggestionType | null;
  const queryMessage = searchParams.get('message');

  const initialType: SuggestionType =
    stateNav?.type && ['scheme', 'feature', 'other'].includes(stateNav.type)
      ? stateNav.type
      : queryType && ['scheme', 'feature', 'other'].includes(queryType)
        ? queryType
        : 'scheme';

  const initialMessage = stateNav?.message || queryMessage || '';

  const [type, setType] = useState<SuggestionType>(initialType);
  const [schemeName, setSchemeName] = useState('');
  const [schemeState, setSchemeState] = useState('Karnataka');
  const [targetGroup, setTargetGroup] = useState('');
  const [schemeLink, setSchemeLink] = useState('');

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState(initialMessage);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (queryType && ['scheme', 'feature', 'other'].includes(queryType)) {
      setType(queryType);
    }
    if (queryMessage) {
      setDetails(queryMessage.slice(0, DETAILS_MAX));
    }
  }, [queryType, queryMessage]);

  const validateClient = (): boolean => {
    const errs: Record<string, string> = {};

    if (type === 'scheme') {
      if (!schemeName.trim()) {
        errs.schemeName = 'Please enter the scheme name.';
      } else if (schemeName.trim().length > TITLE_MAX) {
        errs.schemeName = `Scheme name must be ${TITLE_MAX} characters or fewer.`;
      }
      if (schemeLink.trim()) {
        try {
          const parsed = new URL(schemeLink.trim());
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            errs.schemeLink = 'Official link must start with http:// or https://.';
          }
        } catch {
          errs.schemeLink = 'Please enter a valid official URL (e.g. https://...).';
        }
      }
    } else if (type === 'feature') {
      if (!title.trim()) {
        errs.title = 'Please enter a short title for the feature.';
      } else if (title.trim().length > TITLE_MAX) {
        errs.title = `Short title must be ${TITLE_MAX} characters or fewer.`;
      }
      if (!details.trim()) {
        errs.details = 'Please describe what the feature should do.';
      } else if (details.trim().length > DETAILS_MAX) {
        errs.details = `Description must be ${DETAILS_MAX} characters or fewer.`;
      }
    } else if (type === 'other') {
      if (!details.trim()) {
        errs.details = 'Please enter your message.';
      } else if (details.trim().length > DETAILS_MAX) {
        errs.details = `Message must be ${DETAILS_MAX} characters or fewer.`;
      }
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address or leave it blank.';
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setSchemeName('');
    setSchemeState('Karnataka');
    setTargetGroup('');
    setSchemeLink('');
    setTitle('');
    setDetails('');
    setName('');
    setEmail('');
    setHoneypot('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!validateClient()) return;

    setSubmitting(true);
    try {
      const payload = {
        type,
        title: title.trim(),
        details: details.trim(),
        schemeName: schemeName.trim(),
        schemeState: type === 'scheme' ? schemeState : '',
        schemeLink: type === 'scheme' ? schemeLink.trim() : '',
        targetGroup: type === 'scheme' ? targetGroup.trim() : '',
        name: name.trim(),
        email: email.trim(),
        website: honeypot,
        ...(user?.id ? { userId: user.id } : {}),
      };

      const res = await api.post('/suggestions', payload);
      setSuccessMsg(res.data?.message || t('suggestPage.successMsg'));
      resetForm();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Could not send your suggestion right now. Please check your entries and try again.';
      setError(msg);
      if (err?.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Community Input"
        title={
          <>
            Help Us <AccentWord>Improve</AccentWord> SchemeSaathi
          </>
        }
        subtitle={t('suggestPage.subtitle')}
      />

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 editorial-card p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-[var(--line)] space-y-1">
              <p className="eyebrow text-[var(--accent-ink)]">01 · Suggestion Form</p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--navy)] leading-tight">
                {t('suggestPage.title')}
              </h2>
            </div>

          {error && (
            <div
              className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[12px] text-sm font-semibold text-[var(--error)]"
              role="alert"
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              className="p-4 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-[12px] flex items-center gap-3 text-sm font-bold text-[var(--success)]"
              role="status"
            >
              <CheckCircleIcon size={20} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Hidden honeypot */}
            <div
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
              aria-hidden="true"
            >
              <label htmlFor="suggest-website">Website</label>
              <input
                id="suggest-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-[var(--navy)]">
                {t('suggestPage.typeLabel')}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: 'scheme' as const, label: t('suggestPage.typeScheme') },
                  { value: 'feature' as const, label: t('suggestPage.typeFeature') },
                  { value: 'other' as const, label: t('suggestPage.typeOther') },
                ].map((opt) => {
                  const selected = type === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`min-h-[48px] flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm font-bold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                          : 'bg-[var(--cream)] border-[var(--line)] text-[var(--navy)] hover:border-[var(--navy)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="suggestionType"
                        value={opt.value}
                        checked={selected}
                        onChange={() => {
                          setType(opt.value);
                          setError(null);
                          setFieldErrors({});
                        }}
                        className="w-4 h-4 accent-[var(--accent)]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {type === 'scheme' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <label htmlFor="suggest-scheme-name" className="block text-sm font-bold text-[var(--navy)]">
                      {t('suggestPage.schemeName')} *
                    </label>
                    <span className="text-xs text-[var(--muted)] tabular-nums">
                      {schemeName.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <input
                    id="suggest-scheme-name"
                    type="text"
                    maxLength={TITLE_MAX}
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                    placeholder={t('suggestPage.schemeNamePlaceholder')}
                    className="editorial-input w-full px-4 py-2.5 text-base"
                  />
                  {fieldErrors.schemeName && (
                    <p className="text-xs text-[var(--error)] mt-1">{fieldErrors.schemeName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="suggest-scheme-state" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                    {t('suggestPage.schemeLevelState')}
                  </label>
                  <select
                    id="suggest-scheme-state"
                    value={schemeState}
                    onChange={(e) => setSchemeState(e.target.value)}
                    className="editorial-input w-full px-4 py-2.5 text-base cursor-pointer"
                  >
                    {SCHEME_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="suggest-target-group" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                    {t('suggestPage.targetGroup')}
                  </label>
                  <input
                    id="suggest-target-group"
                    type="text"
                    maxLength={200}
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    placeholder={t('suggestPage.targetGroupPlaceholder')}
                    className="editorial-input w-full px-4 py-2.5 text-base"
                  />
                </div>

                <div>
                  <label htmlFor="suggest-scheme-link" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                    {t('suggestPage.schemeLink')}
                  </label>
                  <input
                    id="suggest-scheme-link"
                    type="url"
                    maxLength={500}
                    value={schemeLink}
                    onChange={(e) => setSchemeLink(e.target.value)}
                    placeholder={t('suggestPage.schemeLinkPlaceholder')}
                    className="editorial-input w-full px-4 py-2.5 text-base"
                  />
                  {fieldErrors.schemeLink && (
                    <p className="text-xs text-[var(--error)] mt-1">{fieldErrors.schemeLink}</p>
                  )}
                </div>
              </div>
            )}

            {type === 'feature' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <label htmlFor="suggest-feature-title" className="block text-sm font-bold text-[var(--navy)]">
                      {t('suggestPage.featureTitle')} *
                    </label>
                    <span className="text-xs text-[var(--muted)] tabular-nums">
                      {title.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <input
                    id="suggest-feature-title"
                    type="text"
                    maxLength={TITLE_MAX}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('suggestPage.featureTitlePlaceholder')}
                    className="editorial-input w-full px-4 py-2.5 text-base"
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-[var(--error)] mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <label htmlFor="suggest-feature-details" className="block text-sm font-bold text-[var(--navy)]">
                      {t('suggestPage.featureDetails')} *
                    </label>
                    <span className="text-xs text-[var(--muted)] tabular-nums">
                      {details.length}/{DETAILS_MAX}
                    </span>
                  </div>
                  <textarea
                    id="suggest-feature-details"
                    rows={4}
                    maxLength={DETAILS_MAX}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t('suggestPage.featureDetailsPlaceholder')}
                    className="editorial-input w-full px-4 py-3 text-base"
                  />
                  {fieldErrors.details && (
                    <p className="text-xs text-[var(--error)] mt-1">{fieldErrors.details}</p>
                  )}
                </div>
              </div>
            )}

            {type === 'other' && (
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <label htmlFor="suggest-other-message" className="block text-sm font-bold text-[var(--navy)]">
                    {t('suggestPage.otherMessage')} *
                  </label>
                  <span className="text-xs text-[var(--muted)] tabular-nums">
                    {details.length}/{DETAILS_MAX}
                  </span>
                </div>
                <textarea
                  id="suggest-other-message"
                  rows={4}
                  maxLength={DETAILS_MAX}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('suggestPage.otherMessagePlaceholder')}
                  className="editorial-input w-full px-4 py-3 text-base"
                />
                {fieldErrors.details && (
                  <p className="text-xs text-[var(--error)] mt-1">{fieldErrors.details}</p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-[var(--line)] space-y-4">
              <h2 className="font-display text-lg font-bold text-[var(--navy)]">
                {t('suggestPage.optionalContact')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="suggest-name" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                    {t('suggestPage.nameLabel')}
                  </label>
                  <input
                    id="suggest-name"
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('suggestPage.namePlaceholder')}
                    className="editorial-input w-full px-4 py-2.5 text-base"
                  />
                </div>

                <div>
                  <label htmlFor="suggest-email" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                    {t('suggestPage.emailLabel')}
                  </label>
                  <input
                    id="suggest-email"
                    type="email"
                    maxLength={150}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('suggestPage.emailPlaceholder')}
                    className="editorial-input w-full px-4 py-2.5 text-base"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-[var(--error)] mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[12px] bg-[var(--badge-high-bg)] border border-[var(--line)] text-sm text-[var(--badge-high-text)] font-semibold">
              {t('suggestPage.privacyNote')}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-accent-pill px-7 py-3 text-base inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <LoaderIcon size={17} />}
              <span>{submitting ? t('suggestPage.submitting') : t('suggestPage.submitBtn')}</span>
            </button>
          </form>
        </div>

        {/* Companion Navy Panel */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 hero-editorial-bg text-[var(--cream)] border border-[var(--line-dark)] rounded-[16px] p-6 sm:p-7 space-y-5 shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-2.5 text-[var(--accent)]">
            <MessageIcon size={18} />
            <span className="eyebrow">Community Review</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-[var(--cream)] leading-snug">
            How your <AccentWord>suggestions</AccentWord> help families
          </h2>

          <p className="text-sm text-[var(--muted-dark)] leading-relaxed">
            Every submitted scheme link or feature idea is reviewed by our editorial team and checked against official government notifications.
          </p>

          <div className="pt-4 border-t border-[var(--line-dark)] space-y-2 text-sm text-[var(--muted-dark)]">
            <p className="font-bold text-[var(--cream)]">Have a general question?</p>
            <Link
              to="/faq"
              className="inline-block text-[var(--accent)] hover:underline underline-offset-4 font-bold"
            >
              Visit SchemeSaathi Help & FAQ
            </Link>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
};

export default Suggest;
