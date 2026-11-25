import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MatchBadge from '../components/MatchBadge';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import FallbackNotice from '../components/FallbackNotice';
import { runQuickCheck } from '../utils/schemeTools';
import {
  loadEmergencySchemes,
  readSessionCache,
  withTimeout,
  writeSessionCache,
} from '../utils/clientCache';
import {
  getMirrorCatalog,
  getMirrorProfile,
  isMirrorToken,
  saveMirrorProfile,
  setMirrorCatalog,
} from '../services/authMirrorService';
import { ArrowRightIcon, LoaderIcon, ShieldIcon } from '../components/Icons';
import type { SchemeData } from '../components/SchemeCard';

const INDIAN_STATES = [
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Kerala',
  'Delhi',
  'Uttar Pradesh',
  'Bihar',
  'West Bengal',
  'Gujarat',
  'Rajasthan',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Odisha',
  'Assam',
];

const CATEGORY_KEYS = [
  { key: 'senior_citizen', labelKey: 'profile.cat_senior_citizen' },
  { key: 'student', labelKey: 'profile.cat_student' },
  { key: 'woman', labelKey: 'profile.cat_woman' },
  { key: 'farmer', labelKey: 'profile.cat_farmer' },
  { key: 'disabled', labelKey: 'profile.cat_disabled' },
  { key: 'child', labelKey: 'profile.cat_child' },
  { key: 'general', labelKey: 'profile.cat_general' },
];

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [age, setAge] = useState<string>('');
  const [state, setState] = useState<string>('Karnataka');
  const [incomeRange, setIncomeRange] = useState<string>('low');
  const [category, setCategory] = useState<string[]>([]);
  const [occupation, setOccupation] = useState<string>('');
  const [familySize, setFamilySize] = useState<string>('');

  const [previewCatalog, setPreviewCatalog] = useState<any[]>(() => getMirrorCatalog());
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [debouncedPreviewInput, setDebouncedPreviewInput] = useState({
    age: '',
    state: 'Karnataka',
    incomeRange: 'low',
    categories: [] as string[],
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedPreviewInput({
        age,
        state,
        incomeRange,
        categories: category,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [age, state, incomeRange, category]);

  const applyProfileState = (d: any) => {
    const nextAge = d.age !== null && d.age !== undefined ? String(d.age) : '';
    const nextState = d.state || 'Karnataka';
    const nextIncome = d.incomeRange || 'low';
    const nextCats = Array.isArray(d.category) ? d.category : [];
    setAge(nextAge);
    setState(nextState);
    setIncomeRange(nextIncome);
    setCategory(nextCats);
    setOccupation(d.occupation || '');
    setFamilySize(d.familySize !== null && d.familySize !== undefined ? String(d.familySize) : '');
    setDebouncedPreviewInput({
      age: nextAge,
      state: nextState,
      incomeRange: nextIncome,
      categories: nextCats,
    });
  };

  useEffect(() => {
    async function loadProfileAndCatalog() {
      const loadCatalog = async () => {
        if (getMirrorCatalog().length > 0) {
          setPreviewCatalog(getMirrorCatalog());
          return;
        }
        const cached = readSessionCache<SchemeData[]>('ss_cache_quick_catalog');
        if (cached?.data && cached.data.length > 0) {
          setMirrorCatalog(cached.data as any);
          setPreviewCatalog(cached.data);
          return;
        }
        try {
          const res = await withTimeout(
            (signal) => api.get('/schemes/quick-catalog', { signal }),
            4000
          );
          if (Array.isArray(res.data?.schemes) && res.data.schemes.length > 0) {
            setMirrorCatalog(res.data.schemes);
            writeSessionCache('ss_cache_quick_catalog', res.data.schemes);
            setPreviewCatalog(res.data.schemes);
            setIsFallback(false);
            return;
          }
        } catch {
          // fallback
        }
        const emergency = await loadEmergencySchemes();
        setMirrorCatalog(emergency);
        setPreviewCatalog(emergency);
        setIsFallback(true);
      };

      const loadProfile = async () => {
        if (isMirrorToken(token) && user) {
          applyProfileState(getMirrorProfile(user.id));
          return;
        }
        try {
          const res = await withTimeout(
            (signal) => api.get('/profile', { signal }),
            4000
          );
          if (res.data && typeof res.data === 'object') {
            applyProfileState(res.data);
            if (user) {
              saveMirrorProfile(user.id, res.data);
            }
          }
        } catch {
          if (user) {
            applyProfileState(getMirrorProfile(user.id));
          }
        }
      };

      await Promise.all([loadProfile(), loadCatalog()]);
      setLoading(false);
    }
    loadProfileAndCatalog();
  }, [user, token]);

  const handleCategoryToggle = (catKey: string) => {
    setCategory((prev) =>
      prev.includes(catKey) ? prev.filter((c) => c !== catKey) : [...prev, catKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    const payload = {
      age: age ? Number(age) : null,
      state,
      incomeRange,
      category,
      occupation,
      familySize: familySize ? Number(familySize) : undefined,
    };

    if (user) {
      saveMirrorProfile(user.id, payload);
    }

    if (isMirrorToken(token)) {
      setSavedSuccess(true);
      setSaving(false);
      return;
    }

    try {
      await api.put('/profile', {
        ...payload,
        familySize: familySize ? Number(familySize) : null,
      });
      setSavedSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile on server.');
    } finally {
      setSaving(false);
    }
  };

  const livePreview = runQuickCheck(debouncedPreviewInput, previewCatalog);

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Household Details"
        title={
          <>
            Your <AccentWord>Family</AccentWord> Profile
          </>
        }
        subtitle={t('profile.subtitle')}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {isFallback && <FallbackNotice />}

        {loading ? (
          <div className="editorial-card p-8 h-80 flex flex-col items-center justify-center gap-3">
            <LoaderIcon size={28} className="text-[var(--accent-ink)]" />
            <p className="text-base text-[var(--muted)]">Loading your profile...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Card */}
            <div className="lg:col-span-7 editorial-card p-6 sm:p-8 space-y-6">
              {error && (
                <div
                  className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[12px] text-sm font-semibold text-[var(--error)]"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {savedSuccess && (
                <div className="p-4 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[var(--success)]">
                    {t('profile.savedSuccess')}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/recommendations')}
                    className="btn-accent-pill min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2 text-sm cursor-pointer self-start sm:self-auto"
                  >
                    <span>{t('profile.seeSchemes')}</span>
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: About you */}
                <section className="space-y-4">
                  <div className="pb-2.5 border-b border-[var(--line)]">
                    <h2 className="font-display text-xl font-bold text-[var(--navy)]">
                      {t('profileExtra.sec1Title')}
                    </h2>
                    <p className="text-sm text-[var(--muted)] mt-0.5">
                      Age and family size help match pensions, student scholarships, and maternal grants.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="profile-age" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                        {t('profile.age')}
                      </label>
                      <input
                        id="profile-age"
                        type="number"
                        min="0"
                        max="125"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder={t('profile.agePlaceholder')}
                        className="editorial-input w-full px-4 py-2.5 text-base"
                      />
                    </div>

                    <div>
                      <label htmlFor="profile-family" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                        {t('profile.familySize')}
                      </label>
                      <input
                        id="profile-family"
                        type="number"
                        min="1"
                        max="30"
                        value={familySize}
                        onChange={(e) => setFamilySize(e.target.value)}
                        placeholder="e.g. 4"
                        className="editorial-input w-full px-4 py-2.5 text-base"
                      />
                    </div>
                  </div>
                </section>

                {/* Section 2: Where you live */}
                <section className="space-y-4">
                  <div className="pb-2.5 border-b border-[var(--line)]">
                    <h2 className="font-display text-xl font-bold text-[var(--navy)]">
                      {t('profileExtra.sec2Title')}
                    </h2>
                    <p className="text-sm text-[var(--muted)] mt-0.5">
                      Used to include state-specific programs alongside Central Government schemes.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="profile-state" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                      {t('profile.state')}
                    </label>
                    <select
                      id="profile-state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="editorial-input w-full px-4 py-2.5 text-base cursor-pointer"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* Section 3: Your situation */}
                <section className="space-y-5">
                  <div className="pb-2.5 border-b border-[var(--line)]">
                    <h2 className="font-display text-xl font-bold text-[var(--navy)]">
                      {t('profileExtra.sec3Title')}
                    </h2>
                    <p className="text-sm text-[var(--muted)] mt-0.5">
                      Approximate annual household income, applicable groups, and occupation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[var(--navy)]">{t('profile.incomeRange')}</p>
                    <div className="space-y-2">
                      {[
                        { value: 'low', label: t('profile.incomeLow') },
                        { value: 'lower_middle', label: t('profile.incomeLowerMiddle') },
                        { value: 'middle', label: t('profile.incomeMiddle') },
                        { value: 'high', label: t('profile.incomeHigh') },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`min-h-[48px] flex items-center gap-3 px-4 py-2.5 rounded-[12px] border text-base cursor-pointer transition-colors ${
                            incomeRange === opt.value
                              ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-semibold'
                              : 'bg-[var(--cream)] border-[var(--line)] text-[var(--navy)] hover:border-[var(--navy)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="incomeRange"
                            value={opt.value}
                            checked={incomeRange === opt.value}
                            onChange={() => setIncomeRange(opt.value)}
                            className="w-4 h-4 accent-[var(--accent)]"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[var(--navy)]">{t('profile.categoriesLabel')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {CATEGORY_KEYS.map((cat) => {
                        const checked = category.includes(cat.key);
                        return (
                          <label
                            key={cat.key}
                            className={`min-h-[48px] flex items-center gap-3 px-4 py-2.5 rounded-[12px] border text-base cursor-pointer transition-colors ${
                              checked
                                ? 'bg-[var(--badge-high-bg)] border-[var(--accent)] font-semibold text-[var(--navy)]'
                                : 'bg-[var(--cream)] border-[var(--line)] text-[var(--navy)] hover:border-[var(--navy)]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleCategoryToggle(cat.key)}
                              className="w-4 h-4 accent-[var(--accent)]"
                            />
                            <span>{t(cat.labelKey)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-occupation" className="block text-sm font-bold text-[var(--navy)] mb-1.5">
                      {t('profile.occupation')}
                    </label>
                    <input
                      id="profile-occupation"
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder={t('profile.occupationPlaceholder')}
                      className="editorial-input w-full px-4 py-2.5 text-base"
                    />
                  </div>
                </section>

                {/* Actions */}
                <div className="pt-6 border-t border-[var(--line)] flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-accent-pill px-7 py-3 text-base inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving && <LoaderIcon size={17} />}
                    <span>{t('profile.saveBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/recommendations')}
                    className="btn-outline-pill px-6 py-3 text-base cursor-pointer"
                  >
                    {t('profile.seeSchemes')}
                  </button>
                </div>
              </form>
            </div>

            {/* Sticky Sidebar: Live Match Preview + Privacy Pledge */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="editorial-card-dark p-6 sm:p-7 text-[var(--cream)] space-y-5">
                <div className="space-y-1.5 border-b border-[var(--line-dark)] pb-4">
                  <p className="eyebrow text-[var(--accent)]">Instant Evaluation</p>
                  <h2 className="font-display text-2xl font-bold text-[var(--cream)]">
                    {t('profileExtra.livePreviewTitle')}
                  </h2>
                  <p className="text-xs text-[var(--muted-dark)]">
                    {t('profileExtra.livePreviewNotice')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-[12px] bg-[var(--navy)] border border-[var(--line-dark)]">
                    <p className="text-xs font-semibold text-[var(--muted-dark)]">High Matches</p>
                    <p className="font-display text-3xl font-bold text-[var(--accent)] tabular-nums mt-1">
                      {livePreview.highCount}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[12px] bg-[var(--navy)] border border-[var(--line-dark)]">
                    <p className="text-xs font-semibold text-[var(--muted-dark)]">Medium Matches</p>
                    <p className="font-display text-3xl font-bold text-[var(--cream)] tabular-nums mt-1">
                      {livePreview.mediumCount}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {livePreview.topThree.length === 0 ? (
                    <p className="text-sm text-[var(--muted-dark)]">
                      {t('profileExtra.livePreviewEmpty')}
                    </p>
                  ) : (
                    livePreview.topThree.map((item) => (
                      <Link
                        key={item.scheme._id}
                        to={`/schemes/${item.scheme._id}`}
                        className="block p-3.5 rounded-[12px] bg-[var(--navy)] border border-[var(--line-dark)] hover:border-[var(--accent)] transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <MatchBadge match={item.match} />
                          <span className="text-xs text-[var(--muted-dark)]">{item.scheme.state}</span>
                        </div>
                        <p className="font-display text-sm font-bold text-[var(--cream)] leading-snug">
                          {item.scheme.title.split('(')[0].trim()}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="editorial-card p-6 space-y-3">
                <div className="flex items-center gap-2 text-[var(--accent-ink)]">
                  <ShieldIcon size={18} />
                  <span className="eyebrow">Privacy-First Matching</span>
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--navy)]">
                  Zero <AccentWord>sensitive</AccentWord> IDs needed
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  We never collect Aadhaar numbers, PAN cards, phone numbers, or bank accounts. Your saved details exist only to evaluate eligibility rules transparently.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
